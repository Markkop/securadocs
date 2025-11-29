# PLAN.md — Incremental Development Plan

## 1. Metadata

- **Project name:** SecuraDocs
- **Document version:** v1.1
- **Date:** 2025-01-28
- **Last update:** 2025-11-28 (Pivot to Nextcloud - Phase 5)
- **Author(s):** SecuraDocs Team
- **Status:** Self-Hosted Complete (PostgreSQL + Nextcloud)

---

## 2. Incremental Approach

This plan follows an **incremental development** approach, where each phase adds validated features before advancing to the next. The goal is to have a functional **micro MVP** quickly and evolve to a **complete MVP**.

### 2.1 Principles

- **Continuous validation:** Each phase must be tested and validated before advancing.
- **Incremental deployment:** Each phase can be deployed and tested in production.
- **Fast feedback:** Prioritize features that generate immediate value.
- **Simplicity first:** Start simple and add complexity as needed.

---

## 3. Development Phases

### Phase 0: Setup and Base Infrastructure (Micro MVP Base) ✅ COMPLETE

**Objective:** Configure all technical infrastructure necessary for development.

**Status:** Complete (2025-01-27)

#### Tarefas

- [x] **0.1** Configurar Drizzle ORM ✅
  - Instaladas dependências: `drizzle-orm`, `drizzle-kit`, `postgres`
  - Criado `lib/db/index.ts` com conexão PostgreSQL (lazy loading + graceful error handling)
  - Criado `lib/db/schema.ts` com schemas: users, sessions, accounts, verifications (Better Auth) + files, folders, permissions, share_links, audit_logs (App)
  - Configurado `drizzle.config.ts`
  - Migrations aplicadas com `pnpm db:push`

- [x] **0.2** Configurar Better Auth ✅
  - Instalado `better-auth`
  - Criado `lib/auth.ts` com configuração Better Auth + Drizzle adapter (`usePlural: true`)
  - Criada rota `/api/auth/[...all]/route.ts` como proxy com tratamento de erros
  - Configuradas variáveis de ambiente (`AUTH_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`)

- [x] **0.3** Setup shadcn/ui ✅
  - Instalado shadcn/ui
  - Adicionados componentes: `button`, `input`, `card`, `dialog`, `dropdown-menu`
  - Tema e cores configurados

- [x] **0.4** Configurar Storage ✅
  - Criado `lib/storage/nextcloud.ts` com cliente WebDAV
  - Criado `lib/storage/client.ts` como abstração
  - Configuradas variáveis de ambiente (`NEXTCLOUD_URL`, `NEXTCLOUD_USER`, `NEXTCLOUD_PASSWORD`)

- [x] **0.5** Estrutura de Pastas Next.js ✅
  - Estrutura de pastas criada conforme TECH_SPECS.md
  - Configuradas rotas: `(auth)/login`, `(auth)/register`, `(app)/dashboard`, `(app)/files`
  - Layout base com navegação criado
  - Criado `lib/env.ts` para verificação de variáveis de ambiente
  - Criada página `/setup` para guiar configuração quando variáveis faltam

**Acceptance Criteria:**
- [x] Drizzle connects to PostgreSQL and migrations applied
- [x] Better Auth works (login and registration tested via curl and browser)
- [x] shadcn/ui components render correctly
- [x] Storage client configured
- [x] Folder structure created and organized

**Validation:**
- ✅ Database connection tested
- ✅ Authentication tested (create user, login, logout)
- ✅ UI components render correctly

---

### Phase 1: Micro MVP — Authentication + Basic Upload ✅ COMPLETE

**Objective:** Have a functional system where users can authenticate and upload/download files.

**Status:** Complete (2025-11-28)

#### Tarefas

- [x] **1.1** Páginas de Autenticação ✅
  - Criada página `/login` com formulário (email + senha)
  - Criada página `/register` com formulário (nome, email, senha)
  - Integrado com Better Auth (endpoints `/api/auth/sign-in/email` e `/api/auth/sign-up/email`)
  - Adicionado tratamento de erros robusto (parsing de JSON, mensagens claras em português)
  - Adicionada validação no cliente (email regex, trim, lowercase, comprimento de senha)
  - Redirecionamento para dashboard após login bem-sucedido

- [x] **1.2** Dashboard Básico ✅
  - Criada página `/dashboard` protegida (verificação de sessão no Server Component)
  - Exibe nome do usuário logado
  - Botão de logout funcional (componente `SignOutButton` com fetch JSON)
  - Layout básico com header/navbar (`app/(app)/layout.tsx`)
  - Cards para navegação: Meus Arquivos, Upload, Configurações

- [x] **1.3** Upload de Arquivo Único ✅
  - Criado componente `FileUpload` (`components/files/file-upload.tsx`) com drag & drop e input file
  - Criada rota `/api/files/upload` (Route Handler) com validação de sessão
  - Validação de arquivo: tipos permitidos (PDF, imagens, documentos Office, texto) e tamanho máximo (50MB)
  - Upload para Nextcloud via WebDAV com chave única (`{userId}/{timestamp}-{filename}`)
  - Criação de registro em `files` table via Drizzle
  - Feedback visual de progresso e sucesso/erro
  - Criado helper `lib/audit/logger.ts` para registrar eventos de auditoria

