package main

import (
	"context"
	"os"

	"github.com/pheever/cy-price-watchdog/scraper/src/metrics"
)

func main() {
	logger.Info("scraper starting")

	// Initialize metrics collector
	metricsCollector := metrics.New()
	defer func() {
		if err := metricsCollector.Flush(); err != nil {
			logger.Error("failed to flush metrics", "error", err)
		} else {
			logger.Info("metrics flushed successfully")
		}
	}()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		logger.Error("DATABASE_URL environment variable is required")
		os.Exit(1)
	}
	logger.Info("DATABASE_URL found, connecting to database")

	scraper, err := NewScraper(dbURL, metricsCollector)
	if err != nil {
		logger.Error("failed to initialize scraper", "error", err)
		metricsCollector.RecordCount("errors", 1, map[string]string{"phase": "init"})
		os.Exit(1)
	}
	defer scraper.Close()
	logger.Info("database connection established")

	ctx := context.Background()
	if err := scraper.Run(ctx); err != nil {
		logger.Error("scraper failed", "error", err)
		metricsCollector.RecordCount("errors", 1, map[string]string{"phase": "run"})
		os.Exit(1)
	}

	metricsCollector.RecordCount("runs", 1, map[string]string{"status": "success"})
	logger.Info("scraper finished successfully")
}
