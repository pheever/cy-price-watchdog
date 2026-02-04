# Web Application

React frontend for Cyprus Price Watchdog.

## Prerequisites

- Node.js 22+
- API server running on port 3000

## Development

### With Docker Compose (recommended)

From the project root:

```bash
docker compose up
```

The web app runs on http://localhost:8080 with hot reloading enabled. Changes to `src/` are reflected immediately via Vite HMR.

### Standalone

```bash
make install
make dev
```

Then open http://localhost:5173

The development server proxies `/api` requests to `http://localhost:3000` (or `VITE_API_URL` if set).

## Commands

| Command | Description |
|---------|-------------|
| `make install` | Install dependencies |
| `make dev` | Start development server (port 5173) |
| `make build` | Build for production |
| `make preview` | Preview production build |
| `make lint` | Run ESLint |
| `make typecheck` | Run TypeScript type checking |

## Docker

| File | Purpose |
|------|---------|
| `Dockerfile` | Production build (nginx serving static files) |
| `Dockerfile.dev` | Development with Vite HMR |

## Pages

- `/` - Dashboard with statistics
- `/categories` - Browse product categories
- `/categories/:id` - Category detail with products
- `/products/:id` - Product detail with price chart

## Tech Stack

- React 18
- React Router 7
- Recharts (price charts)
- Vite (build tool)
- TypeScript
