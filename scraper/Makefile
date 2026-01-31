BUILD_DIR := dist
BUILD_IMG := scraper
BUILD_IMG_TAG := dev

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

build: $(BUILD_DIR)
	CGO_ENABLED=1 go build -C src/ -race -o ../$(BUILD_DIR)/scraper  .

clean:
	rm -f $(BUILD_DIR)/*

image:
	docker build -t $(BUILD_IMG):$(BUILD_IMG_TAG) .