- [x] **1.4** Listagem de Arquivos do Usuário ✅
  - Atualizada página `/files` com integração de upload e listagem
  - Criada rota `/api/files` (GET) para buscar arquivos do usuário logado via Drizzle
  - Criado componente `FileList` (`components/files/file-list.tsx`) com estados de loading/empty/error
  - Criado componente `FileItem` (`components/files/file-item.tsx`) com ícone por tipo, nome, tamanho formatado, data

- [x] **1.5** Download de Arquivo ✅
  - Criada rota `/api/files/download/[fileId]` (Route Handler)
  - Validação de propriedade (usuário é dono do arquivo)
  - Busca arquivo do Nextcloud via WebDAV e retorna como stream com headers corretos
  - Registra evento de auditoria (`FILE_DOWNLOAD`)

**Acceptance Criteria:**
- [x] User can register and login
- [x] User can upload file and see it in the list
- [x] User can download own file
- [x] Files appear only to the owner
- [x] Basic upload/download logs work

**Validation:**
- ✅ Registration tested (via curl and browser)
- ✅ Login tested (via curl and browser)
- ✅ Logout tested (via browser)
- ✅ Upload tested (via browser) - file sent to Nextcloud and record created in DB
- ✅ Listing tested (via browser) - files displayed with name, size, date
- ✅ Download tested (via browser) - file downloaded correctly

---

### Phase 2: MVP Core — Organization and Folders ✅ COMPLETE

**Objective:** Add folder system for hierarchical file organization.

**Status:** Complete (2025-11-28)

#### Tarefas

- [x] **2.1** Criação de Pastas ✅
  - Criado componente `CreateFolderDialog` (`components/files/create-folder-dialog.tsx`)
  - Criada rota `/api/folders` (GET para listar, POST para criar)
  - Validação de nome, duplicatas e permissões de pasta pai
  - Registro em `folders` table via Drizzle com `parentFolderId` opcional
  - Registro de evento de auditoria (`FOLDER_CREATE`)

- [x] **2.2** Navegação Hierárquica ✅
  - Criado componente `Breadcrumbs` (`components/files/breadcrumbs.tsx`)
  - Convertida rota `/files` para catch-all `/files/[[...folderId]]/page.tsx`
  - Criada rota `/api/folders/[folderId]` (GET) para detalhes e caminho da pasta
  - API `/api/files` atualizada para filtrar por `folderId` e retornar pastas + arquivos
  - Criado componente `FolderItem` (`components/files/folder-item.tsx`)

- [x] **2.3** Upload em Pasta Específica ✅
  - Componente `FileUpload` modificado para aceitar prop `folderId`
  - Rota `/api/files/upload` atualizada para receber `folderId` no FormData
  - Validação de propriedade da pasta destino

- [x] **2.4** Mover Arquivos/Pastas ✅
  - Criado componente `MoveDialog` (`components/files/move-dialog.tsx`) com navegação de pastas
  - Criada rota `/api/files/[fileId]/move` (PATCH)
  - Criada rota `/api/folders/[folderId]/move` (PATCH) com validação anti-loop
  - Ações "Mover" adicionadas nos menus de contexto

- [x] **2.5** Renomear Arquivos/Pastas ✅
  - Criado componente `RenameDialog` (`components/files/rename-dialog.tsx`)
  - Criada rota `/api/files/[fileId]/rename` (PATCH)
  - Criada rota `/api/folders/[folderId]/rename` (PATCH) com validação de duplicatas
  - Ações "Renomear" adicionadas nos menus de contexto

- [x] **2.6** Busca de Arquivos ✅
  - Criado componente `SearchBox` (`components/files/search-box.tsx`) com dropdown de resultados
  - Criada rota `/api/search` (GET) com busca ILIKE por nome
  - Resultados incluem contexto (caminho da pasta)
  - Debounce de 300ms para evitar requisições excessivas

- [x] **2.7** Deletar Arquivos/Pastas ✅ (Bônus)
  - Criada rota `/api/files/[fileId]` (DELETE) com remoção do Storage
  - Criada rota `/api/folders/[folderId]` (DELETE) com exclusão recursiva
  - Confirmação antes de ações destrutivas
  - Registro de eventos de auditoria (`FILE_DELETE`, `FOLDER_DELETE`)

**Acceptance Criteria:**
- [x] User can create folders and navigate between them
- [x] User can upload to specific folder
- [x] User can move files/folders between folders
- [x] User can rename resources
- [x] Search finds files by name
- [x] User can delete files and folders

**Validation:**
- ✅ Hierarchical structure creation tested (nested folders)
- ✅ Navigation via breadcrumbs works correctly
- ✅ Upload to specific folders works
- ✅ Move files/folders validated (including anti-loop protection)
- ✅ Rename works with duplicate validation
- ✅ Search returns results with folder context
- ✅ Delete removes files from Storage and database records

