# MIGRATION_SELF_HOSTED.md — Self-Hosted Deployment Guide with Nextcloud

## 1. Metadata

- **Project name:** SecuraDocs
- **Document version:** v0.2
- **Date:** 2025-01-10
- **Last update:** 2025-11-28 (Nextcloud Integration)
- **Author(s):** SecuraDocs Team
- **Status:** Approved

---

## 2. Overview

This document describes the SecuraDocs deployment process on self-hosted infrastructure using **Nextcloud** as the storage backend, ensuring complete data sovereignty and unified infrastructure.

### 2.1 Objectives

- Complete self-hosted deployment with Docker Compose
- PostgreSQL shared between SecuraDocs and Nextcloud
- File storage via Nextcloud WebDAV API
- Unified web interface with Nginx reverse proxy
- SSL/HTTPS with Let's Encrypt

### 2.2 Why Nextcloud?

- **Data sovereignty:** Complete control over where files are stored
- **Web interface:** Direct access to files via browser
- **Mobile/desktop apps:** Native synchronization with Nextcloud clients
- **Versioning:** Built-in file version history
- **Sharing:** Robust sharing system (can be integrated in the future)
- **Community:** Mature software with large community and documentation

### 2.3 Prerequisites

- Server/VPS with:
  - Minimum 2GB RAM (recommended: 4GB+)
  - 20GB+ disk space (depending on file volume)
  - Docker and Docker Compose installed
  - Root or sudo access
