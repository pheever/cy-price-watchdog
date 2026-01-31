# Web Application

React frontend for Cyprus Price Watchdog.

## Prerequisites

- Node.js 22+
- API server running on port 3000

## Setup

```bash
make install
```

## Commands

| Command | Description |
|---------|-------------|
| `make install` | Install dependencies |
| `make dev` | Start development server (port 5173) |
| `make build` | Build for production |
| `make preview` | Preview production build |
| `make lint` | Run ESLint |
| `make typecheck` | Run TypeScript type checking |
| `make image` | Build Docker image |

## Development

The development server proxies `/api` requests to `http://localhost:3000`.

```bash
# Terminal 1: Start API server
cd ../server && make dev

# Terminal 2: Start web dev server
make dev
```

Then open http://localhost:5173

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
