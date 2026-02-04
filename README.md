# Cyprus Price Watchdog

Since Cyprus government [eKalathi](https://www.e-kalathi.gov.cy/) release, consumers are able to compare prices. But the consumers are unable to monitor the increase of the prices relative to other prices or the inflation.

This tool comes to serve this exact purpose, to monitor the price fluctuation over time and compare with the inflation and commodities that affect inflation.

## How it works

The tool has 3 components. The scraper, the database and the web application.
The scraper is responsible to scrape the prices from the government's API every 6 hours. The data it collects are then stored in a database (timestamp, price, product etc). The web application consists of a web server serving the application and an API server to serve the data from the database. The web application is the user interface, designed to make it simple for everyday and non technical users.

## Local Development

Start all services:

```bash
make start
```

Or with file watching (auto-sync + hot reload):

```bash
make watch
```

This starts:
- **PostgreSQL** on port 5432
- **TimescaleDB** on port 5433 (metrics)
- **Adminer** (DB UI) on port 8081
- **API Server** (Next.js) on port 3000
- **Web App** (Vite) on port 8080
- **Grafana** on port 3001
- **Telegraf** on port 8186 (metrics collector)

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:8080 | React frontend |
| API Server | http://localhost:3000 | Next.js API |
| Adminer | http://localhost:8081 | Database UI |
| Grafana | http://localhost:3001 | Metrics dashboards (admin/admin) |

### Commands

| Command | Description |
|---------|-------------|
| `make start` | Start all services |
| `make stop` | Stop all services |
| `make watch` | Start with file watching (hot reload) |
| `make logs` | View logs (`SERVICE=server make logs` for specific service) |
| `make migrate` | Run database migrations |
| `make generate` | Regenerate Prisma client |
| `make rebuild` | Rebuild service (`SERVICE=server make rebuild`) |

## Project Structure

| Directory | Description |
|-----------|-------------|
| `database/` | Prisma schema and migrations |
| `scraper/` | Go scraper for eKalathi API |
| `server/` | Next.js API server |
| `web/` | React frontend (Vite) |
| `metrics/` | Observability (TimescaleDB + Telegraf + Grafana) |
| `iac/` | Terraform for Google Cloud deployment |

## Database Users

| User | Database | Permissions | Used by |
|------|----------|-------------|---------|
| `admin` | scraper_db | superuser | migrations |
| `data_writer` | scraper_db | read-write | scraper |
| `data_reader` | scraper_db | read-only | server (API) |
| `metrics_user` | metrics_db | superuser | schema setup |
| `metrics_writer` | metrics_db | read-write | telegraf |
| `metrics_reader` | metrics_db | read-only | grafana |

## Where is it hosted

The tool is hosted in Google Cloud. See `iac/` for Terraform configuration.
