# TECH_SPECS.md — Especificação Técnica

## 1. Metadados

- **Nome do projeto:** SecuraDocs
- **Versão do documento:** v0.1
- **Data:** 2025-01-10
- **Autor(es):** Equipe SecuraDocs
- **Status:** Aprovado

---

## 2. Visão Técnica Resumida

> 2–3 frases sobre como o sistema será implementado.

- Front-end & back-end unificados em **Next.js 16 (App Router)** com React 19 e TypeScript.
- UI com **Tailwind CSS 4** e componentes via **shadcn/ui** para acessibilidade e customização.
- Persistência em **PostgreSQL** via **NeonDB** (MVP: serverless; futuro: self-hosted) com **Drizzle ORM** para type-safety.
- Autenticação com **Better Auth** (FOSS, flexível) integrado com Drizzle adapter.
- Armazenamento de arquivos em **MinIO** (S3-compatível, self-hosted ready) para soberania de dados.

> **Obs.:** Esta stack foi escolhida para balancear produtividade, segurança, soberania e facilidade de migração para infraestrutura própria.

---

## 3. Arquitetura de Alto Nível

### 3.1 Diagrama (texto)

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente (Browser)                        │
│  Next.js App (React 19) + Tailwind CSS + shadcn/ui         │
└──────────────────────┬──────────────────────────────────────┘
                        │ HTTPS
                        │
