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
| **Database** | PostgreSQL (NeonDB for MVP) + Drizzle ORM |
| **Authentication** | Better Auth |
| **File Storage** | Supabase Storage (MVP) / MinIO (self-hosted) |
| **Package Manager** | pnpm |

## Prerequisites

- **Node.js** 18+ 
- **pnpm** (recommended) - `npm install -g pnpm`
- **Supabase Account** (for MVP) - [Sign up](https://supabase.com)
- **NeonDB Account** (for MVP) - [Sign up](https://neon.tech)

For production self-hosted deployment, see [MIGRATION_SELF_HOSTED.md](./MIGRATION_SELF_HOSTED.md).

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/your-org/securdocs.git
cd securdocs
pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Fill in the required variables:

```env
# Database (NeonDB)
DATABASE_URL=postgresql://user:password@host/database

# Authentication
AUTH_SECRET=your-random-secret-here-generate-with-openssl-rand-base64-32

# Supabase Storage (MVP)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Setup Supabase Storage

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Storage**
3. Create a new bucket named `securdocs-files`
4. Set bucket to **Private** (files accessed via API only)

### 4. Run Database Migrations

Once Drizzle is configured (Phase 0), run:

```bash
pnpm db:migrate
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

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

### MVP (Managed Services)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | NeonDB PostgreSQL connection string |
| `AUTH_SECRET` | Secret for signing cookies/tokens (generate with `openssl rand -base64 32`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_APP_URL` | Base URL of the application |

### Production (Self-Hosted)

See [MIGRATION_SELF_HOSTED.md](./MIGRATION_SELF_HOSTED.md) for self-hosted setup with MinIO.

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
      client.ts           # Supabase Storage client
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

- **Phase 0:** Setup and Infrastructure (Drizzle, Better Auth, Supabase Storage)
- **Phase 1:** Micro MVP (Authentication + Basic Upload/Download)
- **Phase 2:** MVP Core (Folders & Organization)
- **Phase 3:** MVP Sharing (Permissions & Share Links)
- **Phase 4:** MVP Complete (Audit Logs & Refinements)

See [PLAN.md](./PLAN.md) for the complete development roadmap.

## Deployment

### MVP (Quick Start)

Deploy to Vercel with managed services:

1. **Vercel** - Next.js hosting
2. **NeonDB** - PostgreSQL database
3. **Supabase Storage** - File storage

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Production (Self-Hosted)

For complete data sovereignty, deploy using Docker Compose:

```bash
docker-compose up -d
```

See [MIGRATION_SELF_HOSTED.md](./MIGRATION_SELF_HOSTED.md) for detailed self-hosted deployment guide.

## Documentation

- **[PRD.md](./PRD.md)** - Product Requirements Document
- **[TECH_SPECS.md](./TECH_SPECS.md)** - Technical Specifications
- **[PLAN.md](./PLAN.md)** - Development Plan
- **[MIGRATION_SELF_HOSTED.md](./MIGRATION_SELF_HOSTED.md)** - Self-Hosted Migration Guide

## Testing

Currently in MVP development. Testing instructions will be added as features are implemented.

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
