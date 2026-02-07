#!/bin/bash
set -euo pipefail

# --- 1. Install Docker ---
apt-get update
apt-get install -y docker.io docker-compose-plugin git
systemctl enable --now docker

# --- 2. Fetch secrets from Secret Manager ---
fetch_secret() {
  gcloud secrets versions access latest --secret="$1" --project="${project_id}"
}

POSTGRES_PASSWORD=$(fetch_secret "postgres-admin-password")
DATA_WRITER_PASS=$(fetch_secret "data-writer-password")
DATA_READER_PASS=$(fetch_secret "data-reader-password")
METRICS_PASSWORD=$(fetch_secret "metrics-db-password")
METRICS_WRITER_PASS=$(fetch_secret "metrics-writer-password")
METRICS_READER_PASS=$(fetch_secret "metrics-reader-password")
GF_SECURITY_ADMIN_PASSWORD=$(fetch_secret "grafana-admin-password")
GHCR_TOKEN=$(fetch_secret "ghcr-token")

# --- 3. Auth to ghcr.io ---
echo "$GHCR_TOKEN" | docker login ghcr.io -u _token --password-stdin

# --- 4. Clone repo for config files ---
mkdir -p /opt/app
if [ ! -d /opt/app/repo ]; then
  git clone "https://github.com/${github_repo}.git" /opt/app/repo
else
  cd /opt/app/repo && git pull && cd /opt/app
fi

# --- 5. Write .env ---
cat > /opt/app/.env <<ENVEOF
POSTGRES_USER=admin
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=scraper_db

DATA_WRITER_PASS=$DATA_WRITER_PASS
DATA_READER_PASS=$DATA_READER_PASS

METRICS_USER=metrics_user
METRICS_PASSWORD=$METRICS_PASSWORD
METRICS_DB=metrics_db

METRICS_WRITER_PASS=$METRICS_WRITER_PASS
METRICS_READER_PASS=$METRICS_READER_PASS

GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=$GF_SECURITY_ADMIN_PASSWORD
ENVEOF

chmod 600 /opt/app/.env

# --- 6. Write production docker-compose.yml ---
cat > /opt/app/docker-compose.yml <<'COMPOSEEOF'
services:
  database:
    image: ${postgres_image}
    container_name: postgres
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - pgdata:/var/lib/postgresql/data
      - /opt/app/repo/database/init:/docker-entrypoint-initdb.d:ro
    ports:
      - "5432:5432"
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5

  migrate:
    image: node:24-alpine
    container_name: migrate
    working_dir: /app
    env_file:
      - .env
    volumes:
      - /opt/app/repo/database:/app
    networks:
      - app-network
    command: >
      sh -c "apk add --no-cache postgresql-client &&
             yarn install --frozen-lockfile &&
             DATABASE_URL=postgresql://$${POSTGRES_USER}:$${POSTGRES_PASSWORD}@database:5432/$${POSTGRES_DB} yarn prisma migrate deploy &&
             PGPASSWORD=$${POSTGRES_PASSWORD} psql -h database -U $${POSTGRES_USER} -d $${POSTGRES_DB} -v data_writer_pass=$${DATA_WRITER_PASS} -v data_reader_pass=$${DATA_READER_PASS} -f /app/init/001_users.sql"
    restart: "no"
    depends_on:
      database:
        condition: service_healthy

  timescaledb:
    image: ${timescaledb_image}
    container_name: timescaledb
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - POSTGRES_USER=$${METRICS_USER}
      - POSTGRES_PASSWORD=$${METRICS_PASSWORD}
      - POSTGRES_DB=$${METRICS_DB}
    volumes:
      - timescaledb_data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${METRICS_USER} -d $${METRICS_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5
    depends_on:
      database:
        condition: service_healthy

  metrics-migrate:
    image: ${postgres_image}
    container_name: metrics-migrate
    env_file:
      - .env
    volumes:
      - /opt/app/repo/metrics/schema:/scripts:ro
    networks:
      - app-network
    environment:
      - PGPASSWORD=$${METRICS_PASSWORD}
    command: >
      sh -c "for f in /scripts/*.sql; do
               echo \"Running $$f...\";
               psql -h timescaledb -U $${METRICS_USER} -d $${METRICS_DB} -v metrics_writer_pass=$${METRICS_WRITER_PASS} -v metrics_reader_pass=$${METRICS_READER_PASS} -f $$f;
             done"
    restart: "no"
    depends_on:
      timescaledb:
        condition: service_healthy

  api:
    image: ${api_image}
    container_name: api
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - DATABASE_URL=postgresql://data_reader:$${DATA_READER_PASS}@database:5432/$${POSTGRES_DB}
      - NODE_ENV=production
    networks:
      - app-network
    depends_on:
      migrate:
        condition: service_completed_successfully

  telegraf:
    image: ${telegraf_image}
    container_name: telegraf
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - /opt/app/repo/metrics/telegraf/telegraf.conf:/etc/telegraf/telegraf.conf:ro
      - telegraf_logs:/var/log/telegraf
    ports:
      - "8186:8186"
    networks:
      - app-network
    depends_on:
      metrics-migrate:
        condition: service_completed_successfully
      api:
        condition: service_started

  grafana:
    image: ${grafana_image}
    container_name: grafana
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - GF_SECURITY_ADMIN_USER=$${GF_SECURITY_ADMIN_USER}
      - GF_SECURITY_ADMIN_PASSWORD=$${GF_SECURITY_ADMIN_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - /opt/app/repo/metrics/grafana/provisioning:/etc/grafana/provisioning:ro
      - /opt/app/repo/metrics/grafana/dashboards:/var/lib/grafana/dashboards:ro
    networks:
      - app-network
    depends_on:
      migrate:
        condition: service_completed_successfully
      metrics-migrate:
        condition: service_completed_successfully

  cloudflared:
    image: ${cloudflared_image}
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel run --token ${tunnel_token}
    networks:
      - app-network
    depends_on:
      - api
      - grafana

networks:
  app-network:
    driver: bridge

volumes:
  pgdata:
  timescaledb_data:
  grafana_data:
  telegraf_logs:
COMPOSEEOF

# --- 7. Docker log rotation ---
cat > /etc/docker/daemon.json <<'DAEMONEOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
DAEMONEOF

systemctl restart docker

# --- 8. Start services ---
cd /opt/app
docker compose up -d