---

### Phase 3: MVP Sharing — Links and Permissions ✅ COMPLETE

**Objective:** Implement sharing system with permission control.

**Status:** Complete (2025-11-28)

#### Tarefas

- [x] **3.1** Compartilhamento por Link ✅
  - Criado componente `ShareDialog` (`components/files/share-dialog.tsx`) com abas Links/Pessoas
  - Criada rota `/api/share` (GET para listar, POST para criar)
  - Token único gerado com nanoid (32 caracteres)
  - Link público no formato `{APP_URL}/share/{token}`
  - Adicionado botão "Compartilhar" nos menus de `file-item.tsx` e `folder-item.tsx`

- [x] **3.2** Página de Compartilhamento Público ✅
  - Criada rota `/share/[token]/page.tsx` (Server Component + Client Component)
  - Validação de token e expiração
  - Exibe informações do recurso (nome, tipo, tamanho, dono)
  - Download funciona sem autenticação
  - Para pastas: lista arquivos com download individual
  - Página de erro customizada para links não encontrados/expirados

- [x] **3.3** Compartilhamento com Usuários Específicos ✅
  - Campo de busca de usuários no `ShareDialog` com autocomplete
  - Criada rota `/api/users/search` (GET) com busca por nome/email
  - Criada rota `/api/permissions` (GET para listar, POST para criar)
  - Registro em `permissions` table com níveis read/write/admin

- [x] **3.4** Gerenciamento de Permissões ✅
  - Gerenciamento integrado no `ShareDialog` (aba Pessoas)
  - Lista usuários e links com acesso ao recurso
  - Criada rota `/api/permissions/[permissionId]` (PATCH para editar, DELETE para revogar)
  - Criada rota `/api/share/[token]` (DELETE para revogar, PATCH para atualizar)

- [x] **3.5** Validação de Permissões em Todas as Operações ✅
  - Criado helper `lib/permissions/check.ts` com funções:
    - `canAccessResource()` - verificação completa (owner + permission + herança)
    - `getEffectivePermission()` - retorna nível de permissão efetivo
    - `validateShareLink()` - valida token de compartilhamento
  - Integrado em todas as rotas:
    - `/api/files/download/[fileId]` - owner OU read permission
    - `/api/files/upload` - owner OU write permission na pasta
    - `/api/files/[fileId]/move`, `/rename` - owner OU write permission
    - `/api/folders/[folderId]/move`, `/rename` - owner OU write permission

- [x] **3.6** Expiração de Links ✅
  - Campo datetime-local no `ShareDialog` para definir expiração
  - Validação de expiração em `/api/share/[token]` (GET e POST)
  - Indicação visual de links expirados na lista
  - Botão para renovar link expirado (+7 dias) via PATCH

**Acceptance Criteria:**
- [x] User can create sharing link
  - [x] Link works without authentication
  - [x] Link expires as configured
- [x] User can share with specific users
- [x] Permissions are respected (read-only cannot modify)
- [x] Owner can revoke access

**Validation:**
- ✅ Link sharing tested
- ✅ Sharing with specific user tested
- ✅ Permission validation implemented
- ✅ Link expiration works correctly

---

### Phase 4: Complete MVP — Auditing and Refinements ✅ COMPLETE

**Objective:** Add complete auditing system and final UI/UX and security refinements.

**Status:** Complete (2025-11-28)

**Note:** Delete files/folders already implemented in Phase 2.

#### Tarefas

- [x] **4.1** Sistema de Logs de Auditoria (Expandir) ✅
  - Helper `lib/audit/logger.ts` já existe (criado na Fase 1)
  - Eventos já implementados:
    - `FILE_UPLOAD`, `FILE_DOWNLOAD`, `FILE_DELETE` ✅
    - `FOLDER_CREATE`, `FOLDER_DELETE` ✅
    - `PERMISSION_CREATE`, `PERMISSION_REVOKE` ✅ (Fase 3)
    - `SHARE_LINK_CREATE`, `SHARE_LINK_REVOKE` ✅ (Fase 3)
  - Adicionados eventos faltantes:
    - `LOGIN`, `LOGOUT` via Better Auth hooks (`lib/auth.ts`)
  - IP address capturado via headers `x-forwarded-for` e `x-real-ip`

- [x] **4.2** Visualização de Logs ✅
  - Criada página `/audit` (`app/(app)/audit/page.tsx`)
  - Criada rota `/api/audit` (GET) com filtros e paginação
  - Filtros implementados: por tipo de ação, período (data início/fim)
  - Paginação com 20 itens por página
  - Componentes: `audit-filters.tsx`, `audit-table.tsx`
  - Link "Auditoria" adicionado na navegação

- [x] **4.3** Exportação de Logs ✅
  - Botões "Exportar CSV" e "Exportar JSON" na página de logs
  - Criada rota `/api/audit/export` (GET)
  - Suporte a CSV (com BOM UTF-8 para Excel) e JSON
  - Respeita os mesmos filtros da visualização

