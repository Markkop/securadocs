#!/bin/bash
# SecuraDocs Restore Script
# Restores from a backup created by backup.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ -z "$1" ]; then
  echo -e "${RED}Error: No backup file specified${NC}"
  echo ""
  echo "Usage: $0 <backup_file.tar.gz>"
  echo ""
  echo "Example:"
  echo "  $0 ./backups/securadocs_backup_20250101_120000.tar.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
  exit 1
fi

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     SecuraDocs Restore Script          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}WARNING: This will overwrite existing data!${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

# Create temp directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo ""
echo -e "${YELLOW}[1/5]${NC} Extracting backup archive..."
tar xzf "$BACKUP_FILE" -C "$TEMP_DIR"
BACKUP_DIR=$(ls "$TEMP_DIR")
echo -e "      ${GREEN}✓${NC} Archive extracted"

echo -e "${YELLOW}[2/5]${NC} Stopping services..."
docker compose stop app
echo -e "      ${GREEN}✓${NC} Services stopped"

echo -e "${YELLOW}[3/5]${NC} Restoring PostgreSQL database..."
# Drop and recreate database
docker exec securdocs-postgres psql -U postgres -c "DROP DATABASE IF EXISTS securdocs;"
docker exec securdocs-postgres psql -U postgres -c "CREATE DATABASE securdocs OWNER securdocs;"
# Restore from backup
cat "${TEMP_DIR}/${BACKUP_DIR}/database.sql" | docker exec -i securdocs-postgres psql -U postgres securdocs
echo -e "      ${GREEN}✓${NC} Database restored"

echo -e "${YELLOW}[4/5]${NC} Restoring Nextcloud data..."
if [ -f "${TEMP_DIR}/${BACKUP_DIR}/nextcloud_data.tar.gz" ]; then
  # Clear existing data and restore
  docker run --rm \
    -v securadocs_nextcloud_data:/data \
    -v "${TEMP_DIR}/${BACKUP_DIR}":/backup:ro \
    alpine sh -c "rm -rf /data/* && tar xzf /backup/nextcloud_data.tar.gz -C /data"
  echo -e "      ${GREEN}✓${NC} Nextcloud data restored"
else
  echo -e "      ${YELLOW}⚠${NC} No Nextcloud data backup found, skipping"
fi

echo -e "${YELLOW}[5/5]${NC} Restarting services..."
docker compose up -d
echo -e "      ${GREEN}✓${NC} Services restarted"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Restore Complete!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo -e "  1. Wait for services to fully start: docker compose ps"
echo -e "  2. Test the application: http://localhost:3000"
echo ""

