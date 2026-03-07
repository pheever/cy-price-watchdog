#!/bin/sh
set -e

DB_HOST="${DB_HOST:-database}"
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:5432/${POSTGRES_DB}"

yarn prisma migrate deploy

PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  -h "${DB_HOST}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  -v "data_writer_pass=${DATA_WRITER_PASS}" \
  -v "data_reader_pass=${DATA_READER_PASS}" \
  -f ./init/001_users.sql
