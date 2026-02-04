BUILD_DIR 		:= dist
BUILD_IMG 		:= scraper
BUILD_IMG_TAG := dev
DB 						:= "postgresql://admin:admin_password@localhost:5432/scraper_db"

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

build: $(BUILD_DIR)
	CGO_ENABLED=0 go build -C src/ -o ../$(BUILD_DIR)/scraper  .

clean:
	rm -f $(BUILD_DIR)/*

image:
	docker build -t $(BUILD_IMG):$(BUILD_IMG_TAG) .

run:
	DATABASE_URL=$(DB) go run .