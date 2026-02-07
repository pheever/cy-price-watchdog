# Cyprus Price Watchdog

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/pheever/cy-price-watchdog/actions/workflows/ci.yml/badge.svg)](https://github.com/pheever/cy-price-watchdog/actions/workflows/ci.yml)
[![Go](https://img.shields.io/badge/Go-1.25-00ADD8?logo=go&logoColor=white)](https://go.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Terraform](https://img.shields.io/badge/Terraform-844FBA?logo=terraform&logoColor=white)](https://www.terraform.io/)

Since Cyprus government [eKalathi](https://www.e-kalathi.gov.cy/) release, consumers are able to compare prices. But the consumers are unable to monitor the increase of the prices relative to other prices or the inflation.

This tool comes to serve this exact purpose, to monitor the price fluctuation over time and compare with the inflation and commodities that affect inflation.

## How it works

The scraper fetches product prices from the government's eKalathi API every 6 hours and stores them in PostgreSQL. The API server exposes the data through a REST API, and the web frontend provides a user-friendly interface for browsing and comparing prices. Metrics are collected via Telegraf into TimescaleDB and visualized with Grafana.

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
| `make logs` | View logs (`SERVICE=api make logs` for specific service) |
| `make migrate` | Run database migrations |
| `make generate` | Regenerate Prisma client |
| `make rebuild` | Rebuild service (`SERVICE=api make rebuild`) |

## Project Structure

| Directory | Description |
|-----------|-------------|
| `database/` | Prisma schema and migrations |
| `scraper/` | Go scraper for eKalathi API |
| `api/` | Next.js API server |
| `web/` | React frontend (Vite) |
| `metrics/` | Observability (TimescaleDB + Telegraf + Grafana) |
| `iac/` | Terraform for Google Cloud deployment |

## Database Users

| User | Database | Permissions | Used by |
|------|----------|-------------|---------|
| `admin` | scraper_db | superuser | migrations |
| `data_writer` | scraper_db | read-write | scraper |
| `data_reader` | scraper_db | read-only | api |
| `metrics_user` | metrics_db | superuser | schema setup |
| `metrics_writer` | metrics_db | read-write | telegraf |
| `metrics_reader` | metrics_db | read-only | grafana |

## Where is it hosted

The tool is hosted in Google Cloud. See `iac/` for Terraform configuration.
