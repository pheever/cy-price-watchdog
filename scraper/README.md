# Scraper

Go service that scrapes product prices from the Cyprus eKalathi API and stores them in PostgreSQL.

## Prerequisites

- Go 1.23+
- PostgreSQL 15+

## Environment

```bash
export DATABASE_URL="postgresql://data_writer:data_writer_pass@localhost:5432/scraper_db"
export METRICS_URL="http://localhost:8186/write"  # Optional: Telegraf endpoint
```

Note: The scraper uses `data_writer` (read-write) since it inserts/updates data.

## Commands

| Command | Description |
|---------|-------------|
| `make build` | Build the scraper binary |
| `make clean` | Remove build artifacts |
| `make image` | Build Docker image |

## Running

### With Docker Compose

From the project root:

```bash
docker compose up scraper
```

The scraper runs once and exits. It rebuilds automatically when source files change.

### Local

```bash
make build
./dist/scraper
```

### Docker (standalone)

```bash
make image
docker run -e DATABASE_URL="..." scraper:dev
```

## What it does

1. Fetches product categories from eKalathi API
2. Fetches products and prices for each category
3. Upserts categories, products, and stores to database
4. Inserts new price records with timestamps
5. Pushes metrics to Telegraf (if METRICS_URL is set)

## Metrics

When `METRICS_URL` is set, the scraper pushes metrics to Telegraf at the end of each run:

| Metric | Description |
|--------|-------------|
| `scraper.duration` | Duration per phase (regions, categories, products, prices) |
| `scraper.count` | Record counts (categories, products, prices, stores) |
| `scraper.errors` | Error counts by phase |
| `scraper.run_duration` | Total scraper run time |

Metrics are sent in InfluxDB line protocol format.

## API Endpoints Used

- `GET /ekalathi-website-server/api/fetch-product-categories` - List all categories
- `GET /ekalathi-website-server/api/fetch-products-list` - List products with prices

## Scheduling

The scraper is designed to run periodically (every 6 hours). In production, use:
- Cloud Scheduler (Google Cloud)
- Kubernetes CronJob
- Systemd timer
