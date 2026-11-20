#!/usr/bin/env bash
set -e

# =============================================================================
# VoiceSeek Database Restore Script
# Restores the complete database dump into PostgreSQL
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DB="${1:-voiceseek}"
CONTAINER_NAME="voiceseek-postgres"

echo "==> Restoring VoiceSeek database to '${TARGET_DB}'..."

# Ensure target database exists
EXISTS=$(docker exec "$CONTAINER_NAME" psql -U postgres -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '${TARGET_DB}'" | tr -d '[:space:]')
if [ "$EXISTS" != "1" ]; then
  echo "==> Database '${TARGET_DB}' does not exist, creating it..."
  docker exec "$CONTAINER_NAME" psql -U postgres -d postgres -c "CREATE DATABASE ${TARGET_DB};"
fi

# Restore using binary dump or SQL dump
if [ -f "$SCRIPT_DIR/voiceseek_backup.dump" ]; then
  echo "==> Restoring from binary dump: voiceseek_backup.dump..."
  docker exec -i "$CONTAINER_NAME" pg_restore -U postgres -d "$TARGET_DB" --clean --if-exists < "$SCRIPT_DIR/voiceseek_backup.dump" || true
elif [ -f "$SCRIPT_DIR/voiceseek_backup.sql" ]; then
  echo "==> Restoring from SQL dump: voiceseek_backup.sql..."
  docker exec -i "$CONTAINER_NAME" psql -U postgres -d "$TARGET_DB" < "$SCRIPT_DIR/voiceseek_backup.sql"
else
  echo "ERROR: No backup files found in $SCRIPT_DIR!"
  exit 1
fi

echo "==> Verifying restore on '${TARGET_DB}'..."
docker exec "$CONTAINER_NAME" psql -U postgres -d "$TARGET_DB" -c "
SELECT 'users' AS table_name, count(*) AS total_rows FROM users
UNION ALL SELECT 'plans', count(*) FROM plans
UNION ALL SELECT 'phone_numbers', count(*) FROM phone_numbers
UNION ALL SELECT 'calls', count(*) FROM calls
UNION ALL SELECT 'conversations', count(*) FROM conversations
UNION ALL SELECT 'messages', count(*) FROM messages;
"

echo "==> Database restore completed successfully! 🎉"
