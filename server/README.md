# Server

Next.js 14 API server for Cyprus Price Watchdog.

## Prerequisites

- Node.js 22+
- PostgreSQL 15+ (with schema from `database/`)

## Environment

```bash
export DATABASE_URL="postgresql://scraper_user:scraper_password@localhost:5432/scraper_db"
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
| `make image` | Build Docker image |

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
