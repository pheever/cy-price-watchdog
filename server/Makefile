.PHONY: install dev build start lint typecheck image clean

BUILD_IMG := cy-price-watchdog-server
BUILD_IMG_TAG := dev

install:
	yarn install

dev:
	yarn dev

build:
	yarn build

start:
	yarn start

lint:
	yarn lint

typecheck:
	yarn typecheck

image:
	docker build -t $(BUILD_IMG):$(BUILD_IMG_TAG) .

clean:
	rm -rf node_modules .next
