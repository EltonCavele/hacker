#!/bin/sh
# Restores a dump made by db-backup.sh into the database in DATABASE_URL, replacing existing objects.
# Usage: npm run db:restore -- backups/file.dump   (always rehearse on a copy first)
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
FILE="${1:?Usage: db-restore.sh <dump-file>}"
printf 'This replaces data in %s. Type "restore" to continue: ' "${DATABASE_URL##*@}"
read -r answer
[ "$answer" = "restore" ] || { echo "Aborted."; exit 1; }
pg_restore --clean --if-exists --no-owner --no-privileges --single-transaction --dbname="$DATABASE_URL" "$FILE"
echo "Restore finished"
