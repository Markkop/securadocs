# TECH_SPECS.md — Technical Specification

## 1. Metadata

- **Project name:** SecuraDocs
- **Document version:** v0.2
- **Date:** 2025-01-10
- **Last update:** 2025-11-28 (Pivot to Nextcloud)
- **Author(s):** SecuraDocs Team
- **Status:** Approved (transitioning to Nextcloud)

---

## 2. Technical Vision Summary

> 2–3 sentences about how the system will be implemented.

- Front-end & back-end unified in **Next.js 16 (App Router)** with React 19 and TypeScript.
- UI with **Tailwind CSS 4** and components via **shadcn/ui** for accessibility and customization.
- Persistence in **PostgreSQL** shared with Nextcloud (self-hosted via Docker) with **Drizzle ORM** for type-safety.
- Authentication with **Better Auth** (FOSS, flexible) integrated with Drizzle adapter, with possibility of future integration with Nextcloud.
- File storage via **Nextcloud WebDAV API** (self-hosted) for complete data sovereignty.

> **Note:** This stack was chosen to balance productivity, security, and **complete sovereignty** of data via self-hosted Nextcloud.

---

## 3. High-Level Architecture

### 3.1 Diagram (text)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                                │
│             Next.js App (React 19) + Tailwind CSS + shadcn/ui           │
└────────────────────────────────┬────────────────────────────────────────┘
                                  │ HTTPS
                                  │
┌────────────────────────────────▼────────────────────────────────────────┐
│                    Nginx (Reverse Proxy + SSL)                          │
│  ┌─────────────────────────┐    ┌─────────────────────────────────┐    │
│  │ docs.dominio.com        │    │ cloud.dominio.com               │    │
│  │ → SecuraDocs (3000)     │    │ → Nextcloud (80)                │    │
│  └─────────────────────────┘    └─────────────────────────────────┘    │
└────────────┬────────────────────────────────────┬───────────────────────┘
             │                                    │
