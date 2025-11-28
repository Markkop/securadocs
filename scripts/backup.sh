#!/bin/bash
# SecuraDocs Backup Script
# Creates backups of PostgreSQL database and Nextcloud files

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="securadocs_backup_${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     SecuraDocs Backup Script           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

echo -e "${YELLOW}[1/4]${NC} Backing up PostgreSQL database..."
docker exec securdocs-postgres pg_dump -U postgres securdocs > "${BACKUP_DIR}/${BACKUP_NAME}/database.sql"
echo -e "      ${GREEN}✓${NC} Database backup complete"

echo -e "${YELLOW}[2/4]${NC} Backing up Nextcloud data..."
# Create a tar of the Nextcloud data volume
docker run --rm \
  -v securadocs_nextcloud_data:/data:ro \
  -v "$(pwd)/${BACKUP_DIR}/${BACKUP_NAME}":/backup \
  alpine tar czf /backup/nextcloud_data.tar.gz -C /data .
echo -e "      ${GREEN}✓${NC} Nextcloud data backup complete"

echo -e "${YELLOW}[3/4]${NC} Backing up configuration files..."
cp .env "${BACKUP_DIR}/${BACKUP_NAME}/.env" 2>/dev/null || echo "      (no .env file found)"
cp docker-compose.yml "${BACKUP_DIR}/${BACKUP_NAME}/docker-compose.yml"
echo -e "      ${GREEN}✓${NC} Configuration backup complete"

echo -e "${YELLOW}[4/4]${NC} Creating compressed archive..."
cd "${BACKUP_DIR}"
tar czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"
cd - > /dev/null

# Calculate size
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Backup Complete!                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "  📦 File: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo -e "  📊 Size: ${BACKUP_SIZE}"
echo ""
echo -e "  ${YELLOW}To restore, run:${NC}"
echo -e "  ./scripts/restore.sh ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo ""

