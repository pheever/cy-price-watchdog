.PHONY: install generate migrate migrate-dev studio push db-reset clean

include ../.env
export

BUILD_IMG := cy-price-watchdog-migrate
BUILD_IMG_TAG := dev
DB 						:= "postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@localhost:5432/$(POSTGRES_DB)"

install:
	yarn install

generate:
	yarn prisma generate

migrate:
	DATABASE_URL=$(DB) yarn prisma migrate deploy

migrate-dev:
	DATABASE_URL=$(DB) yarn prisma migrate dev

studio:
	yarn prisma studio

push:
	yarn prisma db push

db-reset:
	DATABASE_URL=$(DB) yarn prisma migrate reset --force

clean:
	rm -rf node_modules
