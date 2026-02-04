-- Data retention policies and continuous aggregates
-- Keeps detailed data for short-term analysis and aggregates for long-term trends

-- Keep detailed metrics for 7 days
SELECT add_retention_policy('metrics', INTERVAL '7 days', if_not_exists => TRUE);

-- Keep events for 30 days
SELECT add_retention_policy('events', INTERVAL '30 days', if_not_exists => TRUE);

-- Continuous aggregate for hourly metrics (long-term trend analysis)
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS bucket,
  name,
  AVG(value) AS avg_value,
  MIN(value) AS min_value,
  MAX(value) AS max_value,
  COUNT(*) AS count
FROM metrics
GROUP BY bucket, name
WITH NO DATA;

-- Refresh policy for hourly aggregates
SELECT add_continuous_aggregate_policy('metrics_hourly',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE);

-- Keep hourly aggregates for 90 days
SELECT add_retention_policy('metrics_hourly', INTERVAL '90 days', if_not_exists => TRUE);

-- Continuous aggregate for daily event counts
CREATE MATERIALIZED VIEW IF NOT EXISTS events_daily
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', time) AS bucket,
  event,
  COUNT(*) AS count,
  COUNT(DISTINCT session_id) AS unique_sessions
FROM events
GROUP BY bucket, event
WITH NO DATA;

-- Refresh policy for daily event aggregates (window must cover at least 2 buckets)
SELECT add_continuous_aggregate_policy('events_daily',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day',
  if_not_exists => TRUE);

-- Keep daily event aggregates for 1 year
SELECT add_retention_policy('events_daily', INTERVAL '365 days', if_not_exists => TRUE);
