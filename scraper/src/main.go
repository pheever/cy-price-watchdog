package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"

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

	// Set up signal handling to log before shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		sig := <-sigCh
		logger.Info("received signal, initiating graceful shutdown", "signal", sig.String())
		metricsCollector.RecordCount("errors", 1, map[string]string{"phase": "signal", "signal": sig.String()})
		cancel()
	}()

	// Start health check server
	healthServer := startHealthServer()
	defer healthServer.Close()

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

	if err := scraper.Run(ctx); err != nil {
		if ctx.Err() != nil {
			logger.Error("scraper interrupted by signal", "error", err)
			metricsCollector.RecordCount("errors", 1, map[string]string{"phase": "interrupted"})
			os.Exit(1)
		}
		logger.Error("scraper failed", "error", err)
		metricsCollector.RecordCount("errors", 1, map[string]string{"phase": "run"})
		os.Exit(1)
	}

	metricsCollector.RecordCount("runs", 1, map[string]string{"status": "success"})
	logger.Info("scraper finished successfully")
}

func startHealthServer() *http.Server {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "ok")
	})
	mux.HandleFunc("/ready", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "ok")
	})

	server := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	go func() {
		logger.Info("health server starting", "port", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("health server error", "error", err)
		}
	}()

	return server
}
