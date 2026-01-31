package main

import (
	"context"
	"os"
)

func main() {
	logger.Info("scraper starting")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		logger.Error("DATABASE_URL environment variable is required")
		os.Exit(1)
	}
	logger.Info("DATABASE_URL found, connecting to database")

	scraper, err := NewScraper(dbURL)
	if err != nil {
		logger.Error("failed to initialize scraper", "error", err)
		os.Exit(1)
	}
	defer scraper.Close()
	logger.Info("database connection established")

	ctx := context.Background()
	if err := scraper.Run(ctx); err != nil {
		logger.Error("scraper failed", "error", err)
		os.Exit(1)
	}

	logger.Info("scraper finished successfully")
}