- [x] **4.4** Dashboard de Atividades ✅
  - Criada rota `/api/stats` (GET) para estatísticas
  - Componente `DashboardStats` com cards: arquivos, pastas, espaço usado, total de itens
  - Componente `RecentActivity` com últimos 10 eventos
  - Dashboard redesenhado com layout de 2 colunas

- [x] **4.5** Refinamentos de UI/UX ✅
  - Instalado `sonner` para notificações toast
  - Adicionado `<Toaster />` no root layout
  - Toast feedback em: upload, delete, rename, move, criar pasta
  - Loading states com skeleton animations
  - Ícones e cores por tipo de ação nos logs

- [x] **4.6** Endurecimento de Segurança ✅
  - Rate limiting implementado via middleware (`middleware.ts`)
    - Login: 5 tentativas/minuto
    - Registro: 3 tentativas/minuto
    - Upload: 10 uploads/minuto
  - Helper `lib/rate-limit.ts` com rate limiter in-memory
  - Headers de segurança em `next.config.ts`:
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `X-XSS-Protection: 1; mode=block`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Permissions-Policy` (câmera, microfone, geolocalização desabilitados)

- [x] **4.7** Tratamento de Erros ✅
  - Criada página `app/not-found.tsx` (404)
  - Criada página `app/error.tsx` (erro de runtime)
  - Criada página `app/global-error.tsx` (erro crítico/root)
  - Design consistente com botões de ação (voltar, recarregar)

**Acceptance Criteria:**
- [x] All critical events are logged
- [x] User can view and filter logs
- [x] Logs can be exported
- [x] Dashboard shows recent activities
- [x] UI is polished and responsive
- [x] Basic security implemented

**Validation:**
- ✅ LOGIN/LOGOUT are logged with IP and user agent
- ✅ Filters by action and period work
- ✅ CSV/JSON export works
- ✅ Dashboard displays stats and recent activities
- ✅ Toasts appear in all main actions
- ✅ Rate limiting blocks excessive requests
- ✅ Custom error pages work

---

### Phase 5: Nextcloud Integration — Unified Self-Hosted ✅ COMPLETE

**Objective:** Migrate SecuraDocs infrastructure to a self-hosted architecture based on Nextcloud, ensuring complete data sovereignty and unified infrastructure.

**Status:** Complete (2025-11-28)

**Implemented Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│  Cliente (Browser)                                          │
│       ↓                                                     │
│  Nginx (Reverse Proxy + SSL)                                │
│       ├── SecuraDocs (Next.js) → PostgreSQL (shared)        │
│       └── Nextcloud → PostgreSQL + Storage                  │
│                                                             │
│  SecuraDocs uses Nextcloud for:                              │
│  - File storage (WebDAV API)                                │
│  - User management (optional)                               │
│  - Sharing (integration with Nextcloud system)               │
└─────────────────────────────────────────────────────────────┘
```

#### Tasks

- [x] **5.1** Setup Nextcloud com Docker Compose ✅
  - Criado `docker-compose.yml` com PostgreSQL 16, Nextcloud, e SecuraDocs
  - Configurados volumes persistentes para dados
  - Configurada rede interna entre containers

- [x] **5.2** Configurar PostgreSQL Compartilhado ✅
  - Criado `init-db.sql` com databases `nextcloud` e `securdocs`
  - Configurados usuários e permissões de acesso
  - Atualizado `DATABASE_URL` para PostgreSQL local via Docker

- [x] **5.3** Criar Usuário Técnico no Nextcloud ✅
  - Documentado processo de criação do usuário `securadocs`
  - Configurada pasta `/SecuraDocs` como diretório de armazenamento

- [x] **5.4** Migrar Storage Layer para Nextcloud WebDAV ✅
  - Criado `lib/storage/nextcloud.ts` com funções WebDAV (uploadFile, downloadFile, deleteFile, checkConnection)
  - Atualizado `lib/storage/client.ts` para usar Nextcloud
  - Adaptadas rotas de upload/download para novo storage

- [x] **5.5** Atualizar Variáveis de Ambiente ✅
  - Removidas variáveis Supabase do código
  - Adicionadas variáveis Nextcloud (NEXTCLOUD_URL, NEXTCLOUD_USER, NEXTCLOUD_PASSWORD, NEXTCLOUD_WEBDAV_PATH)
  - Atualizado `lib/env.ts` para verificar variáveis Nextcloud

- [x] **5.6** Integração de Autenticação ✅
  - Decisão: Manter Better Auth independente (Opção A)
  - Sistema de autenticação funciona independentemente do Nextcloud

- [x] **5.7** Adaptar Sistema de Compartilhamento ✅
  - Decisão: Manter sistema próprio de compartilhamento
  - Tabelas `share_links` e `permissions` continuam em uso

- [x] **5.8** Configurar Nginx e SSL ✅
  - Documentada configuração de Nginx em MIGRATION_SELF_HOSTED.md
  - Configuração pronta para produção com SSL

- [x] **5.9** Script de Migração de Dados ✅
  - Script documentado em MIGRATION_SELF_HOSTED.md (seção 5.4)

