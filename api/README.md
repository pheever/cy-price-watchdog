# API

Next.js 14 API server for Cyprus Price Watchdog.

## Prerequisites

- Node.js 22+
- PostgreSQL 15+ (with schema from `database/`)

## Environment

```bash
export DATABASE_URL="postgresql://data_reader:data_reader_pass@localhost:5432/scraper_db"
```

Note: The API uses `data_reader` (read-only) since it only queries data.

## Development

### With Docker Compose (recommended)

From the project root:

```bash
docker compose up
```

The API runs on http://localhost:3000 with hot reloading enabled. Changes to `src/` are reflected immediately.

### Standalone

```bash
make install
make dev
```

## Commands

| Command | Description |
|---------|-------------|
| `make install` | Install dependencies |
| `make dev` | Start development server |
| `make build` | Build for production |
| `make start` | Start production server |
| `make lint` | Run ESLint |
| `make typecheck` | Run TypeScript type checking |

## Docker

| File | Purpose |
|------|---------|
| `Dockerfile` | Production build (standalone Next.js) |
| `Dockerfile.dev` | Development with hot reloading |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/categories` | GET | List categories |
| `/api/categories/:id` | GET | Get category by ID |
| `/api/products` | GET | List products (paginated) |
| `/api/products/:id` | GET | Get product by ID |
| `/api/products/:id/prices` | GET | Get price history |
| `/api/stores` | GET | List stores |
| `/api/stats` | GET | Get statistics |
| `/api/metrics` | GET | API metrics (for Telegraf) |

## Metrics Endpoint

The `/api/metrics` endpoint exposes API metrics for Telegraf to scrape:

```json
{
  "memory_heap_used": 12345678,
  "memory_heap_total": 23456789,
  "memory_rss": 34567890,
  "uptime_seconds": 3600,
  "requests_total": 1000,
  "requests_2xx": 950,
  "requests_4xx": 40,
  "requests_5xx": 10,
  "timestamp": 1234567890
}
```

## Response Format

All endpoints return responses in this format:

```json
{
  "data": { ... },
  "error": null,
  "meta": {
    "cursor": "...",
    "hasNext": true,
    "total": 100
  }
}
```

## Query Parameters

### Pagination

- `cursor` - UUID cursor for pagination
- `limit` - Number of items (1-100, default 20)

### Products

- `categoryId` - Filter by category UUID
- `search` - Search in name/nameEnglish

### Price History

- `storeId` - Filter by store UUID
- `from` - Start date (ISO 8601)
- `to` - End date (ISO 8601)

## Rate Limiting

All endpoints are rate-limited to 100 requests per minute per IP address.
