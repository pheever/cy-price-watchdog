package metrics

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestEscapeTag(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{"plain string", "hello", "hello"},
		{"spaces escaped", "hello world", `hello\ world`},
		{"commas escaped", "a,b", `a\,b`},
		{"equals escaped", "a=b", `a\=b`},
		{"multiple special chars", "a=b, c d", `a\=b\,\ c\ d`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := escapeTag(tt.input)
			if got != tt.want {
				t.Errorf("escapeTag(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestFormatField(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
		want  string
	}{
		{"int", 123, "123i"},
		{"int64", int64(456), "456i"},
		{"float64", 3.14, "3.140000"},
		{"string", "hello", `"hello"`},
		{"bool true", true, "true"},
		{"bool false", false, "false"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := formatField(tt.input)
			if got != tt.want {
				t.Errorf("formatField(%v) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestMergeTags(t *testing.T) {
	tests := []struct {
		name       string
		base       map[string]string
		additional map[string]string
		want       map[string]string
	}{
		{
			name: "both nil",
			want: map[string]string{},
		},
		{
			name:       "base nil",
			additional: map[string]string{"a": "1"},
			want:       map[string]string{"a": "1"},
		},
		{
			name: "additional nil",
			base: map[string]string{"a": "1"},
			want: map[string]string{"a": "1"},
		},
		{
			name:       "overlapping keys - additional overrides",
			base:       map[string]string{"a": "1", "b": "2"},
			additional: map[string]string{"b": "override"},
			want:       map[string]string{"a": "1", "b": "override"},
		},
		{
			name:       "disjoint keys merged",
			base:       map[string]string{"a": "1"},
			additional: map[string]string{"b": "2"},
			want:       map[string]string{"a": "1", "b": "2"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := mergeTags(tt.base, tt.additional)
			if len(got) != len(tt.want) {
				t.Errorf("mergeTags() returned %d entries, want %d", len(got), len(tt.want))
			}
			for k, wantV := range tt.want {
				if gotV, ok := got[k]; !ok || gotV != wantV {
					t.Errorf("mergeTags()[%q] = %q, want %q", k, gotV, wantV)
				}
			}
		})
	}
}

func TestRecord(t *testing.T) {
	t.Run("with URL set, metric line appended", func(t *testing.T) {
		c := &Collector{
			url:     "http://localhost:8086",
			metrics: make([]string, 0),
		}

		c.Record("cpu", map[string]string{"host": "server1"}, map[string]interface{}{
			"usage": 42,
		})

		if len(c.metrics) != 1 {
			t.Fatalf("expected 1 metric, got %d", len(c.metrics))
		}

		line := c.metrics[0]
		if !strings.HasPrefix(line, "cpu,host=server1 ") {
			t.Errorf("metric line should start with measurement and tags, got %q", line)
		}
		if !strings.Contains(line, "usage=42i") {
			t.Errorf("metric line should contain field, got %q", line)
		}
		// Verify timestamp is present (last space-separated part should be digits)
		parts := strings.Split(line, " ")
		if len(parts) < 3 {
			t.Errorf("metric line should have at least 3 space-separated parts, got %d", len(parts))
		}
	})

	t.Run("with empty URL, no-op", func(t *testing.T) {
		c := &Collector{
			url:     "",
			metrics: make([]string, 0),
		}

		c.Record("cpu", map[string]string{"host": "server1"}, map[string]interface{}{
			"usage": 42,
		})

		if len(c.metrics) != 0 {
			t.Errorf("expected 0 metrics with empty URL, got %d", len(c.metrics))
		}
	})
}

func TestRecordDuration(t *testing.T) {
	c := &Collector{
		url:     "http://localhost:8086",
		metrics: make([]string, 0),
	}

	c.RecordDuration("fetch_products", 150*time.Millisecond, nil)

	if len(c.metrics) != 1 {
		t.Fatalf("expected 1 metric, got %d", len(c.metrics))
	}

	line := c.metrics[0]
	if !strings.Contains(line, "scraper,") {
		t.Errorf("measurement should be 'scraper', got %q", line)
	}
	if !strings.Contains(line, "metric=fetch_products") {
		t.Errorf("should contain metric tag, got %q", line)
	}
	if !strings.Contains(line, "duration_ms=150i") {
		t.Errorf("should contain duration_ms field, got %q", line)
	}
}

func TestRecordCount(t *testing.T) {
	c := &Collector{
		url:     "http://localhost:8086",
		metrics: make([]string, 0),
	}

	c.RecordCount("products_scraped", 42, nil)

	if len(c.metrics) != 1 {
		t.Fatalf("expected 1 metric, got %d", len(c.metrics))
	}

	line := c.metrics[0]
	if !strings.Contains(line, "scraper,") {
		t.Errorf("measurement should be 'scraper', got %q", line)
	}
	if !strings.Contains(line, "metric=products_scraped") {
		t.Errorf("should contain metric tag, got %q", line)
	}
	if !strings.Contains(line, "count=42i") {
		t.Errorf("should contain count field, got %q", line)
	}
}

func TestRecordGauge(t *testing.T) {
	c := &Collector{
		url:     "http://localhost:8086",
		metrics: make([]string, 0),
	}

	c.RecordGauge("error_rate", 0.05, nil)

	if len(c.metrics) != 1 {
		t.Fatalf("expected 1 metric, got %d", len(c.metrics))
	}

	line := c.metrics[0]
	if !strings.Contains(line, "scraper,") {
		t.Errorf("measurement should be 'scraper', got %q", line)
	}
	if !strings.Contains(line, "metric=error_rate") {
		t.Errorf("should contain metric tag, got %q", line)
	}
	if !strings.Contains(line, "value=0.050000") {
		t.Errorf("should contain value field, got %q", line)
	}
}

func TestFlush(t *testing.T) {
	t.Run("sends metrics to server", func(t *testing.T) {
		var receivedBody string
		var receivedContentType string
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			body, _ := io.ReadAll(r.Body)
			receivedBody = string(body)
			receivedContentType = r.Header.Get("Content-Type")
			w.WriteHeader(http.StatusNoContent)
		}))
		defer server.Close()

		c := &Collector{
			url:       server.URL,
			client:    server.Client(),
			startTime: time.Now(),
			metrics:   []string{"cpu,host=a usage=42i 1000", "mem,host=a free=1024i 1000"},
		}

		err := c.Flush()
		if err != nil {
			t.Fatalf("Flush() error = %v", err)
		}

		if receivedContentType != "text/plain" {
			t.Errorf("Content-Type = %q, want %q", receivedContentType, "text/plain")
		}

		// Body should contain the original metrics plus the run_duration metric, joined by \n
		if !strings.Contains(receivedBody, "cpu,host=a usage=42i 1000") {
			t.Errorf("body should contain first metric, got %q", receivedBody)
		}
		if !strings.Contains(receivedBody, "mem,host=a free=1024i 1000") {
			t.Errorf("body should contain second metric, got %q", receivedBody)
		}

		// After flush, metrics slice should be cleared
		if len(c.metrics) != 0 {
			t.Errorf("metrics should be cleared after flush, got %d", len(c.metrics))
		}
	})

	t.Run("empty URL returns nil, no HTTP call", func(t *testing.T) {
		c := &Collector{
			url:     "",
			metrics: []string{"cpu usage=42i 1000"},
		}

		err := c.Flush()
		if err != nil {
			t.Errorf("Flush() with empty URL should return nil, got %v", err)
		}
	})

	t.Run("no metrics returns nil, no HTTP call", func(t *testing.T) {
		c := &Collector{
			url:     "http://localhost:8086",
			metrics: make([]string, 0),
		}

		err := c.Flush()
		if err != nil {
			t.Errorf("Flush() with no metrics should return nil, got %v", err)
		}
	})

	t.Run("server returns 4xx, returns error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusBadRequest)
		}))
		defer server.Close()

		c := &Collector{
			url:       server.URL,
			client:    server.Client(),
			startTime: time.Now(),
			metrics:   []string{"cpu usage=42i 1000"},
		}

		err := c.Flush()
		if err == nil {
			t.Error("Flush() should return error on 4xx response")
		}
		if !strings.Contains(err.Error(), "400") {
			t.Errorf("error should mention status code, got %v", err)
		}
	})
}

func TestNewCollectorDisabledWithoutEnv(t *testing.T) {
	t.Setenv("METRICS_URL", "")

	c := New()

	if c.url != "" {
		t.Errorf("url should be empty without METRICS_URL, got %q", c.url)
	}

	// Record should be a no-op
	c.Record("test", map[string]string{"a": "b"}, map[string]interface{}{"v": 1})

	if len(c.metrics) != 0 {
		t.Errorf("Record should be no-op without URL, got %d metrics", len(c.metrics))
	}
}