- [x] **5.10** Documentação e Testes ✅
  - README.md atualizado com instruções self-hosted
  - MIGRATION_SELF_HOSTED.md com guia completo
  - Dockerfile criado para deploy

**Acceptance Criteria:**
- [x] Nextcloud working via Docker Compose
- [x] SecuraDocs using shared PostgreSQL
- [x] Upload/download working via Nextcloud WebDAV
- [x] Authentication working (Better Auth)
- [x] SSL/HTTPS configuration documented
- [x] Documentation updated

**Docker Compose de Referência:**

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
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    ports:
      - "127.0.0.1:5432:5432"
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
      NEXTCLOUD_TRUSTED_DOMAINS: cloud.${DOMAIN}
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

**Script de Inicialização do Banco (`init-db.sql`):**

```sql
-- Criar databases separados
CREATE DATABASE nextcloud;
CREATE DATABASE securdocs;

-- Criar usuários
CREATE USER nextcloud WITH ENCRYPTED PASSWORD 'nextcloud_password';
CREATE USER securdocs WITH ENCRYPTED PASSWORD 'securdocs_password';

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE nextcloud TO nextcloud;
GRANT ALL PRIVILEGES ON DATABASE securdocs TO securdocs;
```

**Variáveis de Ambiente (`.env`):**

```env
# Domain
DOMAIN=seudominio.com

# PostgreSQL
POSTGRES_PASSWORD=senha_master_segura

# Nextcloud
NEXTCLOUD_DB_PASSWORD=senha_nextcloud_db
NEXTCLOUD_ADMIN_PASSWORD=senha_admin_nextcloud
NEXTCLOUD_APP_PASSWORD=senha_app_securadocs

# SecuraDocs
SECURDOCS_DB_PASSWORD=senha_securdocs_db
AUTH_SECRET=gerar_com_openssl_rand_base64_32
```

---

## 4. Visual Roadmap

```
Phase 0: Setup ✅
├── Drizzle ORM
├── Better Auth
├── shadcn/ui
└── PostgreSQL
    ↓
Phase 1: Micro MVP ✅
├── Authentication (login/register)
├── File upload
├── File listing
└── File download
    ↓
Phase 2: MVP Core ✅
├── Folder system
├── Hierarchical navigation
├── Move/rename
└── Search
    ↓
Phase 3: MVP Sharing ✅
├── Link sharing
├── User sharing
├── Permission management
└── Permission validation
    ↓
Phase 4: Complete MVP ✅
├── Auditing system (expand)
├── Log visualization
├── Activity dashboard
└── UI/UX + Security refinements
    ↓
Phase 5: Self-Hosted ✅
├── PostgreSQL (Docker Compose)
├── Nextcloud WebDAV for storage
├── Dockerfile for deployment
└── Production documentation

🎉 COMPLETE SELF-HOSTED MVP! 🎉
```

---

## 5. Prioritization and Decisions

### 5.1 What Goes into MVP

- Basic authentication (email/password)
- File upload/download
- Folder system
- Sharing (links and users)
- Basic permissions (read/write)
- Basic audit logs

### 5.2 What Stays Out of MVP (Future)

- End-to-end encryption (E2EE)
- File preview (images, PDFs)
- File versions (history)
- Comments and annotations
- Collaborative editing
- Desktop/mobile synchronization
- Multi-tenant
- Public API
- Push/email notifications

### 5.3 Technical Decisions by Phase

**Phase 0-1:** Focus on basic functionality, simple UI.
**Phase 2:** Add organization, maintain simplicity.
**Phase 3:** Implement security and permissions correctly.
**Phase 4:** Polish and harden, prepare for production.

---

## 6. Progress Metrics

### 6.1 By Phase

- **Phase 0:** Infrastructure configured and tested
- **Phase 1:** User can upload/download
- **Phase 2:** User can organize files in folders
- **Phase 3:** User can share with access control
- **Phase 4:** Complete system with auditing and security

### 6.2 Continuous Validation

After each phase:
- [x] Manual testing of main flows (Phases 0-4)
- [x] Validation of phase functional requirements (Phases 0-4)
- [ ] Deploy to staging environment (if available)
- [ ] Beta user feedback (if available)

---

## 7. Risks and Mitigations

### 7.1 Technical Risks

**Risk:** Permission complexity may delay Phase 3
- **Mitigation:** Start with simple permissions (read/write), add granularity later
- **Result:** ✅ Phase 3 completed with complete permission system (read/write/admin + inheritance)

**Risk:** Performance with many files
- **Mitigation:** Implement pagination from the start, optimize queries
- **Status:** Pending - consider pagination in Phase 4

**Risk:** Data migration between phases
- **Mitigation:** Keep Drizzle migrations updated, test in dev environment
- **Result:** ✅ Schema stable since Phase 0

### 7.2 Scope Risks

**Risk:** Feature creep (adding unplanned features)
- **Mitigation:** Maintain focus on MVP, document ideas for future

**Risk:** UI perfectionism
- **Mitigation:** Prioritize functionality over visual perfection in early phases

---

## 8. Next Steps

