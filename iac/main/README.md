# Main Infrastructure Module

Provisions the runtime infrastructure for Cyprus Price Watchdog: a private VPC with a GCE VM running services via Docker Compose, Cloudflare Tunnel for ingress, and Cloudflare Pages for the web frontend.

> **Prerequisite**: The [bootstrap](../bootstrap/) module must be applied first — it creates the GCP project, service accounts, WIF, secrets, and Cloudflare API token that this module depends on.

## Resources Created

### Google Cloud

| Resource | Name | Purpose |
|----------|------|---------|
| VPC Network | `{project_id}-vpc` | Custom-mode private network |
| Subnet | `{project_id}-subnet` | `10.0.0.0/24`, private Google access |
| Cloud Router + NAT | `{project_id}-router` / `nat` | Outbound internet for VM |
| Firewall (internal) | `{project_id}-allow-internal` | VPC-internal TCP/UDP/ICMP |
| Firewall (IAP SSH) | `{project_id}-allow-iap-ssh` | SSH via IAP (`35.235.240.0/20`) |
| Service Account | `vm-runtime@` | VM runtime identity |
| GCE VM | `{project_id}-vm` | Docker Compose host (no public IP) |

### Cloudflare

| Resource | Name | Purpose |
|----------|------|---------|
| Tunnel | `{project_id}-tunnel` | Ingress to VM services |
| CNAME | `api.{domain}` | Routes to API via tunnel |
| CNAME | `grafana.{domain}` | Routes to Grafana via tunnel |
| Pages Project | `{project_id}-web` | Vite SPA deployment |
| Pages Domain | `{domain}` | Custom domain for Pages |

### VM Services (Docker Compose)

| Service | Image | Port | Started by |
|---------|-------|------|------------|
| `database` | `postgres:15` | 5432 | `compose up -d` |
| `timescaledb` | `timescale/timescaledb:latest-pg15` | 5432 (internal) | `compose up -d` |
| `api` | `ghcr.io/{repo}/api:{tag}` | 3000 | `compose up -d` |
| `telegraf` | `telegraf:latest` | 8186 | `compose up -d` |
| `grafana` | `grafana/grafana:latest` | 3000 (internal) | `compose up -d` |
| `cloudflared` | `cloudflare/cloudflared:latest` | — | `compose up -d` |
| `scraper` | `ghcr.io/{repo}/scraper:{tag}` | — | cron (`0 6 * * *`) |

The `scraper` service uses `profiles: [scraper]` so it is excluded from `docker compose up -d` and runs only when invoked explicitly (via cron or manually).

## Prerequisites

- Terraform >= 1.0
- `gcloud` CLI authenticated with access to the GCP project
- Bootstrap module applied (secrets populated, SAs created)
- Cloudflare Pages GitHub integration installed on your repo — go to [Cloudflare dashboard](https://dash.cloudflare.com) > Pages > Create project > Connect to Git, authorize the GitHub App, and select your repo. This is a one-time manual step required before Terraform can create the Pages project

## Usage

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

make init
make plan
make apply
```

## Variables

`project_id`, `region`, `cloudflare_account_id`, and `github_repo` are read from bootstrap state automatically. The `ghcr-token` and `cloudflare-api-token` secrets are read from Secret Manager at runtime.

| Name | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `domain` | `string` | — | yes | Domain name |
| `zone` | `string` | `europe-west1-b` | no | GCE zone |
| `image_tag` | `string` | `latest` | no | Container image tag |
| `vm_machine_type` | `string` | `e2-small` | no | VM machine type |
| `vm_disk_size_gb` | `number` | `30` | no | Boot disk size (GB) |
| `subnet_cidr` | `string` | `10.0.0.0/24` | no | Private subnet CIDR |

## Outputs

| Name | Description |
|------|-------------|
| `vm_name` | Name of the GCE VM |
| `vm_internal_ip` | Internal IP of the VM |
| `project_id` | GCP project ID |
| `zone` | GCE zone |

## Operations

SSH into the VM via IAP:

```bash
gcloud compute ssh $(terraform output -raw vm_name) \
  --project=$(terraform output -raw project_id) \
  --zone=$(terraform output -raw zone) \
  --tunnel-through-iap
```

Trigger the scraper manually:

```bash
# After SSH into VM
docker compose -f /opt/app/docker-compose.yml run --rm --no-deps scraper
```

Check cron registration:

```bash
# After SSH into VM
cat /etc/cron.d/scraper
```

Check cron logs:

```bash
# After SSH into VM
tail -f /var/log/scraper.log
```

Check VM containers:

```bash
# After SSH into VM
docker ps
docker compose -f /opt/app/docker-compose.yml logs -f
```