┌──────────────────────▼──────────────────────────────────────┐
│              Servidor de Aplicação (Next.js)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Route Handlers (/api/*)                             │  │
│  │  Server Actions                                       │  │
│  │  Server Components                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Better Auth (Autenticação & Autorização)           │  │
│  └──────────────────────────────────────────────────────┘  │
└───────┬──────────────────────────────┬──────────────────────┘
        │                              │
        │                              │
┌───────▼──────────┐      ┌────────────▼──────────────┐
│   PostgreSQL     │      │      MinIO Storage         │
│   (NeonDB)       │      │   (S3-compatível)          │
│                  │      │                            │
│  - Users         │      │  - Arquivos binários       │
│  - Files         │      │  - Metadados de storage    │
│  - Folders       │      │                            │
│  - Permissions   │      │                            │
│  - Audit Logs    │      │                            │
│  - Share Links   │      │                            │
└──────────────────┘      └────────────────────────────┘
```

### 3.2 Fronteiras / Bounded Contexts

- **Contexto Autenticação & Usuários**
  - Gerenciamento de usuários, sessões, perfis.
  - Integração com Better Auth.

- **Contexto Arquivos & Pastas**
  - Upload, download, organização hierárquica.
  - Integração com MinIO para storage.

- **Contexto Permissões & Compartilhamento**
  - Controle de acesso granular.
  - Links de compartilhamento e tokens.

- **Contexto Auditoria**
  - Logs de eventos e ações.
  - Exportação e visualização de logs.

---

## 4. Stack Tecnológica

### 4.1 Framework & Linguagem

- **Framework web:** Next.js 16.0.5 (App Router)
- **Linguagem:** TypeScript 5.x
- **Tipo de renderização:** Server Components (padrão) + Client Components (quando necessário para interatividade)
- **React:** 19.2.0

### 4.2 Front-end

- **Estilização:** Tailwind CSS 4.x
- **Biblioteca de componentes:** shadcn/ui  
  - *Diretriz:* componentes devem ser adicionados via comandos `npx shadcn@latest add <component>` (não copiar/colar manualmente).
  - Componentes baseados em Radix UI para acessibilidade.
- **Estado global (se houver):** React Context API ou Zustand (avaliar necessidade conforme complexidade cresce).
- **Formulários:** React Hook Form + Zod para validação.

### 4.3 Back-end

- **Runtime:** Node.js (via Next.js)
- **Padrão de API:** Route Handlers (`app/api/*/route.ts`) e Server Actions (`use server`)
- **Validação de dados:** Zod
- **ORM:** Drizzle ORM
- **Query Builder:** Drizzle ORM (type-safe queries)

### 4.4 Banco de Dados

- **Motor:** PostgreSQL
- **Provedor MVP:** NeonDB (`@neondatabase/serverless`)
- **ORM/Query builder:** Drizzle ORM (`drizzle-orm`)
- **Migrations:** Drizzle Kit (`drizzle-kit`)
- **Driver:** `@neondatabase/serverless` (HTTP-based, serverless-friendly)
- **Possível migração futura:** instância self-hosted Postgres (ver MIGRATION_SELF_HOSTED.md)

### 4.5 Autenticação & Autorização

- **Biblioteca:** Better Auth (`better-auth`)
- **Adapter:** Drizzle adapter (`better-auth/adapters/drizzle`)
- **Método de sessão:** Cookies assinados (padrão Better Auth)
- **Gestão de roles/claims:**  
  - Definição de roles (ex: `admin`, `member`, `guest`).
  - Mapeamento de permissões para recursos (arquivos, pastas).
  - Middleware de autorização em Route Handlers e Server Actions.

### 4.6 Armazenamento de Arquivos

- **Storage:** MinIO (S3-compatível)
- **SDK:** `@aws-sdk/client-s3` ou `minio` (cliente MinIO nativo)
- **Configuração MVP:** MinIO local ou cloud (DigitalOcean Spaces, AWS S3, etc.)
- **Estrutura de buckets:** Um bucket principal (`securdocs-files`) com organização por prefixos (usuário/organização).

### 4.7 Infraestrutura & Deploy

- **Ambiente de deploy MVP:** Vercel (Next.js) + NeonDB + MinIO cloud ou self-hosted
- **Ambiente de deploy produção:** Docker Compose (self-hosted) ou VPS com serviços gerenciados
- **Configuração de build:**  
  - `pnpm install` (gerenciador de pacotes)
  - `pnpm run build` (Next.js build)
- **Variáveis de ambiente principais:**
  - `DATABASE_URL=` (NeonDB connection string)
  - `AUTH_SECRET=` (secret para assinatura de cookies/tokens)
  - `MINIO_ENDPOINT=` (endpoint do MinIO/S3)
  - `MINIO_ACCESS_KEY=`
  - `MINIO_SECRET_KEY=`
  - `MINIO_BUCKET_NAME=securdocs-files`
  - `NEXT_PUBLIC_APP_URL=` (URL base da aplicação)

---

## 5. Módulos & Camadas

### 5.1 Módulos de Domínio

- **Módulo Usuários**
  - Entidades: `User`, `Session`, `Account` (Better Auth)
  - Operações: registro, login, logout, perfil

- **Módulo Arquivos**
  - Entidades: `File`, `Folder`, `FileVersion` (futuro)
  - Operações: upload, download, listagem, busca

- **Módulo Permissões**
  - Entidades: `Permission`, `ShareLink`, `ResourceAccess`
  - Operações: criar/revogar permissões, validar acesso

- **Módulo Auditoria**
  - Entidades: `AuditLogEntry`, `LoginEvent`, `FileAccessEvent`
  - Operações: registrar eventos, consultar logs, exportar

### 5.2 Organização de Pastas (Next.js)

Sugestão de estrutura:

```txt
src/
  app/
    (marketing)/          # Rotas públicas (landing, sobre)
      page.tsx
    (auth)/               # Rotas de autenticação
      login/
        page.tsx
      register/
        page.tsx
    (app)/                # Rotas protegidas (requer auth)
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
    auth.ts               # Configuração Better Auth
    db/
      index.ts            # Instância Drizzle
      schema.ts            # Schemas Drizzle
      migrations/          # Migrations geradas
    storage/
      client.ts            # Cliente MinIO/S3
      upload.ts            # Lógica de upload
    permissions/
      check.ts             # Validação de permissões
    audit/
      logger.ts            # Logger de eventos
  components/
    ui/                    # Componentes shadcn/ui
    app/                   # Componentes específicos da app
      file-upload.tsx
      file-list.tsx
      folder-tree.tsx
      share-dialog.tsx
  types/
    index.ts               # Tipos TypeScript compartilhados
```

---

## 6. Fluxos Principais (Técnicos)

> Descreva request → lógica → DB → resposta.

### 6.1 Fluxo de Login

1. Cliente envia credenciais (email + senha) para `/api/auth/sign-in` (via Better Auth).
2. Better Auth valida credenciais contra banco (Drizzle query em `users`).
3. Better Auth cria sessão e armazena em `sessions` (via Drizzle adapter).
4. Cookie de sessão é definido no response (assinado com `AUTH_SECRET`).
5. Cliente redirecionado para dashboard (`/dashboard`).
6. Rotas protegidas verificam sessão via middleware/Server Component.

### 6.2 Fluxo de Upload de Arquivo

1. Cliente envia arquivo (FormData) via POST para `/api/files/upload`.
2. Server Action ou Route Handler valida:
   - Sessão do usuário (via Better Auth).
   - Permissões na pasta destino (se especificada).
   - Tipo e tamanho do arquivo (Zod validation).
3. Arquivo é enviado para MinIO (`putObject`) com chave única (`{userId}/{timestamp}-{filename}`).
4. Registro é criado em DB (`files` table) com metadados:
   - `id`, `owner_id`, `folder_id`, `name`, `mime_type`, `size_bytes`, `storage_path`, `created_at`
5. Opcional: cria entrada de auditoria em `audit_logs` (`FILE_UPLOAD`).
6. Retorna resposta com metadados do arquivo criado.

### 6.3 Fluxo de Compartilhamento com Permissões

1. Usuário solicita criação de link de compartilhamento (POST `/api/files/share`).
2. Back-end valida:
   - Usuário tem permissão de compartilhamento no recurso.
   - Recurso existe (arquivo ou pasta).
3. Gera token único criptograficamente seguro (`crypto.randomBytes` ou `nanoid`).
4. Registra em `share_links`:
   - `id`, `resource_type`, `resource_id`, `token`, `created_by`, `permission_level`, `expires_at` (opcional)
5. Retorna link público: `{APP_URL}/share/{token}`
6. Quando alguém acessa o link:
   - Back-end busca `share_links` por token.
   - Valida expiração e permissões.
   - Retorna arquivo ou lista de arquivos (se pasta) com permissões aplicadas.

### 6.4 Fluxo de Download com Validação de Permissões

1. Cliente solicita download (GET `/api/files/download/[fileId]`).
2. Back-end valida:
   - Sessão do usuário (se autenticado) ou token de compartilhamento (se link público).
   - Permissões no arquivo (proprietário, compartilhado com usuário, ou link válido).
3. Busca metadados do arquivo em `files`.
4. Gera URL pré-assinada do MinIO (ou faz proxy do arquivo).
5. Registra evento de auditoria (`FILE_DOWNLOAD`).
6. Retorna arquivo ou redireciona para URL pré-assinada.

---

## 7. Modelagem de Dados

> Esquema Drizzle ORM (PostgreSQL)

### 7.1 Tabelas Principais

**Tabela `users`** (gerenciada pelo Better Auth via Drizzle adapter)

```typescript
// Schema gerado pelo Better Auth
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

**Tabela `folders`**

```typescript
{
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  parentFolderId: uuid("parent_folder_id").references(() => folders.id), // nullable para root
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}
```

**Tabela `files`**

```typescript
{
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  folderId: uuid("folder_id").references(() => folders.id), // nullable para root
  name: text("name").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  storagePath: text("storage_path").notNull(), // chave no MinIO
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}
```

**Tabela `permissions`**

```typescript
{
  id: uuid("id").defaultRandom().primaryKey(),
  resourceType: text("resource_type").notNull(), // 'file' | 'folder'
  resourceId: uuid("resource_id").notNull(), // referencia files.id ou folders.id
  userId: text("user_id").references(() => users.id), // nullable se for link público
  permissionLevel: text("permission_level").notNull(), // 'read' | 'write' | 'admin'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}
```

**Tabela `share_links`**

```typescript
{
  id: uuid("id").defaultRandom().primaryKey(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id").notNull(),
  token: text("token").notNull().unique(),
  createdBy: text("created_by").notNull().references(() => users.id),
  permissionLevel: text("permission_level").notNull(),
  expiresAt: timestamp("expires_at"), // nullable = sem expiração
  createdAt: timestamp("created_at").defaultNow().notNull(),
}
```

**Tabela `audit_logs`**

```typescript
{
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id), // nullable para ações anônimas
  action: text("action").notNull(), // 'LOGIN', 'FILE_UPLOAD', 'FILE_DOWNLOAD', 'PERMISSION_CHANGED', etc.
  resourceType: text("resource_type"), // nullable
  resourceId: uuid("resource_id"), // nullable
  ipAddress: text("ip_address"), // opcional, respeitando LGPD
  metadata: jsonb("metadata"), // dados adicionais em JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
}
```

### 7.2 Índices Recomendados

```typescript
// Em files
index("files_owner_idx").on(files.ownerId),
index("files_folder_idx").on(files.folderId),

// Em folders
index("folders_owner_idx").on(folders.ownerId),
index("folders_parent_idx").on(folders.parentFolderId),

// Em permissions
index("permissions_resource_idx").on(permissions.resourceType, permissions.resourceId),
index("permissions_user_idx").on(permissions.userId),

// Em share_links
index("share_links_token_idx").on(shareLinks.token),
index("share_links_resource_idx").on(shareLinks.resourceType, shareLinks.resourceId),

// Em audit_logs
index("audit_logs_user_idx").on(auditLogs.userId),
index("audit_logs_created_idx").on(auditLogs.createdAt),
index("audit_logs_action_idx").on(auditLogs.action),
```

---

## 8. Segurança

### 8.1 Princípios

* **Mínimo privilégio:** Usuários só acessam recursos com permissão explícita.
* **Defense-in-depth:** Múltiplas camadas de validação (cliente, servidor, banco).
* **Redução de superfície de ataque:** Validação rigorosa de entrada, sanitização.

### 8.2 Medidas Técnicas

* **Transporte:** HTTPS obrigatório em produção (TLS 1.2+).
* **Armazenamento:**
  * Criptografia em repouso no MinIO (se configurado).
  * Senhas nunca em texto plano (hash com argon2 ou bcrypt via Better Auth).
* **Senha & Auth:**
  * Better Auth usa hash seguro por padrão.
  * Rate limiting em endpoints de login (implementar via middleware).
* **Proteção contra ataques comuns:**
  * **CSRF:** Proteção via SameSite cookies (Better Auth).
  * **XSS:** Sanitização de entrada, Content Security Policy (CSP).
  * **SQL Injection:** Drizzle ORM previne (queries parametrizadas).
  * **Path Traversal:** Validação de `storage_path` antes de acessar MinIO.
  * **Brute Force:** Rate limiting em login (futuro: CAPTCHA após N tentativas).
* **Gestão de segredos:**
  * Variáveis de ambiente (`.env.local` não commitado).
  * Secrets manager em produção (ex: Vercel Secrets, AWS Secrets Manager).

### 8.3 Validação de Permissões

* Todas as operações críticas validam permissões server-side.
* Middleware de autorização em Route Handlers.
* Helper functions em `lib/permissions/check.ts` para reutilização.

---

## 9. Auditoria & Logs

* **Definição do que é logado:**
  * Logins (sucesso e falha).
  * Upload/Download de arquivos.
  * Criação/remoção de compartilhamentos.
  * Mudança de permissões.
  * Ações administrativas.

* **Formato dos logs:** JSONB no banco (`audit_logs.metadata`), exportação em CSV/JSON.

* **Retenção de logs:** Configurável (padrão: 90 dias). Logs antigos podem ser arquivados ou deletados conforme política da organização.

* **Privacidade:** IP addresses são opcionais e podem ser omitidos para conformidade com LGPD/GDPR.

---

## 10. Integrações Externas

* **Email (futuro):**
  * Provedor: Resend, SendGrid, ou SMTP próprio.
  * Biblioteca: `resend` ou `nodemailer`.
  * Templates: React Email ou HTML simples.

* **Storage externo (MinIO/S3):**
  * SDK: `@aws-sdk/client-s3` ou `minio`.
  * Bucket: `securdocs-files` (configurável).
  * Política de acesso: Bucket privado, acesso via pré-assinado ou proxy.

---

## 11. Deploy, Infra & Observabilidade

### 11.1 Ambientes

* **Local:** 
  - Next.js dev server (`pnpm dev`).
  - NeonDB dev (connection string local).
  - MinIO local (Docker) ou MinIO cloud.

* **Staging (opcional):**
  - Vercel preview deployments.
  - NeonDB branch de staging.

* **Produção/Hackathon:**
  - Vercel (Next.js) + NeonDB + MinIO cloud.
  - Ou Docker Compose em VPS (ver MIGRATION_SELF_HOSTED.md).

### 11.2 Pipeline CI/CD

* **Lint:** `pnpm lint` (ESLint).
* **Type check:** `tsc --noEmit`.
* **Build:** `pnpm build` (Next.js).
* **Deploy:** Automático via Vercel (push para `main`) ou manual via Docker.

### 11.3 Monitoramento & Logs

* **Logging:** Console logs em desenvolvimento, structured logging em produção (opcional: Pino, Winston).
* **Erros:** Sentry ou similar (opcional no MVP).
* **Métricas básicas:** Vercel Analytics (opcional).

---

## 12. Plano de Testes

* **Tipos de teste:**
  * **Unitários:** Funções de domínio (validação de permissões, formatação de dados).
  * **Integração:** API + DB (testes de Route Handlers com DB de teste).
  * **End-to-end:** Fluxos principais (Playwright ou Cypress) - futuro.

* **Prioridades para MVP:**
  * Testar autenticação (login, registro, logout).
  * Testar upload e acesso a arquivos (com validação de permissões).
  * Testar criação e validação de links de compartilhamento.

---

## 13. Roadmap Técnico (Alta Nível)

> 5 marcos técnicos principais.

1. **Setup de projeto** (Fase 0)
   - Next.js + Tailwind + shadcn + Drizzle + NeonDB + Better Auth.
   - Estrutura de pastas e configurações básicas.

2. **Implementar módulos básicos de usuário e arquivos** (Fase 1)
   - Autenticação funcional.
   - Upload/download básico.

3. **Implementar sistema de pastas e organização** (Fase 2)
   - Hierarquia de pastas.
   - Navegação e organização.

4. **Implementar permissões e compartilhamento** (Fase 3)
   - Controle de acesso granular.
   - Links de compartilhamento.

5. **Implementar logs de auditoria e refinar** (Fase 4)
   - Sistema de logs.
   - UI/UX refinada.
   - Endurecimento de segurança.

---

## 14. Questões em Aberto

> Liste perguntas técnicas que ainda precisam de decisão.

* **Storage:** Usar MinIO local no MVP ou cloud desde o início? (Decisão: Cloud para MVP, local para produção self-hosted)
* **Multi-tenant:** Precisamos de multi-tenant (várias organizações no mesmo deploy) no MVP? (Decisão: Não no MVP, futuro)
* **Backup:** Como será o backup automatizado (db + arquivos)? (Ver MIGRATION_SELF_HOSTED.md para estratégia)
* **Preview de arquivos:** Implementar preview de imagens/PDFs no MVP? (Decisão: Não no MVP, futuro)
* **Rate limiting:** Implementar rate limiting customizado ou usar Vercel Edge Config? (Decisão: Avaliar necessidade)

---

## 15. Anexos

* Links para diagramas (ex: Excalidraw, Figma) - criar conforme necessário.
* Links para issues ou board (GitHub, Linear, etc.) - criar conforme necessário.
* Documentação de referência:
  - [Better Auth Docs](https://www.better-auth.com/docs)
  - [Drizzle ORM Docs](https://orm.drizzle.team/)
  - [NeonDB Docs](https://neon.tech/docs)
  - [MinIO Docs](https://min.io/docs/)

---

## 16. Notas de Implementação

### 16.1 Configuração Inicial do Drizzle

```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### 16.2 Configuração do Better Auth

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
  // ... outras configurações
});
```

### 16.3 Configuração do MinIO

```typescript
// lib/storage/client.ts
import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: "us-east-1", // MinIO não usa região, mas SDK requer
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // necessário para MinIO
});
```