### 8.1 Nextcloud Integration ✅ COMPLETE

Migration to self-hosted architecture based on Nextcloud has been completed:

1. **Nextcloud + PostgreSQL Setup** ✅
   - Docker Compose configured with Nextcloud and shared PostgreSQL
   - Documentation to create technical user `securadocs`
   - WebDAV connectivity working

2. **Storage Layer Migrated** ✅
   - Nextcloud WebDAV implemented in `lib/storage/nextcloud.ts`
   - `lib/storage/client.ts` uses Nextcloud
   - Upload/download routes adapted

3. **Unified Deployment** ✅
   - Dockerfile created
   - Nginx configuration documented
   - Production guide in MIGRATION_SELF_HOSTED.md

### 8.2 Future

1. **Feedback Collection**
   - Deploy to pilot organizations
   - Collect qualitative feedback
   - Identify pain points

2. **Improvements Based on Feedback**
   - Prioritize UX improvements
   - Fix critical bugs
   - Optimize performance

3. **Future Features**
   - File preview (can use Nextcloud native preview)
   - File versions (integrate with Nextcloud versioning)
   - Desktop synchronization via Nextcloud client
   - Multi-tenant

4. **Production Preparation**
   - Deployment documentation
   - Maintenance guides
   - Monitoring and alerts
   - Automated backup (PostgreSQL + Nextcloud data)

---

## 9. References

- [PRD.md](../en/PRD.md) - Product requirements
- [TECH_SPECS.md](../en/TECH_SPECS.md) - Technical specifications
- [MIGRATION_SELF_HOSTED.md](../en/MIGRATION_SELF_HOSTED.md) - Migration guide

---

## 10. Implementation Notes

### 10.1 Recommended Implementation Order

Follow the phase order, but within each phase, prioritize:
1. Backend (routes, business logic)
2. Database/storage integration
3. Frontend (components, pages)
4. Validation and testing

### 10.2 Commits and Versioning

- Small and frequent commits
- Descriptive messages: `feat: add file upload` or `fix: correct permission validation`
- Use conventional commits if possible

### 10.3 Testing

- Manual testing after each feature
- Integration tests for critical flows
- Consider automated tests in the future (E2E with Playwright)

---

## 11. Implementation Log

### Session 2025-01-27/28

**Phase 0 Complete + Phase 1 Authentication**

#### Files Created/Modified

**Infrastructure:**
- `lib/db/index.ts` - Drizzle connection with PostgreSQL (lazy loading)
- `lib/db/schema.ts` - Complete schemas (users, sessions, accounts, verifications, files, folders, permissions, shareLinks, auditLogs)
- `lib/auth.ts` - Better Auth configuration with Drizzle adapter (`usePlural: true`)
- `lib/storage/client.ts` - Storage abstraction (uses Nextcloud)
- `lib/storage/nextcloud.ts` - WebDAV client for Nextcloud
- `lib/env.ts` - Helper to verify environment variables
- `drizzle.config.ts` - Drizzle Kit configuration

**API Routes:**
- `app/api/auth/[...all]/route.ts` - Better Auth proxy with error handling

**Pages:**
- `app/page.tsx` - Home page with conditional redirect
- `app/setup/page.tsx` - Setup page for unconfigured variables
- `app/setup/refresh-button.tsx` - Client component for refresh
- `app/(auth)/login/page.tsx` - Login form with validation
- `app/(auth)/register/page.tsx` - Registration form with validation
- `app/(app)/layout.tsx` - Protected layout with navbar
- `app/(app)/dashboard/page.tsx` - Dashboard with cards
- `app/(app)/files/page.tsx` - Placeholder for files

**Components:**
- `components/auth/sign-out-button.tsx` - Logout button with JSON fetch
- `components/ui/*` - shadcn/ui components (button, input, card, dialog, dropdown-menu)

#### Problems Solved

1. **Error "DATABASE_URL not set" crashed app**
   - Solution: Lazy loading in `lib/db/index.ts`, redirect to `/setup`

2. **Better Auth "users model not found"**
   - Solution: Added tables `sessions`, `accounts`, `verifications` + `usePlural: true` configuration

3. **Error "Failed to execute 'json' on 'Response'"**
   - Solution: Robust response handling (text → JSON parse with fallback)

4. **Error "Invalid email" on login/register**
   - Solution: Client-side validation + normalization (trim, lowercase)

5. **Error "UNSUPPORTED_MEDIA_TYPE" on sign-out**
   - Solution: Replaced HTML form with client component using `fetch` + `Content-Type: application/json`

6. **Error "Unexpected end of JSON input" on sign-out**
   - Solution: Send empty body `{}` instead of no body

---

### Session 2025-11-28

**Phase 1 Complete — File Upload/Download**

#### Files Created/Modified

**Utilities:**
- `lib/audit/logger.ts` - Helper to log audit events (FILE_UPLOAD, FILE_DOWNLOAD, etc.)

**API Routes:**
- `app/api/files/upload/route.ts` - File upload with session, type, size validation; Nextcloud WebDAV integration
- `app/api/files/route.ts` - List files of logged-in user
- `app/api/files/download/[fileId]/route.ts` - Download with ownership validation and auditing

