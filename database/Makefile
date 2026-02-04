.PHONY: install generate migrate migrate-dev studio push db-reset clean

BUILD_IMG := cy-price-watchdog-migrate
BUILD_IMG_TAG := dev
DB 						:= "postgresql://admin:admin_password@localhost:5432/scraper_db"

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
