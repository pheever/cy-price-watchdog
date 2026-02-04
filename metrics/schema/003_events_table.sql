-- Events hypertable for storing user interaction and system events
-- Supports flexible properties for different event types

CREATE TABLE IF NOT EXISTS events (
  time        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event       TEXT NOT NULL,
  session_id  TEXT,
  user_agent  TEXT,
  properties  JSONB DEFAULT '{}'
);

-- Convert to hypertable with time-based partitioning
SELECT create_hypertable('events', 'time', if_not_exists => TRUE);

-- Index for efficient queries by event type and time
CREATE INDEX IF NOT EXISTS idx_events_event_time ON events (event, time DESC);

-- Index for session-based queries
CREATE INDEX IF NOT EXISTS idx_events_session ON events (session_id, time DESC) WHERE session_id IS NOT NULL;

-- Index for property-based filtering
CREATE INDEX IF NOT EXISTS idx_events_properties ON events USING GIN (properties);
