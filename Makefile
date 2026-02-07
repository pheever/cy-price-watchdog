SERVICE := ""

.PHONY: start stop restart watch logs migrate generate

start:
	docker compose up -d

stop:
	docker compose down

restart:
	docker compose restart $(SERVICE)

watch:
	docker compose watch

logs:
	docker compose logs -f $(SERVICE)

# Run database migrations
migrate:
	docker compose up migrate

# Regenerate Prisma client in api container
generate:
	docker compose exec api yarn prisma generate --schema=./prisma/schema.prisma

# Rebuild specific service
rebuild:
	docker compose up -d --build $(SERVICE)

reset:
	docker compose down -v