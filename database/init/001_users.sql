-- Database users for scraper_db
-- Run after database creation

-- data_writer: read-write access for scraper service
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'data_writer') THEN
    CREATE ROLE data_writer WITH LOGIN PASSWORD 'data_writer_pass';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE scraper_db TO data_writer;
GRANT USAGE ON SCHEMA public TO data_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO data_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO data_writer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO data_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO data_writer;

-- data_reader: read-only access for API server
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'data_reader') THEN
    CREATE ROLE data_reader WITH LOGIN PASSWORD 'data_reader_pass';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE scraper_db TO data_reader;
GRANT USAGE ON SCHEMA public TO data_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO data_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO data_reader;