- Domain configured (optional for development, recommended for production)
- SSL certificate (Let's Encrypt via Certbot) for production

---

## 3. Self-Hosted Architecture

### 3.1 Components

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Servidor/VPS Self-Hosted                          │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Nginx (Reverse Proxy + SSL)                                   │ │
│  │  - Port: 80, 443 (external)                                     │ │
│  │  - SSL/TLS termination with Let's Encrypt                      │ │
│  │  - Routes:                                                      │ │
│  │    • docs.dominio.com → SecuraDocs (port 3000)                 │ │
│  │    • cloud.dominio.com → Nextcloud (port 80)                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│         ┌────────────────────┼────────────────────┐                 │
│         │                    │                    │                 │
│  ┌──────▼──────────┐  ┌──────▼──────────┐  ┌──────▼──────────┐     │
│  │  SecuraDocs     │  │  Nextcloud      │  │  PostgreSQL     │     │
│  │  (Next.js)      │  │  (Apache)       │  │  16-alpine      │     │
│  │                 │  │                 │  │                 │     │
│  │  Port: 3000     │  │  Port: 80       │  │  Port: 5432     │     │
│  │  (internal)     │  │  (internal)     │  │  (internal)     │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│         │                    │                    │                 │
│         │                    │                    │                 │
│         │  WebDAV API        │                    │                 │
│         │◄───────────────────┤                    │                 │
│         │                    │                    │                 │
│         └────────────────────┴────────────────────┘                 │
│                              │                                       │
│  ┌───────────────────────────▼────────────────────────────────────┐ │
│  │  Persistent Volumes                                            │ │
│  │  - postgres_data: /var/lib/postgresql/data                     │ │
│  │  - nextcloud_data: /var/www/html (app + files)                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
User
   │
   │ HTTPS
   ▼
┌─────────────────┐
│  Nginx (SSL)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
SecuraDocs  Nextcloud
    │         │
    │ WebDAV  │
    │◄────────┤ (file upload/download)
    │         │
    ▼         ▼
┌─────────────────┐
│   PostgreSQL    │
│ ┌─────┐ ┌─────┐ │
│ │ sd  │ │ nc  │ │ (separate databases)
│ └─────┘ └─────┘ │
└─────────────────┘
```

---

## 4. Docker Compose Setup

### 4.1 `docker-compose.yml` File

Create a `docker-compose.yml` file in the project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: securdocs-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
    ports:
      - "127.0.0.1:5432:5432"  # Localhost only
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  nextcloud:
    image: nextcloud:apache
    container_name: securdocs-nextcloud
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_DB: nextcloud
      POSTGRES_USER: nextcloud
      POSTGRES_PASSWORD: ${NEXTCLOUD_DB_PASSWORD}
      NEXTCLOUD_ADMIN_USER: admin
      NEXTCLOUD_ADMIN_PASSWORD: ${NEXTCLOUD_ADMIN_PASSWORD}
      NEXTCLOUD_TRUSTED_DOMAINS: "cloud.${DOMAIN} localhost"
      OVERWRITEPROTOCOL: https
    volumes:
      - nextcloud_data:/var/www/html
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: securdocs-app
    environment:
      DATABASE_URL: postgresql://securdocs:${SECURDOCS_DB_PASSWORD}@postgres:5432/securdocs
      AUTH_SECRET: ${AUTH_SECRET}
      NEXTCLOUD_URL: http://nextcloud
      NEXTCLOUD_USER: securadocs
      NEXTCLOUD_PASSWORD: ${NEXTCLOUD_APP_PASSWORD}
      NEXTCLOUD_WEBDAV_PATH: /remote.php/dav/files/securadocs
      NEXT_PUBLIC_APP_URL: https://docs.${DOMAIN}
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      nextcloud:
        condition: service_started
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: securdocs-nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - app
      - nextcloud
    restart: unless-stopped

volumes:
  postgres_data:
  nextcloud_data:
```

### 4.2 `.env` File for Docker

Create a `.env` file (do not commit to git):

```bash
# Domain
DOMAIN=seudominio.com

# PostgreSQL Master
POSTGRES_PASSWORD=senha_master_muito_segura

# Nextcloud Database
NEXTCLOUD_DB_PASSWORD=senha_nextcloud_db_segura

# Nextcloud Admin
NEXTCLOUD_ADMIN_PASSWORD=senha_admin_nextcloud_segura

# Nextcloud App Password (generate after initial Nextcloud setup)
NEXTCLOUD_APP_PASSWORD=generate_in_nextcloud_later

# SecuraDocs Database
SECURDOCS_DB_PASSWORD=senha_securdocs_db_segura

# SecuraDocs Auth
AUTH_SECRET=generate_with_openssl_rand_base64_32

# Environment
NODE_ENV=production
```

**To generate secure passwords:**
```bash
# Generate AUTH_SECRET
openssl rand -base64 32

# Generate database passwords
openssl rand -hex 16
```

### 4.3 Database Initialization Script (`init-db.sql`)

Create an `init-db.sql` file in the project root:

```sql
-- This script is automatically executed on first PostgreSQL initialization

-- Create databases
CREATE DATABASE nextcloud;
CREATE DATABASE securdocs;

-- Create users
CREATE USER nextcloud WITH ENCRYPTED PASSWORD 'senha_nextcloud_db_segura';
CREATE USER securdocs WITH ENCRYPTED PASSWORD 'senha_securdocs_db_segura';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE nextcloud TO nextcloud;
GRANT ALL PRIVILEGES ON DATABASE securdocs TO securdocs;

-- Additional configurations for Nextcloud
\c nextcloud
GRANT ALL ON SCHEMA public TO nextcloud;

-- Additional configurations for SecuraDocs
\c securdocs
GRANT ALL ON SCHEMA public TO securdocs;
```

**Important:** Update passwords in the script to match `.env` variables.

### 4.4 Dockerfile

Create a `Dockerfile` in the root:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Drizzle migrations if needed
RUN corepack enable pnpm && pnpm drizzle-kit generate

ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Note:** To use `standalone` output, add to `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  // ... other configurations
};
```

### 4.5 Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    # Upstreams
    upstream securdocs {
        server app:3000;
    }

    upstream nextcloud {
        server nextcloud:80;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name docs.seu-dominio.com cloud.seu-dominio.com;
        return 301 https://$host$request_uri;
    }

    # SecuraDocs (HTTPS)
    server {
        listen 443 ssl http2;
        server_name docs.seu-dominio.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Proxy settings for SecuraDocs
        location / {
            proxy_pass http://securdocs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        client_max_body_size 100M;
    }

    # Nextcloud (HTTPS)
    server {
        listen 443 ssl http2;
        server_name cloud.seu-dominio.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Robots-Tag "noindex, nofollow" always;
        add_header Referrer-Policy "no-referrer" always;

        # Proxy settings for Nextcloud
        location / {
            proxy_pass http://nextcloud;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebDAV support
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Port $server_port;
        }

        # Nextcloud specific - larger upload size
        client_max_body_size 512M;
        
        # Timeouts for large uploads
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
    }
}
```

**Note:** For local development without SSL, you can create a simplified version:

```nginx
# nginx/nginx-dev.conf (without SSL)
events {
    worker_connections 1024;
}

http {
    upstream securdocs {
        server app:3000;
    }

    upstream nextcloud {
        server nextcloud:80;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://securdocs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    server {
        listen 8080;
        server_name localhost;

        location / {
            proxy_pass http://nextcloud;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        client_max_body_size 512M;
    }
}
```

---

## 5. Deployment Process

### 5.1 Phase 1: Environment Preparation

1. **Provision server/VPS**
   ```bash
   # Install Docker and Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # Relogin to apply docker group
   # logout and login again, or:
   newgrp docker
   ```

2. **Configure domain and SSL** (for production)
   ```bash
   # Install Certbot
   sudo apt update
   sudo apt install certbot
   
   # Obtain certificates (adjust domains)
   sudo certbot certonly --standalone \
     -d docs.seu-dominio.com \
     -d cloud.seu-dominio.com
   ```

3. **Clone repository and create structure**
   ```bash
   git clone https://github.com/seu-org/securdocs.git
   cd securdocs
   
   # Create necessary directories
   mkdir -p nginx/{ssl,logs}
   
   # Copy certificates (if using SSL)
   sudo cp /etc/letsencrypt/live/docs.seu-dominio.com/fullchain.pem nginx/ssl/
   sudo cp /etc/letsencrypt/live/docs.seu-dominio.com/privkey.pem nginx/ssl/
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   
   # Edit .env with your configurations
   nano .env
   
   # Generate AUTH_SECRET
   echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env
   ```

### 5.2 Phase 2: Start Base Infrastructure

1. **Start PostgreSQL and Nextcloud**
   ```bash
   # Start only database and Nextcloud first
   docker compose up -d postgres
   
   # Wait for PostgreSQL to be healthy
   docker compose logs -f postgres
   # Ctrl+C when you see "database system is ready to accept connections"
   
   # Start Nextcloud
   docker compose up -d nextcloud
   
   # Wait for Nextcloud to initialize (may take a few minutes the first time)
   docker compose logs -f nextcloud
   ```

2. **Access and configure Nextcloud**
   ```bash
   # If in local development:
   # Access http://localhost:8080
   
   # If in production with SSL:
   # Access https://cloud.seu-dominio.com
   ```

3. **Create technical user `securadocs` in Nextcloud**
   
   Via web interface:
   - Login as admin (user configured in `NEXTCLOUD_ADMIN_USER`)
   - Go to **Users** (gear icon → Users)
   - Click **New user**
   - Username: `securadocs`
   - Password: a strong password (you will replace with app password)
   - Click **Create**

4. **Generate App Password for SecuraDocs**
   
   - Logout from admin and login as `securadocs`
   - Go to **Settings** → **Security**
   - In "Devices & sessions", enter a name: `SecuraDocs API`
   - Click **Create new app password**
   - **COPY THE GENERATED PASSWORD** (you will only see it once!)
   - Update `NEXTCLOUD_APP_PASSWORD` in your `.env`

5. **Create base directory in Nextcloud**
   
   - Still logged in as `securadocs`
   - Create a folder named `SecuraDocs` (will be the root directory for files)

### 5.3 Phase 3: Database Migration (if coming from NeonDB)

If you are migrating from an existing installation with NeonDB:

1. **Dump NeonDB**
   ```bash
   # Install PostgreSQL client if necessary
   sudo apt install postgresql-client
   
   # Create dump
   pg_dump "postgresql://user:password@neon-host/database" > backup.sql
   ```

2. **Restore dump in self-hosted PostgreSQL**
   ```bash
   # Copy backup to container
   docker cp backup.sql securdocs-postgres:/tmp/
   
   # Restore to securdocs database
   docker exec -it securdocs-postgres psql -U securdocs -d securdocs -f /tmp/backup.sql
   ```

3. **Validate migration**
   ```bash
   docker exec -it securdocs-postgres psql -U securdocs -d securdocs -c "SELECT COUNT(*) FROM users;"
   docker exec -it securdocs-postgres psql -U securdocs -d securdocs -c "SELECT COUNT(*) FROM files;"
   ```

### 5.4 Phase 4: File Migration (Supabase Storage → Nextcloud)

If you are migrating from an existing installation with Supabase Storage:

**Node.js migration script:**

```typescript
// scripts/migrate-files-supabase-to-nextcloud.ts
import { createClient } from '@supabase/supabase-js';
import { createClient as createWebDAVClient } from 'webdav';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';

// Supabase (source)
const supabase = createClient(
  process.env.SOURCE_SUPABASE_URL!,
  process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY!
);

// Nextcloud WebDAV (destination)
const nextcloud = createWebDAVClient(
  `${process.env.NEXTCLOUD_URL}${process.env.NEXTCLOUD_WEBDAV_PATH}`,
  {
    username: process.env.NEXTCLOUD_USER!,
    password: process.env.NEXTCLOUD_PASSWORD!,
  }
);

async function migrateFiles() {
  // Fetch all files from database
  const allFiles = await db.select().from(files);
  
  console.log(`Migrating ${allFiles.length} files...`);
  
  // Create base directory
  try {
    await nextcloud.createDirectory('/SecuraDocs', { recursive: true });
  } catch (e) {
    // Directory may already exist
  }
  
  for (const file of allFiles) {
    try {
      // Download from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('securdocs-files')
        .download(file.storagePath);
      
      if (downloadError) {
        console.error(`Error downloading ${file.storagePath}:`, downloadError);
        continue;
      }
      
      // Convert Blob to Buffer
      const buffer = Buffer.from(await fileData.arrayBuffer());
      
      // Upload to Nextcloud via WebDAV
      const nextcloudPath = `/SecuraDocs/${file.storagePath}`;
      
      // Create parent directories if necessary
      const parentDir = nextcloudPath.substring(0, nextcloudPath.lastIndexOf('/'));
      try {
        await nextcloud.createDirectory(parentDir, { recursive: true });
      } catch (e) {
        // May already exist
      }
      
      await nextcloud.putFileContents(nextcloudPath, buffer, {
        contentLength: buffer.length,
      });
      
      console.log(`✓ Migrated: ${file.name}`);
    } catch (error) {
      console.error(`Error migrating ${file.name}:`, error);
    }
  }
  
  console.log('Migration completed!');
}

migrateFiles();
```

**To execute:**
```bash
# Configure source environment variables
export SOURCE_SUPABASE_URL=https://xxx.supabase.co
export SOURCE_SUPABASE_SERVICE_ROLE_KEY=xxx

# Execute script
npx tsx scripts/migrate-files-supabase-to-nextcloud.ts
```

### 5.5 Phase 5: SecuraDocs Application Deployment

1. **Build and start SecuraDocs**
   ```bash
   # Build the application
   docker compose build app
   
   # Start all services
   docker compose up -d
   
   # Check status
   docker compose ps
   ```

2. **Run Drizzle migrations**
   ```bash
   # If it's a new installation
   docker compose exec app pnpm db:push
   
   # If you migrated data from NeonDB, tables already exist
   ```

3. **Verify Nextcloud connectivity**
   ```bash
   # Test WebDAV from inside container
   docker compose exec app curl -u securadocs:YOUR_APP_PASSWORD \
     http://nextcloud/remote.php/dav/files/securadocs/
   ```

### 5.6 Phase 6: Validation and Testing

1. **Basic functional tests**
   - [ ] Access SecuraDocs: `https://docs.seu-dominio.com`
   - [ ] Register new user
   - [ ] Login/logout
   - [ ] File upload
   - [ ] File download
   - [ ] Create folder
   - [ ] Share file
   - [ ] Verify audit logs

2. **Verify files in Nextcloud**
   - Access `https://cloud.seu-dominio.com`
   - Login as `securadocs`
   - Verify files appear in `SecuraDocs` folder

3. **Monitoring**
   ```bash
   # View logs from all services
   docker compose logs -f
   
   # View logs from a specific service
   docker compose logs -f app
   docker compose logs -f nextcloud
   
   # Monitor resource usage
   docker stats
   ```

4. **Verify service health**
   ```bash
   # Check running containers
   docker compose ps
   
   # Verify database connectivity
   docker compose exec postgres pg_isready -U postgres
   ```

---

## 6. Backup and Restore

### 6.1 Database Backup

Create script `scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups/db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup SecuraDocs database
docker exec securdocs-postgres pg_dump -U securdocs securdocs > "$BACKUP_DIR/securdocs_$TIMESTAMP.sql"

# Backup Nextcloud database (optional, recommended)
docker exec securdocs-postgres pg_dump -U nextcloud nextcloud > "$BACKUP_DIR/nextcloud_$TIMESTAMP.sql"

# Compress
gzip "$BACKUP_DIR/securdocs_$TIMESTAMP.sql"
gzip "$BACKUP_DIR/nextcloud_$TIMESTAMP.sql"

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Database backup created in $BACKUP_DIR"
```

### 6.2 File Backup (Nextcloud)

Create script `scripts/backup-files.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups/files"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Stop Nextcloud temporarily for consistent backup (optional)
# docker compose stop nextcloud

# Backup Nextcloud volume
docker run --rm \
  -v securdocs_nextcloud_data:/source:ro \
  -v $(pwd)/backups/files:/backup \
  alpine tar czf /backup/nextcloud_data_$TIMESTAMP.tar.gz -C /source .

# Restart Nextcloud (if stopped)
# docker compose start nextcloud

# Keep only last 7 days
find $BACKUP_DIR -name "nextcloud_data_*.tar.gz" -mtime +7 -delete

echo "File backup created: $BACKUP_DIR/nextcloud_data_$TIMESTAMP.tar.gz"
```

### 6.3 Database Restore

```bash
# Restore SecuraDocs database
gunzip -c backups/db/securdocs_TIMESTAMP.sql.gz | \
  docker exec -i securdocs-postgres psql -U securdocs -d securdocs

# Restore Nextcloud database (if necessary)
gunzip -c backups/db/nextcloud_TIMESTAMP.sql.gz | \
  docker exec -i securdocs-postgres psql -U nextcloud -d nextcloud
```

### 6.4 File Restore

```bash
# Stop Nextcloud
docker compose stop nextcloud

# Restore volume
docker run --rm \
  -v securdocs_nextcloud_data:/target \
  -v $(pwd)/backups/files:/backup \
  alpine sh -c "rm -rf /target/* && tar xzf /backup/nextcloud_data_TIMESTAMP.tar.gz -C /target"

# Restart Nextcloud
docker compose start nextcloud
```

### 6.5 Automate Backups

Add to crontab (`crontab -e`):

```cron
# Daily database backup at 2 AM
0 2 * * * /path/to/securdocs/scripts/backup-db.sh

# Daily file backup at 3 AM
0 3 * * * /path/to/securdocs/scripts/backup-files.sh
```

---

## 7. Maintenance and Updates

### 7.1 Update Application

```bash
# Pull changes
git pull origin main

# Rebuild and restart
docker-compose build app
docker-compose up -d app
```

### 7.2 Update System Dependencies

```bash
# Update Docker images
docker-compose pull
docker-compose up -d

# Clean old images
docker image prune -a
```

### 7.3 Renew SSL Certificate

```bash
# Certbot renews automatically, but can force:
sudo certbot renew --dry-run
```

---

## 8. Troubleshooting

### 8.1 Common Issues

**PostgreSQL doesn't start:**
```bash
# Check logs
docker-compose logs postgres

# Check volume permissions
sudo chown -R 999:999 data/postgres
```

**Nextcloud not accessible:**
```bash
# Check logs
docker-compose logs nextcloud

# Check if service is running
docker-compose ps nextcloud
```

**Application doesn't connect to database:**
```bash
# Check DATABASE_URL in .env
# Test connection manually
docker exec -it securdocs-postgres psql -U securdocs -d securdocs
```

### 8.2 Logs and Monitoring

```bash
# View all logs
docker-compose logs -f

# Logs from a specific service
docker-compose logs -f app

# View resource usage
docker stats
```

---

## 9. Deployment Checklist

### 9.1 Preparation
- [ ] Server provisioned with Docker installed
- [ ] Domain(s) configured (docs.dominio.com, cloud.dominio.com)
- [ ] SSL certificates obtained (Let's Encrypt)
- [ ] Repository cloned on server
- [ ] Configuration files created (.env, init-db.sql, nginx.conf)

### 9.2 Infrastructure
- [ ] PostgreSQL started and healthy
- [ ] Nextcloud started and accessible
- [ ] Technical user `securadocs` created in Nextcloud
- [ ] App password generated and configured in .env
- [ ] `SecuraDocs` directory created in Nextcloud

### 9.3 Application
- [ ] SecuraDocs built and started
- [ ] Drizzle migrations executed
- [ ] Nextcloud WebDAV connectivity tested
- [ ] Nginx configured with SSL

### 9.4 Migration (if applicable)
- [ ] NeonDB backup completed
- [ ] Dump restored in self-hosted PostgreSQL
- [ ] Files migrated from Supabase Storage to Nextcloud
- [ ] Data validated (record and file counts)

### 9.5 Validation
- [ ] Login/registration working
- [ ] File upload working
- [ ] File download working
- [ ] Files visible in Nextcloud
- [ ] Sharing working
- [ ] Audit logs working

### 9.6 Production
- [ ] DNS updated to point to new IPs
- [ ] Automated backups configured
- [ ] Monitoring configured
- [ ] Internal documentation updated

---

## 10. Next Steps After Migration

- [ ] Configure advanced monitoring (Prometheus, Grafana - optional)
- [ ] Implement alerts (e.g., service down, disk full)
- [ ] Document disaster recovery procedures
- [ ] Train team on basic maintenance
- [ ] Establish security update routine

---

## 11. References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Nextcloud Docker Image](https://hub.docker.com/_/nextcloud)
- [Nextcloud Admin Manual](https://docs.nextcloud.com/server/stable/admin_manual/)
- [Nextcloud WebDAV API](https://docs.nextcloud.com/server/stable/developer_manual/client_apis/WebDAV/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt / Certbot](https://certbot.eff.org/)

### Additional Resources

- [Nextcloud All-in-One (AIO)](https://github.com/nextcloud/all-in-one) - Simplified alternative
- [webdav npm package](https://www.npmjs.com/package/webdav) - WebDAV client for Node.js

