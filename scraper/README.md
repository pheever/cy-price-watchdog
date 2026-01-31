# Scraper

Go service that scrapes product prices from the Cyprus eKalathi API and stores them in PostgreSQL.

## Prerequisites

- Go 1.23+
- PostgreSQL 15+

## Environment

Set `DATABASE_URL` in your environment:

```bash
export DATABASE_URL="postgresql://scraper_user:scraper_password@localhost:5432/scraper_db"
```

## Commands

| Command | Description |
|---------|-------------|
| `make build` | Build the scraper binary |
| `make clean` | Remove build artifacts |
| `make image` | Build Docker image |

## Running

### Local

```bash
make build
./dist/scraper
```

### Docker

```bash
make image
docker run -e DATABASE_URL="..." scraper:dev
```

## What it does

1. Fetches product categories from eKalathi API
2. Fetches products and prices for each category
3. Upserts categories, products, and stores to database
4. Inserts new price records with timestamps

## API Endpoints Used

- `GET /ekalathi-website-server/api/fetch-product-categories` - List all categories
- `GET /ekalathi-website-server/api/fetch-products-list` - List products with prices

## Scheduling

The scraper is designed to run periodically (every 6 hours). In production, use:
- Cloud Scheduler (Google Cloud)
- Kubernetes CronJob
- Systemd timer
