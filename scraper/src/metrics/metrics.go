package metrics

import (
	"bytes"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

// Collector collects metrics and pushes them to Telegraf
type Collector struct {
	url       string
	client    *http.Client
	startTime time.Time
	metrics   []string
}

// New creates a new metrics collector
// Uses METRICS_URL env var, falls back to disabled if not set
func New() *Collector {
	url := os.Getenv("METRICS_URL")
	return &Collector{
		url:       url,
		client:    &http.Client{Timeout: 10 * time.Second},
		startTime: time.Now(),
		metrics:   make([]string, 0),
	}
}

// Record adds a metric to the batch
// Uses InfluxDB line protocol: measurement,tag=value field=value timestamp
func (c *Collector) Record(measurement string, tags map[string]string, fields map[string]interface{}) {
	if c.url == "" {
		return // Metrics disabled
	}

	var sb strings.Builder
	sb.WriteString(measurement)

	// Add tags
	for k, v := range tags {
		sb.WriteString(",")
		sb.WriteString(k)
		sb.WriteString("=")
		sb.WriteString(escapeTag(v))
	}

	sb.WriteString(" ")

	// Add fields
	first := true
	for k, v := range fields {
		if !first {
			sb.WriteString(",")
		}
		first = false
		sb.WriteString(k)
		sb.WriteString("=")
		sb.WriteString(formatField(v))
	}

	// Add timestamp (nanoseconds)
	sb.WriteString(" ")
	sb.WriteString(fmt.Sprintf("%d", time.Now().UnixNano()))

	c.metrics = append(c.metrics, sb.String())
}

// RecordDuration records a duration metric
func (c *Collector) RecordDuration(name string, duration time.Duration, tags map[string]string) {
	c.Record("scraper", mergeTags(tags, map[string]string{"metric": name}), map[string]interface{}{
		"duration_ms": duration.Milliseconds(),
	})
}

// RecordCount records a count metric
func (c *Collector) RecordCount(name string, count int, tags map[string]string) {
	c.Record("scraper", mergeTags(tags, map[string]string{"metric": name}), map[string]interface{}{
		"count": count,
	})
}

// RecordGauge records a gauge metric
func (c *Collector) RecordGauge(name string, value float64, tags map[string]string) {
	c.Record("scraper", mergeTags(tags, map[string]string{"metric": name}), map[string]interface{}{
		"value": value,
	})
}

// TotalDuration returns the total duration since collector creation
func (c *Collector) TotalDuration() time.Duration {
	return time.Since(c.startTime)
}

// Flush sends all collected metrics to Telegraf
func (c *Collector) Flush() error {
	if c.url == "" || len(c.metrics) == 0 {
		return nil
	}

	// Record total run duration
	c.Record("scraper", map[string]string{"metric": "run_duration"}, map[string]interface{}{
		"duration_ms": c.TotalDuration().Milliseconds(),
	})

	body := strings.Join(c.metrics, "\n")
	req, err := http.NewRequest("POST", c.url, bytes.NewBufferString(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "text/plain")

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send metrics: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("metrics endpoint returned status %d", resp.StatusCode)
	}

	// Clear metrics after successful push
	c.metrics = c.metrics[:0]
	return nil
}

// Helper functions

func escapeTag(s string) string {
	s = strings.ReplaceAll(s, " ", "\\ ")
	s = strings.ReplaceAll(s, ",", "\\,")
	s = strings.ReplaceAll(s, "=", "\\=")
	return s
}

func formatField(v interface{}) string {
	switch val := v.(type) {
	case int:
		return fmt.Sprintf("%di", val)
	case int64:
		return fmt.Sprintf("%di", val)
	case float64:
		return fmt.Sprintf("%f", val)
	case string:
		return fmt.Sprintf("%q", val)
	case bool:
		return fmt.Sprintf("%t", val)
	default:
		return fmt.Sprintf("%v", val)
	}
}

func mergeTags(base, additional map[string]string) map[string]string {
	result := make(map[string]string)
	for k, v := range base {
		result[k] = v
	}
	for k, v := range additional {
		result[k] = v
	}
	return result
}
