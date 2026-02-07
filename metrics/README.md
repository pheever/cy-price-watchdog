# Metrics & Observability

Application observability using TimescaleDB for metrics storage, Telegraf for collection, and Grafana for visualization.

## Architecture

```
┌─────────────┐     ┌─────────────┐
│     api     │     │   scraper   │
│ /api/metrics│     │   (batch)   │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │ pull (10s)   push │
       │                   │
       ▼                   ▼
┌─────────────────────────────────┐
│            Telegraf             │
│             :8186               │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│          TimescaleDB            │
│             :5433               │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│            Grafana              │
│             :3001               │
└─────────────────────────────────┘
```

**Collection Methods:**
- **Pull**: Telegraf scrapes api `/api/metrics` every 10 seconds
- **Push**: Scraper POSTs metrics to Telegraf at end of run (InfluxDB line protocol)

## Directory Structure

```
metrics/
├── README.md
├── schema/
│   ├── 001_extensions.sql      # Enable TimescaleDB extension
│   ├── 002_metrics_table.sql   # Metrics hypertable
│   ├── 003_events_table.sql    # Events hypertable
│   ├── 004_retention.sql       # Data retention policies
│   └── 005_users.sql           # Database users (metrics_writer, metrics_reader)
├── telegraf/
│   └── telegraf.conf           # Telegraf configuration
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── datasources.yml # TimescaleDB + AppDatabase datasources
│   │   └── dashboards/
│   │       └── dashboards.yml  # Dashboard provisioning config
│   └── dashboards/
│       └── .gitkeep
└── SDK.md                      # Planned metrics SDK spec
```

## Database Users

| User | Permissions | Used by |
|------|-------------|---------|
| `metrics_user` | superuser (owner) | schema setup |
| `metrics_writer` | read-write + CREATE | telegraf |
| `metrics_reader` | read-only | grafana |

## Metrics Collected

### api (pulled)
| Metric | Description |
|--------|-------------|
| `memory_heap_used` | Node.js heap memory used |
| `memory_heap_total` | Node.js heap memory total |
| `memory_rss` | Resident set size |
| `uptime_seconds` | Server uptime |
| `requests_total` | Total requests served |
| `requests_2xx` | Successful responses |
| `requests_4xx` | Client errors |
| `requests_5xx` | Server errors |

### scraper (pushed)
| Metric | Description |
|--------|-------------|
| `scraper.duration` | Duration per phase (regions, categories, products, prices) |
| `scraper.count` | Record counts (categories, products, prices, stores) |
| `scraper.errors` | Error counts by phase |
| `scraper.run_duration` | Total scraper run time |

## Local Development

```bash
# Start all services (including metrics infrastructure)
docker compose up -d

# Access Grafana
open http://localhost:3001
# Credentials: admin / admin

# Check Telegraf is collecting
docker logs telegraf

# Query TimescaleDB directly
docker exec -it timescaledb psql -U metrics_user -d metrics_db
```

## Grafana Datasources

| Name | UID | Database | Purpose |
|------|-----|----------|---------|
| TimescaleDB | `timescaledb` | metrics_db | Telegraf metrics |
| AppDatabase | `appdb` | scraper_db | Application data |

## Retention Policies

| Data | Retention |
|------|-----------|
| Detailed metrics | 7 days |
| Detailed events | 30 days |
| Hourly aggregates | 90 days |
| Daily aggregates | 1 year |

## TODO

- [x] Add TimescaleDB and Grafana to root docker-compose.yml
- [x] Write SQL schema scripts
- [x] Create Grafana datasource provisioning
- [x] Add Telegraf for metrics collection
- [x] Implement api /api/metrics endpoint
- [x] Implement scraper metrics push
- [ ] Configure nginx stub_status (when production nginx is added)
- [ ] Design API overview dashboard
- [ ] Design scraper dashboard
- [ ] Set up alerting rules
- [ ] Implement [Metrics SDK](SDK.md)
