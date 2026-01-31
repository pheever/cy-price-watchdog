# Database

PostgreSQL database schema management using Prisma.

## Prerequisites

- Node.js 18+
- PostgreSQL 15+

## Setup

```bash
make install
```

## Environment

Set `DATABASE_URL` in your environment:

```bash
export DATABASE_URL="postgresql://scraper_user:scraper_password@localhost:5432/scraper_db"
```

## Commands

| Command | Description |
|---------|-------------|
| `make install` | Install dependencies |
| `make generate` | Generate Prisma client |
| `make migrate` | Run migrations (production) |
| `make migrate-dev` | Create and run migrations (development) |
| `make studio` | Open Prisma Studio GUI |
| `make push` | Push schema to database without migrations |

## Schema

### Category
Hierarchical product categories from eKalathi.

### Product
Individual products with bilingual names.

### Store
Retail stores/supermarkets.

### Price
Price records with timestamps for historical tracking.

## Development

To create a new migration after schema changes:

```bash
make migrate-dev
```

This will prompt for a migration name and generate the SQL migration files.
