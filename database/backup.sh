#!/usr/bin/env bash
set -e

# =============================================================================
# VoiceSeek Database Backup Script
# Creates SQL and binary dumps of the database
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DB="${1:-voiceseek}"
CONTAINER_NAME="voiceseek-postgres"

echo "==> Backing up database '${SOURCE_DB}' to $SCRIPT_DIR..."

docker exec "$CONTAINER_NAME" pg_dump -U postgres --clean --if-exists "$SOURCE_DB" > "$SCRIPT_DIR/voiceseek_backup.sql"
docker exec "$CONTAINER_NAME" pg_dump -U postgres -Fc "$SOURCE_DB" > "$SCRIPT_DIR/voiceseek_backup.dump"

echo "==> Backup complete:"
ls -lh "$SCRIPT_DIR"/voiceseek_backup.*