**Components:**
- `components/files/file-upload.tsx` - Upload component with drag & drop, progress bar, states (idle/uploading/success/error)
- `components/files/file-list.tsx` - File list with loading/empty/error states
- `components/files/file-item.tsx` - Individual item with icon by type, name, formatted size, date, actions

**Updated Pages:**
- `app/(app)/files/page.tsx` - FileUpload + FileList integration with refresh after upload

**Scripts:**
- `scripts/test-storage.ts` - Script to test Nextcloud WebDAV configuration

#### Problems Solved

1. **Input overlay intercepting clicks on upload button**
   - Solution: Render input overlay only when necessary (idle + no file selected)

2. **TypeScript error in self-referential FK (folders table)**
   - Solution: Remove inline `.references()` for `parentFolderId` (FK managed by database)

#### Dependências Instaladas

```json
{
  "drizzle-orm": "^0.44.7",
  "drizzle-kit": "^0.31.7",
  "postgres": "^3.4.7",
  "better-auth": "^1.4.3",
  "zod": "^4.1.13",
  "react-hook-form": "^7.66.1",
  "@hookform/resolvers": "^5.2.2",
  "nanoid": "^5.1.6"
}
```

#### Next Steps (Phase 2)

1. Implement folder creation
2. Hierarchical navigation (breadcrumbs)
3. Upload to specific folder
4. Move/rename files and folders
5. File search

---

### Session 2025-11-28 (continuation)

**Phase 2 Complete — Folder System and Organization**

#### Files Created

**API Routes:**
- `app/api/folders/route.ts` - GET (list folders) and POST (create folder)
- `app/api/folders/[folderId]/route.ts` - GET (details + path) and DELETE (recursive deletion)
- `app/api/folders/[folderId]/move/route.ts` - PATCH (move folder)
- `app/api/folders/[folderId]/rename/route.ts` - PATCH (rename folder)
- `app/api/files/[fileId]/route.ts` - DELETE (delete file)
- `app/api/files/[fileId]/move/route.ts` - PATCH (move file)
- `app/api/files/[fileId]/rename/route.ts` - PATCH (rename file)
- `app/api/search/route.ts` - GET (search by name with folder context)

**Components:**
- `components/files/breadcrumbs.tsx` - Hierarchical navigation with links
- `components/files/folder-item.tsx` - Folder item with actions (rename, move, delete)
- `components/files/create-folder-dialog.tsx` - Dialog to create new folder
- `components/files/move-dialog.tsx` - Dialog with folder navigation to move
- `components/files/rename-dialog.tsx` - Dialog to rename file/folder
- `components/files/search-box.tsx` - Search field with results dropdown

**Pages:**
- `app/(app)/files/[[...folderId]]/page.tsx` - Files page with catch-all route

#### Files Modified

- `app/api/files/route.ts` - Added filter by `folderId` and return subfolders
- `app/api/files/upload/route.ts` - Added support for `folderId` in FormData
- `components/files/file-upload.tsx` - Added `folderId` prop
- `components/files/file-item.tsx` - Added rename, move, delete actions
- `components/files/file-list.tsx` - Displays folders + files, integrates dialogs

#### Problems Solved

1. **Array mutation in folder deletion**
   - Problem: `folderIds.reverse()` mutated the original array
   - Solution: Use `[...folderIds].reverse()` to reverse a copy

2. **Security in path search**
   - Problem: `getFolderPath` did not verify ownership of ancestor folders
   - Solution: Added verification `eq(folders.ownerId, userId)` in query

3. **TypeScript error with dotenv**
   - Problem: `scripts/test-storage.ts` imported uninstalled `dotenv`
   - Solution: Installed `dotenv` as dev dependency

#### Dependências Instaladas

```json
{
  "dotenv": "^17.2.3" (devDependency)
}
```

#### Estrutura de Rotas Final (Fase 2)

```
/api/folders                    GET, POST
/api/folders/[folderId]         GET, DELETE
/api/folders/[folderId]/move    PATCH
/api/folders/[folderId]/rename  PATCH
/api/files                      GET
/api/files/upload               POST
/api/files/download/[fileId]    GET
/api/files/[fileId]             DELETE
/api/files/[fileId]/move        PATCH
/api/files/[fileId]/rename      PATCH
/api/search                     GET
```

#### Next Steps (Phase 4)

1. Expand audit logging system
2. Log visualization and export
3. Activity dashboard
4. UI/UX refinements
5. Security hardening
6. Error handling

---

### Session 2025-11-28 (Phase 3)

**Phase 3 Complete — Sharing System**

#### Files Created

**API Routes:**
- `app/api/share/route.ts` - GET (list links) and POST (create link)
- `app/api/share/[token]/route.ts` - GET (info), POST (download), PATCH (update), DELETE (revoke)
- `app/api/share/[token]/file/[fileId]/route.ts` - POST (download file from shared folder)
- `app/api/permissions/route.ts` - GET (list) and POST (create permission)
- `app/api/permissions/[permissionId]/route.ts` - PATCH (update) and DELETE (revoke)
- `app/api/users/search/route.ts` - GET (search users by name/email)

