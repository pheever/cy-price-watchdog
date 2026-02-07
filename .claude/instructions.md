# Cyprus Price Watchdog

A price monitoring tool for Cyprus supermarkets, scraping data from the government eKalathi platform.

Tech Stack:
- **API**: Next.js 14 API routes, TypeScript, Prisma with PostgreSQL, Zod validation
- **Web**: React 18, React Router 7, Vite 6, TypeScript, bilingual (Greek/English)
- **Scraper**: Go, PostgreSQL, InfluxDB line protocol for metrics
- **Database**: PostgreSQL 15, Prisma ORM for schema management
- **Metrics**: TimescaleDB, Telegraf, Grafana
- **IaC**: Terraform for Google Cloud + Cloudflare deployment

API Architecture:
- RESTful endpoints with consistent response format: `{data, error, meta}`
- Cursor-based pagination for all list endpoints
- Input validation on all endpoints using Zod schemas
- Rate limiting (100 req/min per IP)
- API response caching headers

When generating code:
1. Always validate request bodies with Zod schemas
2. Include proper error handling with consistent response format
3. Generate database queries with proper indexing considerations
4. Include rate limiting middleware on all public endpoints
5. All repo modules should come with a README.md and a Makefile

## Components

### Database

All database schema management is in `database/`

### Scraper

All scraping code is in `scraper/`

### API

All API server code is in `api/`

### Web application

All user-facing web application code is in `web/`

### Metrics

All observability infrastructure is in `metrics/`

### IaC

All Terraform modules for provisioning infrastructure are in `iac/`
