-- Database users for metrics_db (TimescaleDB)
-- Run after database creation
-- Passwords are substituted from environment variables at runtime

-- metrics_writer: read-write access for Telegraf
SELECT 'CREATE ROLE metrics_writer WITH LOGIN PASSWORD ' || quote_literal(:'metrics_writer_pass')
WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'metrics_writer')\gexec

GRANT CONNECT ON DATABASE metrics_db TO metrics_writer;
GRANT USAGE ON SCHEMA public TO metrics_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO metrics_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO metrics_writer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO metrics_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO metrics_writer;
-- Telegraf needs to create tables dynamically
GRANT CREATE ON SCHEMA public TO metrics_writer;

-- metrics_reader: read-only access for Grafana
SELECT 'CREATE ROLE metrics_reader WITH LOGIN PASSWORD ' || quote_literal(:'metrics_reader_pass')
WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'metrics_reader')\gexec

GRANT CONNECT ON DATABASE metrics_db TO metrics_reader;
GRANT USAGE ON SCHEMA public TO metrics_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO metrics_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO metrics_reader;
