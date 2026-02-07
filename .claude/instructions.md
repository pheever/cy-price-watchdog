# Cyprus Price Watchdog

I'm building an API-first application to serve mobile and web clients:

Tech Stack:
- Next.js 14 API routes (no frontend pages)
- TypeScript with strict type checking
- Prisma with PostgreSQL
- Zod for request/response validation
- Terraform for the infrastructure

API Architecture:
- RESTful endpoints with consistent response format
- Comprehensive error handling with standardized error codes

Mobile Considerations:
- Offline-first data sync capabilities
- Pagination for all list endpoints (cursor-based)
- Optimized payload sizes for slow connections

Security Requirements:
- Input validation on all endpoints using Zod schemas
- SQL injection prevention with parameterized queries
- CORS configuration for allowed client domains
- Request logging for security monitoring

Data Patterns:
- UUID primary keys for better mobile sync
- Optimistic locking for concurrent updates

Response Format:
- Consistent JSON structure: {data, error, meta}
- HTTP status codes that match response content
- Detailed error messages with field-level validation
- Pagination metadata (hasNext, cursor, total)
- API response caching headers where appropriate

When generating code:
1. Always validate request bodies with Zod schemas
2. Include proper error handling with consistent response format
3. Add user authorization checks to protected endpoints
4. Generate database queries with proper indexing considerations
5. Include rate limiting middleware on all public endpoints
6. All repo modules should come with a README.md and a Makefile with the documentation
  and basic targets to run/build/validate the module

## Components

### Database

All the database schema management should be contained in `database/`

### Scraper

All the code related to scraping the prices api should be contained in `scraper/`

### API

All API server code for serving the application data should be contained in `api/`

### Web application

All user facing web application code should be contained in `web/`

### IaC

All IaC terraform modules for provisioning the infrastructure and networking of the application should be contained in IaC.