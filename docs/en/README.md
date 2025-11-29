# SecuraDocs

> A secure, self-hostable file storage and sharing platform for organizations that need data sovereignty and privacy.

[![Status](https://img.shields.io/badge/status-MVP%20in%20development-yellow)](https://github.com/securdocs/securdocs)

## Overview

**SecuraDocs** is a secure file storage and sharing platform designed for social organizations, NGOs, and collectives that need data sovereignty and privacy. It's essentially a "Google Drive alternative" focused on security, autonomy, and control over data.

### Key Features

- 🔐 **Secure Authentication** - Better Auth with email/password
- 📁 **File Management** - Upload, download, and organize files in folders
- 👥 **Sharing & Permissions** - Share files with granular permission control
- 🔗 **Share Links** - Create public share links with expiration
- 📊 **Audit Logs** - Track who accessed what and when
- 🏠 **Self-Hostable** - Deploy on your own infrastructure for complete control

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Database** | PostgreSQL 16 + Drizzle ORM |
| **Authentication** | Better Auth |
| **File Storage** | Nextcloud (self-hosted via Docker) |
| **Package Manager** | pnpm |
| **Deployment** | Docker Compose |

## Quick Start (5 minutes)

### Prerequisites

- **Docker** and **Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)

That's it! Everything else runs in Docker.

### Step 1: Clone and Start

```bash
git clone https://github.com/your-org/securdocs.git
cd securdocs

# Start all services
docker compose up -d

# Wait for services to be ready (about 30-60 seconds)
docker compose ps
```

### Step 2: Run Database Migrations

```bash
docker compose exec app pnpm db:push
```

### Step 3: Configure Nextcloud

1. **Access Nextcloud** at http://localhost:8080
   - Login: `admin`
   - Password: `admin123`

2. **Create the SecuraDocs user:**
   - Click your avatar (top right) → **Users**
   - Click **New user**
   - Username: `securadocs`
   - Display name: `SecuraDocs`
   - Password: (choose a password)
   - Click **Add new user**

3. **Generate an App Password:**
   - Logout and login as `securadocs`
   - Click avatar → **Personal settings**
   - Go to **Security** (left sidebar)
   - Scroll to **Devices & sessions**
   - Enter "SecuraDocs API" as device name
   - Click **Create new app password**
   - **Copy the password** (you'll only see it once!)

4. **Create the storage folder:**
   - Go to **Files** (folder icon, top left)
   - Click **+** → **New folder**
   - Name it `SecuraDocs`

### Step 4: Configure the App

Update the `.env` file with your app password:

```bash
# Edit .env file
nano .env  # or use your preferred editor
```

Change this line:
```env
NEXTCLOUD_PASSWORD=your_app_password_here
```

### Step 5: Add Nextcloud Trusted Domain

```bash
docker exec -u www-data securdocs-nextcloud php occ config:system:set trusted_domains 2 --value=nextcloud
```

### Step 6: Restart the App

```bash
docker compose restart app
```

### Step 7: Access SecuraDocs

Open http://localhost:3000 and create your first user account!

---

## Default Credentials

| Service | URL | Username | Password |
|---------|-----|----------|----------|
| SecuraDocs | http://localhost:3000 | (create your own) | - |
| Nextcloud | http://localhost:8080 | `admin` | `admin123` |
| PostgreSQL | localhost:5432 | `postgres` | `postgres_dev_password` |

## Troubleshooting

### "Table does not exist" error
Run the database migrations:
```bash
docker compose exec app pnpm db:push
```

### Upload fails with 400 error
Make sure you:
1. Created the `SecuraDocs` folder in Nextcloud
2. Added the app password to `.env`
3. Added the trusted domain:
   ```bash
   docker exec -u www-data securdocs-nextcloud php occ config:system:set trusted_domains 2 --value=nextcloud
   ```
4. Restarted the app: `docker compose restart app`

### Check logs
```bash
# All services
docker compose logs -f

# Just the app
docker compose logs -f app

# Just Nextcloud
docker compose logs -f nextcloud
```

### Reset everything
```bash
docker compose down -v  # WARNING: This deletes all data!
docker compose up -d
```

---

## Development

### Project Structure

```
app/
  (app)/                # Protected routes (requires auth)
    dashboard/
    files/
    audit/
  (auth)/               # Authentication routes
    login/
    register/
  api/                  # API routes
    auth/
    files/
    folders/
    permissions/
    share/
    audit/
lib/
  auth.ts               # Better Auth configuration
  db/
    index.ts            # Drizzle instance
    schema.ts           # Database schemas
  storage/
    nextcloud.ts        # Nextcloud WebDAV client
  permissions/
    check.ts            # Permission validation
  audit/
    logger.ts           # Audit logging
components/
  ui/                   # shadcn/ui components
  files/                # File management components
  auth/                 # Auth components
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start all services |
| `docker compose logs -f app` | View app logs |
| `docker compose exec app pnpm db:push` | Run database migrations |
| `docker compose exec app pnpm db:studio` | Open Drizzle Studio |
| `docker compose restart app` | Restart the app |
| `docker compose down` | Stop all services |
| `./scripts/backup.sh` | Create a full backup |
| `./scripts/restore.sh <file>` | Restore from backup |

### Environment Variables

Key variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXTCLOUD_PASSWORD` | App password for Nextcloud API | (required) |
| `AUTH_SECRET` | Secret for signing sessions | `dev_secret...` |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app | `http://localhost:3000` |

### Testing with cURL

```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password123!"}' \
  -c cookies.txt

# Login
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"email":"test@example.com","password":"Password123!"}' \
  -c cookies.txt -b cookies.txt

# List files
curl http://localhost:3000/api/files -b cookies.txt

# Upload a file (text/plain example)
echo "Hello World" > test.txt
curl -X POST http://localhost:3000/api/files/upload \
  -b cookies.txt \
  -F "file=@test.txt;type=text/plain"

# Create a folder
curl -X POST http://localhost:3000/api/folders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"My Folder"}'
```

---

## Backup & Restore

SecuraDocs includes scripts to backup and restore all data (database, files, and configuration).

### Create a Backup

```bash
./scripts/backup.sh
```

This creates a compressed archive in `./backups/` containing:
- PostgreSQL database dump
- All Nextcloud files
- Configuration files (`.env`, `docker-compose.yml`)

Example output:
```
╔════════════════════════════════════════╗
║     Backup Complete!                   ║
╚════════════════════════════════════════╝

  📦 File: ./backups/securadocs_backup_20251128_184946.tar.gz
  📊 Size: 401M
```

### Restore from Backup

```bash
./scripts/restore.sh ./backups/securadocs_backup_20251128_184946.tar.gz
```

⚠️ **Warning:** This will overwrite all existing data!

### Scheduled Backups (Cron)

Add to crontab for daily backups at 2 AM:

```bash
# Edit crontab
crontab -e

# Add this line (adjust path as needed)
0 2 * * * cd /path/to/securadocs && ./scripts/backup.sh >> /var/log/securadocs-backup.log 2>&1
```

### Backup to Remote Storage

After creating a backup, you can copy it to remote storage:

```bash
# To S3
aws s3 cp ./backups/securadocs_backup_*.tar.gz s3://your-bucket/backups/

# To another server via SCP
scp ./backups/securadocs_backup_*.tar.gz user@remote-server:/backups/

# To Google Drive (using rclone)
rclone copy ./backups/ gdrive:SecuraDocs/backups/
```

---

## Production Deployment

For production, update these in `.env`:

```env
# Generate a secure secret
AUTH_SECRET=$(openssl rand -base64 32)

# Use your domain
NEXT_PUBLIC_APP_URL=https://docs.yourdomain.com

# Use strong passwords
POSTGRES_PASSWORD=your_secure_password
NEXTCLOUD_ADMIN_PASSWORD=your_secure_password
```

Run with production Dockerfile:
```bash
DOCKERFILE=Dockerfile docker compose up -d --build
```

See [MIGRATION_SELF_HOSTED.md](./MIGRATION_SELF_HOSTED.md) for detailed production deployment guide.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  SecuraDocs  │  │  Nextcloud   │  │  PostgreSQL  │   │
│  │  (Next.js)   │  │  (Storage)   │  │  (Database)  │   │
│  │  :3000       │  │  :8080       │  │  :5432       │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                  │           │
│         │    WebDAV API   │                  │           │
│         └─────────────────┘                  │           │
│                                              │           │
│         └────────── SQL queries ─────────────┘           │
└─────────────────────────────────────────────────────────┘
```

## Documentation

- **[PRD.md](./PRD.md)** - Product Requirements Document
- **[TECH_SPECS.md](./TECH_SPECS.md)** - Technical Specifications
- **[PLAN.md](./PLAN.md)** - Development Plan
- **[MIGRATION_SELF_HOSTED.md](./MIGRATION_SELF_HOSTED.md)** - Self-Hosted Migration Guide

## Contributing

Contributions are welcome! This project is designed to empower organizations with data sovereignty.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[To be defined]

---

**Status:** MVP in active development. See [PLAN.md](./PLAN.md) for current progress.
