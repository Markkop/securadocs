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
| **Database** | PostgreSQL 16 (self-hosted, shared with Nextcloud) + Drizzle ORM |
| **Authentication** | Better Auth |
| **File Storage** | Nextcloud (self-hosted via Docker) |
| **Package Manager** | pnpm |
| **Deployment** | Docker Compose |

## Prerequisites

- **Node.js** 18+ 
- **pnpm** (recommended) - `npm install -g pnpm`
- **Docker** and **Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **Domain** (optional but recommended for production)
- **SSL Certificate** (Let's Encrypt recommended for production)

For detailed deployment instructions, see [MIGRATION_SELF_HOSTED.md](./MIGRATION_SELF_HOSTED.md).

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/your-org/securdocs.git
cd securdocs
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in the required variables:

```env
# Domain (use localhost for development)
DOMAIN=localhost

# PostgreSQL (shared with Nextcloud)
POSTGRES_PASSWORD=your_secure_master_password
SECURDOCS_DB_PASSWORD=your_securdocs_db_password
DATABASE_URL=postgresql://securdocs:your_securdocs_db_password@postgres:5432/securdocs

# Nextcloud
NEXTCLOUD_DB_PASSWORD=your_nextcloud_db_password
NEXTCLOUD_ADMIN_PASSWORD=your_nextcloud_admin_password
NEXTCLOUD_APP_PASSWORD=generate_after_nextcloud_setup

# SecuraDocs
AUTH_SECRET=your-random-secret-here-generate-with-openssl-rand-base64-32
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Nextcloud Integration
NEXTCLOUD_URL=http://nextcloud
NEXTCLOUD_USER=securadocs
NEXTCLOUD_PASSWORD=your_nextcloud_app_password
NEXTCLOUD_WEBDAV_PATH=/remote.php/dav/files/securadocs
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Start Infrastructure with Docker Compose

```bash
# Start all services (PostgreSQL + Nextcloud + SecuraDocs app in dev mode)
# The Next.js dev server runs inside the container with hot reload enabled
docker compose up -d

# Check logs
docker compose logs -f

# View app logs specifically
docker compose logs -f app
```

**Note:** By default, the app runs in **development mode** with hot reload. The source code is mounted as a volume, so changes to your code will automatically reload in the container. For production builds, set `DOCKERFILE=Dockerfile` environment variable.

### 4. Setup Nextcloud

1. Access Nextcloud at `http://localhost:8080` (or your domain)
2. Complete the initial setup wizard
3. Create a technical user named `securadocs`:
   - Go to **Users** → **Add User**
   - Username: `securadocs`
   - Generate a strong password
4. Generate an app password:
   - Login as `securadocs`
   - Go to **Settings** → **Security** → **Devices & sessions**
   - Create new app password named "SecuraDocs API"
   - Copy the password and update `NEXTCLOUD_APP_PASSWORD` in `.env`
5. Create the base directory:
   - In Nextcloud, create a folder named `SecuraDocs`

### 5. Run Database Migrations

```bash
# Run migrations inside the app container
docker compose exec app pnpm db:push
```

### 6. Access the Application

- **SecuraDocs:** [http://localhost:3000](http://localhost:3000)
- **Nextcloud:** [http://localhost:8080](http://localhost:8080)

### Development Mode

**Default (with Docker - Recommended):**

The Next.js dev server runs inside the Docker container by default with hot reload enabled. Source code changes are automatically reflected without rebuilding the container.

```bash
# Start all services (dev mode is default)
docker compose up -d

# View dev server logs
docker compose logs -f app
```

**Alternative (without Docker):**

For local development without Docker, you'll need:
1. A running PostgreSQL instance
2. A running Nextcloud instance (can be Docker)
3. Update `.env.local` with local URLs

```bash
pnpm dev
```

**Production Mode:**

To run a production build in Docker:

```bash
DOCKERFILE=Dockerfile docker compose up -d --build
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server at localhost:3000 |
| `pnpm build` | Create production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:migrate` | Run database migrations (once implemented) |
| `pnpm db:generate` | Generate Drizzle migrations (once implemented) |

## Environment Variables

### Required Variables

| Variable | Description |
|----------|-------------|
| `DOMAIN` | Your domain (e.g., `example.com`) or `localhost` for development |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Secret for signing cookies/tokens (generate with `openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | Base URL of the SecuraDocs application |

### PostgreSQL Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Master password for PostgreSQL |
| `SECURDOCS_DB_PASSWORD` | Password for the `securdocs` database user |
| `NEXTCLOUD_DB_PASSWORD` | Password for the `nextcloud` database user |

### Nextcloud Integration Variables

| Variable | Description |
|----------|-------------|
| `NEXTCLOUD_URL` | Internal URL to Nextcloud (e.g., `http://nextcloud` in Docker) |
| `NEXTCLOUD_USER` | Technical user for API access (e.g., `securadocs`) |
| `NEXTCLOUD_PASSWORD` | App password generated in Nextcloud |
| `NEXTCLOUD_WEBDAV_PATH` | WebDAV path (default: `/remote.php/dav/files/securadocs`) |
| `NEXTCLOUD_ADMIN_PASSWORD` | Admin password for Nextcloud setup |

See [MIGRATION_SELF_HOSTED.md](./MIGRATION_SELF_HOSTED.md) for detailed deployment instructions.

## Project Structure

```
src/
  app/
    (marketing)/          # Public routes (landing, about)
    (auth)/               # Authentication routes
      login/
      register/
    (app)/                # Protected routes (requires auth)
      dashboard/
      files/
      settings/
    api/                  # API routes
      auth/
      files/
      audit/
  lib/
    auth.ts               # Better Auth configuration
    db/
      index.ts            # Drizzle instance
      schema.ts            # Drizzle schemas
    storage/
      client.ts           # Nextcloud WebDAV client
      nextcloud.ts        # Nextcloud WebDAV implementation
    permissions/
      check.ts            # Permission validation
    audit/
      logger.ts           # Audit logging
  components/
    ui/                   # shadcn/ui components
    app/                  # App-specific components
```

For detailed structure, see [TECH_SPECS.md](./TECH_SPECS.md) section 5.2.

## Development Phases

The project follows an incremental development approach:

- **Phase 0-4:** MVP Standalone (Completed)
- **Phase 5:** Self-Hosted Infrastructure (Completed)
  - PostgreSQL local via Docker Compose
  - Nextcloud WebDAV for file storage
  - Full self-hosted stack

See [PLAN.md](./PLAN.md) for the complete development roadmap.

## Deployment

### Docker Compose (Recommended)

SecuraDocs is designed for self-hosted deployment using Docker Compose with Nextcloud:

```bash
# Clone the repository
git clone https://github.com/your-org/securdocs.git
cd securdocs

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start all services
docker compose up -d

# View logs
docker compose logs -f
```

**Services included:**
- **PostgreSQL 16** - Shared database for SecuraDocs and Nextcloud
- **Nextcloud** - File storage with WebDAV API
- **SecuraDocs** - Next.js application
- **Nginx** - Reverse proxy with SSL termination

### Production Setup

For production deployment with SSL:

1. Point your domain(s) to your server
2. Configure SSL certificates (Let's Encrypt recommended)
3. Update `DOMAIN` and `NEXT_PUBLIC_APP_URL` in `.env`
4. Update Nginx configuration for your domain

See [MIGRATION_SELF_HOSTED.md](./MIGRATION_SELF_HOSTED.md) for detailed production deployment guide.

### Architecture Overview

```
                    ┌─────────────────┐
                    │  Nginx (SSL)    │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │  SecuraDocs │   │  Nextcloud  │   │  PostgreSQL │
    │  (Next.js)  │   │  (Storage)  │   │  (Database) │
    └─────────────┘   └─────────────┘   └─────────────┘
```

## Documentation

- **[PRD.md](./PRD.md)** - Product Requirements Document
- **[TECH_SPECS.md](./TECH_SPECS.md)** - Technical Specifications
- **[PLAN.md](./PLAN.md)** - Development Plan
- **[MIGRATION_SELF_HOSTED.md](./MIGRATION_SELF_HOSTED.md)** - Self-Hosted Migration Guide

## Testing

### Quick Start (Local Development)

```bash
# 1. Start all services (includes Next.js dev server in container)
docker compose up -d

# 2. Wait for services to be ready
docker compose ps  # Check all services are healthy

# 3. View dev server logs (optional)
docker compose logs -f app

# 4. Access the app
open http://localhost:3000
```

**Note:** The Next.js dev server runs automatically in the container with hot reload. No need to run `pnpm dev` separately.

### Test APIs with CURL

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password123!"}' \
  -c cookies.txt

# Login
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}' \
  -c cookies.txt

# List files
curl http://localhost:3000/api/files -b cookies.txt

# Upload a file
curl -X POST http://localhost:3000/api/files/upload \
  -b cookies.txt \
  -F "file=@./README.md"

# Create a folder
curl -X POST http://localhost:3000/api/folders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"My Folder"}'

# Get audit logs
curl http://localhost:3000/api/audit -b cookies.txt
```

### Test Nextcloud Storage

```bash
npx tsx scripts/test-storage.ts
```

## Contributing

Contributions are welcome! This project is designed to empower organizations with data sovereignty.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[To be defined]

## Acknowledgments

- Inspired by the need for data sovereignty in social organizations
- Built with open-source tools and principles
- Designed for accessibility and ease of use

---

**Status:** MVP in active development. See [PLAN.md](./PLAN.md) for current progress.
