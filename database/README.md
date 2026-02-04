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

With Docker Compose (from project root):

```bash
docker compose up database
```

Or set `DATABASE_URL` manually:

```bash
export DATABASE_URL="postgresql://admin:admin_password@localhost:5432/scraper_db"
```

## Database Users

| User | Permissions | Used by |
|------|-------------|---------|
| `admin` | superuser (owner) | migrations |
| `data_writer` | SELECT, INSERT, UPDATE, DELETE | scraper |
| `data_reader` | SELECT only | server (API) |

Users are created by `init/001_users.sql` on container startup.

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

## Migration Workflow

### Commands Overview

| Command | Purpose |
|---------|---------|
| `make migrate` | Apply existing migrations only (CI/production) |
| `make migrate-dev` | Apply existing + generate new migrations from schema changes (development) |
| `make db-reset` | Drop database and reapply all migrations (development) |

### Scenarios

#### 1. Database is empty, existing migrations exist

Apply all existing migrations without generating new ones:

```bash
make migrate
```

This runs `prisma migrate deploy` which is safe for production.

#### 2. Database is empty, no migrations exist

Generate the initial migration from `schema.prisma`:

```bash
DATABASE_URL=... yarn prisma migrate dev --name init
```

#### 3. Schema changed, need a new migration

After modifying `prisma/schema.prisma`, generate a migration for the diff:

```bash
make migrate-dev
```

This will:
1. Apply any pending migrations first
2. Compare `schema.prisma` against the database
3. Generate a new migration for any changes

#### 4. Database reset, apply existing migrations (not regenerate)

```bash
# First, apply existing migrations
make migrate

# Then, if schema.prisma has additional changes:
make migrate-dev
```

### Important Notes

- Migration files are in `prisma/migrations/` with timestamped directories
- Each migration contains a `migration.sql` file (Prisma format)
- Never manually edit migration files after they've been applied to shared databases
- Use `make db-reset` only in development to start fresh
