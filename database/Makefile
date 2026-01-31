.PHONY: install generate migrate migrate-dev studio push image clean

BUILD_IMG := cy-price-watchdog-migrate
BUILD_IMG_TAG := dev

install:
	yarn install

generate:
	yarn prisma generate

migrate:
	yarn prisma migrate deploy

migrate-dev:
	yarn prisma migrate dev

studio:
	yarn prisma studio

push:
	yarn prisma db push

clean:
	rm -rf node_modules
