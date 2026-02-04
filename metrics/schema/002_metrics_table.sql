-- Metrics hypertable for storing time-series metrics
-- Supports counters, gauges, and histograms with flexible tagging

CREATE TABLE IF NOT EXISTS metrics (
  time        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name        TEXT NOT NULL,
  value       DOUBLE PRECISION NOT NULL,
  tags        JSONB DEFAULT '{}'
);

-- Convert to hypertable with time-based partitioning
SELECT create_hypertable('metrics', 'time', if_not_exists => TRUE);

-- Index for efficient queries by metric name and time
CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON metrics (name, time DESC);

-- Index for tag-based filtering
CREATE INDEX IF NOT EXISTS idx_metrics_tags ON metrics USING GIN (tags);