**Pages:**
- `app/share/[token]/page.tsx` - Public sharing page (Server Component)
- `app/share/[token]/client.tsx` - Client for sharing page
- `app/share/[token]/not-found.tsx` - Error page for links not found

**Components:**
- `components/files/share-dialog.tsx` - Dialog with Links/People tabs for sharing

**Utilities:**
- `lib/permissions/check.ts` - Helper for permission validation

**UI Components (shadcn/ui):**
- `components/ui/select.tsx` - Select component
- `components/ui/label.tsx` - Label component

#### Files Modified

- `components/files/file-item.tsx` - Added "Share" button in menu
- `components/files/folder-item.tsx` - Added "Share" button in menu
- `components/files/file-list.tsx` - ShareDialog integration
- `app/api/files/download/[fileId]/route.ts` - Permission validation
- `app/api/files/upload/route.ts` - Permission validation on destination folder
- `app/api/files/[fileId]/move/route.ts` - Permission validation
- `app/api/files/[fileId]/rename/route.ts` - Permission validation
- `app/api/folders/[folderId]/move/route.ts` - Permission validation
- `app/api/folders/[folderId]/rename/route.ts` - Permission validation

#### Updated Route Structure (Phase 3)

```
/api/share                           GET, POST
/api/share/[token]                   GET, POST, PATCH, DELETE
/api/share/[token]/file/[fileId]     POST
/api/permissions                     GET, POST
/api/permissions/[permissionId]      PATCH, DELETE
/api/users/search                    GET
```

#### Permission System Features

- **Permission hierarchy:** admin > write > read
- **Inheritance:** Files inherit permissions from parent folder
- **Validation:** All operations verify permissions before executing
- **Share links:** 32-character tokens, optional expiration, renewal with 1 click

---

### Session 2025-11-28 (Phase 4)

**Phase 4 Complete — Auditing and Refinements**

#### Files Created

**API Routes:**
- `app/api/audit/route.ts` - GET (list logs with filters and pagination)
- `app/api/audit/export/route.ts` - GET (export logs in CSV or JSON)
- `app/api/stats/route.ts` - GET (user statistics)

**Pages:**
- `app/(app)/audit/page.tsx` - Audit logs page
- `app/not-found.tsx` - Custom 404 page
- `app/error.tsx` - Runtime error page
- `app/global-error.tsx` - Critical error page (root)

**Components:**
- `components/audit/audit-filters.tsx` - Filters for logs (action, period)
- `components/audit/audit-table.tsx` - Log table with pagination
- `components/dashboard/dashboard-stats.tsx` - Statistics cards
- `components/dashboard/recent-activity.tsx` - Recent activities feed

**Utilities:**
- `lib/rate-limit.ts` - In-memory rate limiter with predefined configurations
- `middleware.ts` - Middleware for rate limiting on critical endpoints

#### Files Modified

- `lib/auth.ts` - Added hooks for LOGIN/LOGOUT audit events
- `next.config.ts` - Added security headers
- `app/layout.tsx` - Added Toaster from sonner
- `app/(app)/layout.tsx` - Added "Audit" link in navigation
- `app/(app)/dashboard/page.tsx` - Redesigned with stats and activities
- `components/files/file-upload.tsx` - Toast notifications
- `components/files/file-list.tsx` - Toast notifications
- `components/files/rename-dialog.tsx` - Toast notifications
- `components/files/move-dialog.tsx` - Toast notifications
- `components/files/create-folder-dialog.tsx` - Toast notifications

#### Dependencies Installed

```json
{
  "sonner": "^2.0.7"
}
```

#### Final Route Structure (Phase 4)

```
/api/audit                GET (filters: action, dateFrom, dateTo, page, limit)
/api/audit/export         GET (format: csv or json)
/api/stats                GET (user statistics)
```

#### Implemented Security Features

- **Rate Limiting:**
  - Login: 5 attempts/minute per IP
  - Registration: 3 attempts/minute per IP
  - Upload: 10 uploads/minute per IP
  - Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

- **Security Headers:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

#### Complete Self-Hosted MVP - Summary

SecuraDocs is complete with all planned features and self-hosted infrastructure:

1. **Authentication:** Login/register with email/password via Better Auth
2. **Files:** Upload, download, rename, move, delete (via Nextcloud WebDAV)
3. **Folders:** Creation, hierarchical navigation, breadcrumbs
4. **Sharing:** Public links with expiration, permissions per user
5. **Auditing:** Complete logs, visualization, filters, export
6. **Dashboard:** Statistics, recent activities, quick actions
7. **Security:** Rate limiting, security headers, permission validation
8. **UI/UX:** Toast notifications, loading states, error pages
9. **Infrastructure:** Docker Compose with PostgreSQL + Nextcloud + Next.js

#### Next Steps

1. Deploy to production
2. Collect user feedback
3. Improvements based on feedback
4. Future features: file preview, versions, public API

