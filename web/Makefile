.PHONY: install dev build preview lint typecheck image clean

BUILD_IMG := cy-price-watchdog-web
BUILD_IMG_TAG := dev
extraBuildArgs :=

install:
	yarn install

dev:
	yarn dev

build:
	yarn build

preview:
	yarn preview

lint:
	yarn lint

typecheck:
	yarn typecheck

image:
	docker build $(extraBuildArgs) -t $(BUILD_IMG):$(BUILD_IMG_TAG) -f Dockerfile ..

clean:
	rm -rf node_modules dist