┌────────────▼────────────────┐    ┌──────────────▼──────────────────────┐
│  SecuraDocs (Next.js)       │    │  Nextcloud                          │
│  ┌────────────────────────┐ │    │  ┌────────────────────────────────┐ │
│  │ Route Handlers (/api/*) │ │    │  │ WebDAV API                     │ │
│  │ Server Actions          │ │    │  │ /remote.php/dav/files/user     │ │
│  │ Server Components       │ │    │  │                                │ │
│  └────────────────────────┘ │    │  │ User Management (opcional)     │ │
│  ┌────────────────────────┐ │    │  │ Sharing (opcional)             │ │
│  │ Better Auth            │ │    │  └────────────────────────────────┘ │
│  └────────────────────────┘ │    │                                     │
└────────────┬────────────────┘    └─────────────────┬───────────────────┘
             │                                        │
             │         WebDAV (upload/download)       │
             │◄──────────────────────────────────────►│
             │                                        │
             │    ┌───────────────────────────────────┘
             │    │
┌────────────▼────▼───────────────────────────────────────────────────────┐
│                    PostgreSQL (Shared)                                 │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │  Database: securdocs        │  │  Database: nextcloud            │  │
│  │  - users                    │  │  - oc_users                     │  │
│  │  - files (metadata)        │  │  - oc_filecache                 │  │
│  │  - folders                  │  │  - oc_share                     │  │
│  │  - permissions              │  │  - ...                          │  │
│  │  - audit_logs               │  │                                 │  │
│  │  - share_links              │  │                                 │  │
│  └─────────────────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Persistent volume
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Nextcloud Data (Storage)                             │
│  /var/www/html/data/securadocs/files/                                   │
│  - Binary files organized by user                                      │
│  - Managed by Nextcloud                                                │
└─────────────────────────────────────────────────────────────────────────┘
```


### 3.2 Boundaries / Bounded Contexts

- **Authentication & Users Context**
  - User, session, profile management.
  - Integration with Better Auth (primary).
  - Possibility of synchronization with Nextcloud users (future).

- **Files & Folders Context**
  - Upload, download, hierarchical organization.
  - Integration with **Nextcloud WebDAV** for file storage.
  - Metadata stored in PostgreSQL (database `securdocs`).

- **Permissions & Sharing Context**
  - Granular access control via own system.
  - Sharing links and tokens.
  - Possibility of integration with Nextcloud Share API (future).

- **Auditing Context**
  - Event and action logs.
  - Log export and visualization.

- **Nextcloud Context (New)**
  - Physical file storage management.
  - WebDAV API for file operations.
  - Separate web interface for direct file access (optional).

---

## 4. Technology Stack

### 4.1 Framework & Language

- **Web framework:** Next.js 16.0.5 (App Router)
- **Language:** TypeScript 5.x
- **Rendering type:** Server Components (default) + Client Components (when necessary for interactivity)
- **React:** 19.2.0

### 4.2 Front-end

- **Styling:** Tailwind CSS 4.x
- **Component library:** shadcn/ui  
  - *Guideline:* components should be added via commands `npx shadcn@latest add <component>` (do not copy/paste manually).
  - Components based on Radix UI for accessibility.
- **Global state (if any):** React Context API or Zustand (evaluate need as complexity grows).
- **Forms:** React Hook Form + Zod for validation.

### 4.3 Back-end

- **Runtime:** Node.js (via Next.js)
- **API pattern:** Route Handlers (`app/api/*/route.ts`) and Server Actions (`use server`)
- **Data validation:** Zod
- **ORM:** Drizzle ORM
- **Query Builder:** Drizzle ORM (type-safe queries)

### 4.4 Database

- **Engine:** PostgreSQL 16
- **Provider:** PostgreSQL self-hosted (Docker container shared with Nextcloud)
- **ORM/Query builder:** Drizzle ORM (`drizzle-orm`)
- **Migrations:** Drizzle Kit (`drizzle-kit`)
- **Driver:** `pg` or `postgres` (native driver for self-hosted PostgreSQL)
- **Configuration:**
  - Database `securdocs` for SecuraDocs tables
  - Database `nextcloud` for Nextcloud tables (automatically managed)
  - Separate users with isolated permissions


### 4.5 Authentication & Authorization

- **Library:** Better Auth (`better-auth`)
- **Adapter:** Drizzle adapter (`better-auth/adapters/drizzle`)
- **Session method:** Signed cookies (Better Auth default)
- **Role/claims management:**  
  - Role definition (e.g., `admin`, `member`, `guest`).
  - Permission mapping to resources (files, folders).
  - Authorization middleware in Route Handlers and Server Actions.

### 4.6 File Storage

- **Storage:** Nextcloud (self-hosted via Docker)
- **Access protocol:** WebDAV (open standard, widely supported)
- **SDK:** `webdav` (npm package) or native fetch with WebDAV headers
- **WebDAV endpoint:** `{NEXTCLOUD_URL}/remote.php/dav/files/{username}`
- **Technical user:** `securadocs` (created in Nextcloud for exclusive app use)
- **Directory structure:**
  ```
  /SecuraDocs/
  ├── {userId}/
  │   ├── {timestamp}-{filename}
  │   └── ...
  ```

**Nextcloud advantages:**
- Web interface for administration and direct file access
- Built-in file versioning
- File preview (images, PDFs, documents)
- Mobile and desktop apps for synchronization
- Native sharing system (can be integrated in the future)
- WebDAV is an open standard protocol, widely supported


### 4.7 Infrastructure & Deployment

- **Deployment environment:** Docker Compose (self-hosted) with PostgreSQL + Nextcloud + Next.js
- **Docker components:**
  - `postgres:16-alpine` - Shared database
  - `nextcloud:apache` - File storage + web interface
  - `securdocs-app` - Next.js application (custom build)
  - `nginx:alpine` - Reverse proxy with SSL
- **Build configuration:**  
  - `pnpm install` (package manager)
  - `pnpm run build` (Next.js build)
  - `docker compose build` (build all containers)

**Environment variables (Nextcloud Integration):**

```env
# Domain
DOMAIN=seudominio.com

# PostgreSQL (shared)
DATABASE_URL=postgresql://securdocs:${SECURDOCS_DB_PASSWORD}@postgres:5432/securdocs
POSTGRES_PASSWORD=senha_master_segura
SECURDOCS_DB_PASSWORD=senha_securdocs_db

# Nextcloud
NEXTCLOUD_URL=http://nextcloud
NEXTCLOUD_USER=securadocs
NEXTCLOUD_PASSWORD=app_password_gerado_no_nextcloud
NEXTCLOUD_WEBDAV_PATH=/remote.php/dav/files/securadocs
NEXTCLOUD_DB_PASSWORD=senha_nextcloud_db
NEXTCLOUD_ADMIN_PASSWORD=senha_admin_nextcloud

# SecuraDocs App
AUTH_SECRET=gerar_com_openssl_rand_base64_32
NEXT_PUBLIC_APP_URL=https://docs.${DOMAIN}
```


---

## 5. Modules & Layers

### 5.1 Domain Modules

- **Users Module**
  - Entities: `User`, `Session`, `Account` (Better Auth)
  - Operations: register, login, logout, profile

- **Files Module**
  - Entities: `File`, `Folder`, `FileVersion` (future)
  - Operations: upload, download, listing, search

- **Permissions Module**
  - Entities: `Permission`, `ShareLink`, `ResourceAccess`
  - Operations: create/revoke permissions, validate access

- **Auditing Module**
  - Entities: `AuditLogEntry`, `LoginEvent`, `FileAccessEvent`
  - Operations: log events, query logs, export

### 5.2 Folder Organization (Next.js)

Suggested structure:

```txt
src/
  app/
    (marketing)/          # Public routes (landing, about)
      page.tsx
    (auth)/               # Authentication routes
      login/
        page.tsx
      register/
        page.tsx
    (app)/                # Protected routes (requires auth)
      dashboard/
        page.tsx
      files/
        page.tsx
        [folderId]/
          page.tsx
      settings/
        page.tsx
    api/
      auth/
        [...all]/
          route.ts        # Better Auth proxy
      files/
        upload/
          route.ts
        download/
          [fileId]/
            route.ts
        share/
          route.ts
      audit/
        route.ts
  lib/
    auth.ts               # Better Auth configuration
    db/
      index.ts            # Drizzle instance
      schema.ts           # Drizzle schemas
      migrations/         # Generated migrations
    storage/
      client.ts           # Storage abstraction
      nextcloud.ts        # WebDAV client for Nextcloud
    permissions/
      check.ts            # Permission validation
    audit/
      logger.ts           # Event logger
  components/
    ui/                   # shadcn/ui components
    app/                  # App-specific components
      file-upload.tsx
      file-list.tsx
      folder-tree.tsx
      share-dialog.tsx
  types/
    index.ts              # Shared TypeScript types
```

---

## 6. Main Flows (Technical)

> Describe request → logic → DB → response.

### 6.1 Login Flow

1. Client sends credentials (email + password) to `/api/auth/sign-in` (via Better Auth).
2. Better Auth validates credentials against database (Drizzle query on `users`).
3. Better Auth creates session and stores in `sessions` (via Drizzle adapter).
4. Session cookie is set in response (signed with `AUTH_SECRET`).
5. Client redirected to dashboard (`/dashboard`).
6. Protected routes verify session via middleware/Server Component.

### 6.2 File Upload Flow

1. Client sends file (FormData) via POST to `/api/files/upload`.
2. Server Action or Route Handler validates:
   - User session (via Better Auth).
   - Permissions on destination folder (if specified).
   - File type and size (Zod validation).
3. File is sent to Nextcloud via WebDAV with unique key (`{userId}/{timestamp}-{filename}`).
4. Record is created in DB (`files` table) with metadata:
   - `id`, `owner_id`, `folder_id`, `name`, `mime_type`, `size_bytes`, `storage_path`, `created_at`
5. Optional: creates audit entry in `audit_logs` (`FILE_UPLOAD`).
6. Returns response with created file metadata.

### 6.3 Sharing Flow with Permissions

1. User requests creation of sharing link (POST `/api/files/share`).
2. Back-end validates:
   - User has sharing permission on resource.
   - Resource exists (file or folder).
3. Generates cryptographically secure unique token (`crypto.randomBytes` or `nanoid`).
4. Registers in `share_links`:
   - `id`, `resource_type`, `resource_id`, `token`, `created_by`, `permission_level`, `expires_at` (optional)
5. Returns public link: `{APP_URL}/share/{token}`
6. When someone accesses the link:
   - Back-end searches `share_links` by token.
   - Validates expiration and permissions.
   - Returns file or file list (if folder) with permissions applied.

### 6.4 Download Flow with Permission Validation

1. Client requests download (GET `/api/files/download/[fileId]`).
2. Back-end validates:
   - User session (if authenticated) or sharing token (if public link).
   - Permissions on file (owner, shared with user, or valid link).
3. Searches file metadata in `files`.
4. Retrieves file from Nextcloud via WebDAV and returns as stream.
5. Records audit event (`FILE_DOWNLOAD`).
6. Returns file or redirects to pre-signed URL.

---

## 7. Data Modeling

> Drizzle ORM schema (PostgreSQL)

### 7.1 Main Tables

**Table `users`** (managed by Better Auth via Drizzle adapter)

```typescript
// Schema generated by Better Auth
{
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}
```

**Table `folders`**

```typescript
{
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  parentFolderId: uuid("parent_folder_id").references(() => folders.id), // nullable for root
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}
```

**Table `files`**

```typescript
{
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  folderId: uuid("folder_id").references(() => folders.id), // nullable for root
  name: text("name").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  storagePath: text("storage_path").notNull(), // path in Nextcloud
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}
```

**Table `permissions`**

```typescript
{
  id: uuid("id").defaultRandom().primaryKey(),
  resourceType: text("resource_type").notNull(), // 'file' | 'folder'
  resourceId: uuid("resource_id").notNull(), // references files.id or folders.id
  userId: text("user_id").references(() => users.id), // nullable if public link
  permissionLevel: text("permission_level").notNull(), // 'read' | 'write' | 'admin'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}
```

**Table `share_links`**

```typescript
{
  id: uuid("id").defaultRandom().primaryKey(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id").notNull(),
  token: text("token").notNull().unique(),
  createdBy: text("created_by").notNull().references(() => users.id),
  permissionLevel: text("permission_level").notNull(),
  expiresAt: timestamp("expires_at"), // nullable = no expiration
  createdAt: timestamp("created_at").defaultNow().notNull(),
}
```

**Table `audit_logs`**

```typescript
{
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id), // nullable for anonymous actions
  action: text("action").notNull(), // 'LOGIN', 'FILE_UPLOAD', 'FILE_DOWNLOAD', 'PERMISSION_CHANGED', etc.
  resourceType: text("resource_type"), // nullable
  resourceId: uuid("resource_id"), // nullable
  ipAddress: text("ip_address"), // optional, respecting LGPD
  metadata: jsonb("metadata"), // additional data in JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
}
```

### 7.2 Recommended Indexes

```typescript
// In files
index("files_owner_idx").on(files.ownerId),
index("files_folder_idx").on(files.folderId),

// In folders
index("folders_owner_idx").on(folders.ownerId),
index("folders_parent_idx").on(folders.parentFolderId),

// In permissions
index("permissions_resource_idx").on(permissions.resourceType, permissions.resourceId),
index("permissions_user_idx").on(permissions.userId),

// In share_links
index("share_links_token_idx").on(shareLinks.token),
index("share_links_resource_idx").on(shareLinks.resourceType, shareLinks.resourceId),

// In audit_logs
index("audit_logs_user_idx").on(auditLogs.userId),
index("audit_logs_created_idx").on(auditLogs.createdAt),
index("audit_logs_action_idx").on(auditLogs.action),
```

---

## 8. Security

### 8.1 Principles

* **Least privilege:** Users only access resources with explicit permission.
* **Defense-in-depth:** Multiple validation layers (client, server, database).
* **Attack surface reduction:** Rigorous input validation, sanitization.

### 8.2 Technical Measures

* **Transport:** HTTPS mandatory in production (TLS 1.2+).
* **Storage:**
  * Files stored in Nextcloud (can configure encryption in Nextcloud).
  * Passwords never in plain text (hash with argon2 or bcrypt via Better Auth).
* **Password & Auth:**
  * Better Auth uses secure hash by default.
  * Rate limiting on login endpoints (implement via middleware).
* **Protection against common attacks:**
  * **CSRF:** Protection via SameSite cookies (Better Auth).
  * **XSS:** Input sanitization, Content Security Policy (CSP).
  * **SQL Injection:** Drizzle ORM prevents (parameterized queries).
  * **Path Traversal:** `storage_path` validation before accessing storage.
  * **Brute Force:** Rate limiting on login (future: CAPTCHA after N attempts).
* **Secret management:**
  * Environment variables (`.env.local` not committed).
  * Secrets manager in production (e.g., Vercel Secrets, AWS Secrets Manager).

### 8.3 Permission Validation

* All critical operations validate permissions server-side.
* Authorization middleware in Route Handlers.
* Helper functions in `lib/permissions/check.ts` for reuse.

---

## 9. Auditing & Logs

* **Definition of what is logged:**
  * Logins (success and failure).
  * File Upload/Download.
  * Sharing creation/removal.
  * Permission changes.
  * Administrative actions.

* **Log format:** JSONB in database (`audit_logs.metadata`), export in CSV/JSON.

* **Log retention:** Configurable (default: 90 days). Old logs can be archived or deleted according to organization policy.

* **Privacy:** IP addresses are optional and can be omitted for LGPD/GDPR compliance.

---

## 10. External Integrations

* **Email (future):**
  * Provider: Resend, SendGrid, or own SMTP.
  * Library: `resend` or `nodemailer`.
  * Templates: React Email or simple HTML.

* **Storage (Nextcloud):**
  * Protocol: WebDAV
  * Implementation: `lib/storage/nextcloud.ts` with native fetch
  * Base directory: `/SecuraDocs/{userId}/`
  * Access policy: Authentication via Nextcloud app password

---

## 11. Deployment, Infrastructure & Observability

### 11.1 Environments

* **Local/Development:** 
  - Docker Compose with PostgreSQL + Nextcloud
  - Next.js dev server (`pnpm dev`)
  - Or `docker compose up -d` for complete stack

* **Production:**
  - Docker Compose on VPS (see MIGRATION_SELF_HOSTED.md)
  - PostgreSQL + Nextcloud + Next.js + Nginx
  - SSL via Let's Encrypt

### 11.2 CI/CD Pipeline

* **Lint:** `pnpm lint` (ESLint).
* **Type check:** `tsc --noEmit`.
* **Build:** `pnpm build` (Next.js).
* **Deploy:** Automatic via Vercel (push to `main`) or manual via Docker.

### 11.3 Monitoring & Logs

* **Logging:** Console logs in development, structured logging in production (optional: Pino, Winston).
* **Errors:** Sentry or similar (optional in MVP).
* **Basic metrics:** Vercel Analytics (optional).

---

## 12. Testing Plan

* **Test types:**
  * **Unit:** Domain functions (permission validation, data formatting).
  * **Integration:** API + DB (Route Handler tests with test DB).
  * **End-to-end:** Main flows (Playwright or Cypress) - future.

* **MVP priorities:**
  * Test authentication (login, register, logout).
  * Test file upload and access (with permission validation).
  * Test sharing link creation and validation.

---

## 13. Technical Roadmap (High Level)

> 5 main technical milestones.

1. **Project setup** (Phase 0)
   - Next.js + Tailwind + shadcn + Drizzle + PostgreSQL + Better Auth.
   - Folder structure and basic configurations.

2. **Implement basic user and file modules** (Phase 1)
   - Functional authentication.
   - Basic upload/download.

3. **Implement folder and organization system** (Phase 2)
   - Folder hierarchy.
   - Navigation and organization.

4. **Implement permissions and sharing** (Phase 3)
   - Granular access control.
   - Sharing links.

5. **Implement audit logs and refine** (Phase 4)
   - Logging system.
   - Refined UI/UX.
   - Security hardening.

---

## 14. Open Questions

> List technical questions that still need decisions.

* **Multi-tenant:** Do we need multi-tenant (multiple organizations in the same deployment) in the MVP? (Decision: Not in MVP, future)
* **Backup:** How will automated backup be (db + files)? (See MIGRATION_SELF_HOSTED.md for strategy)
* **File preview:** Implement image/PDF preview? (Decision: Can use Nextcloud native preview)
* **Rate limiting:** Rate limiting implemented via middleware

---

## 15. Attachments

* Links to diagrams (e.g., Excalidraw, Figma) - create as needed.
* Links to issues or board (GitHub, Linear, etc.) - create as needed.
* Reference documentation:
  - [Better Auth Docs](https://www.better-auth.com/docs)
  - [Drizzle ORM Docs](https://orm.drizzle.team/)
  - [PostgreSQL Docs](https://www.postgresql.org/docs/)
  - [Nextcloud WebDAV API](https://docs.nextcloud.com/server/stable/developer_manual/client_apis/WebDAV/)

---

## 16. Implementation Notes

### 16.1 Initial Drizzle Configuration

```typescript
// lib/db/index.ts (Nextcloud Integration - PostgreSQL self-hosted)
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```


### 16.2 Better Auth Configuration

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [nextCookies()],
  // ... other configurations
});
```

### 16.3 Nextcloud WebDAV Storage Configuration

```typescript
// lib/storage/nextcloud.ts
import { createClient } from 'webdav';

// Create WebDAV client for Nextcloud
const nextcloudClient = createClient(
  `${process.env.NEXTCLOUD_URL}${process.env.NEXTCLOUD_WEBDAV_PATH}`,
  {
    username: process.env.NEXTCLOUD_USER!,
    password: process.env.NEXTCLOUD_PASSWORD!,
  }
);

// Upload file
export async function uploadFile(path: string, buffer: Buffer, mimeType: string) {
  await nextcloudClient.putFileContents(path, buffer, {
    contentLength: buffer.length,
    headers: { 'Content-Type': mimeType },
  });
}

// Download file
export async function downloadFile(path: string): Promise<Buffer> {
  const data = await nextcloudClient.getFileContents(path);
  return Buffer.from(data as ArrayBuffer);
}

// Delete file
export async function deleteFile(path: string) {
  await nextcloudClient.deleteFile(path);
}

// Check if file exists
export async function fileExists(path: string): Promise<boolean> {
  try {
    await nextcloudClient.stat(path);
    return true;
  } catch {
    return false;
  }
}

// Create directory
export async function createDirectory(path: string) {
  await nextcloudClient.createDirectory(path, { recursive: true });
}
```

**Alternative without library (native fetch):**

```typescript
// lib/storage/nextcloud-fetch.ts
const NEXTCLOUD_BASE = `${process.env.NEXTCLOUD_URL}${process.env.NEXTCLOUD_WEBDAV_PATH}`;
const AUTH_HEADER = `Basic ${Buffer.from(
  `${process.env.NEXTCLOUD_USER}:${process.env.NEXTCLOUD_PASSWORD}`
).toString('base64')}`;

export async function uploadFile(path: string, buffer: Buffer, mimeType: string) {
  const response = await fetch(`${NEXTCLOUD_BASE}/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': AUTH_HEADER,
      'Content-Type': mimeType,
    },
    body: buffer,
  });
  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
}

export async function downloadFile(path: string): Promise<Buffer> {
  const response = await fetch(`${NEXTCLOUD_BASE}/${path}`, {
    method: 'GET',
    headers: { 'Authorization': AUTH_HEADER },
  });
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
```

