#!/bin/sh
# Logical backup of the database in DATABASE_URL to a compressed custom-format dump.
# Usage: npm run db:backup [-- output-file]   (needs pg_dump 17 on PATH, or run it inside the postgres container)
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
OUT="${1:-backups/db-$(date -u +%Y%m%dT%H%M%SZ).dump}"
mkdir -p "$(dirname "$OUT")"
pg_dump --format=custom --no-owner --no-privileges --dbname="$DATABASE_URL" --file="$OUT"
echo "Backup written to $OUT"
