# PLAN.md — Plano de Desenvolvimento Incremental

## 1. Metadados

- **Nome do projeto:** SecuraDocs
- **Versão do documento:** v1.0
- **Data:** 2025-01-28
- **Última atualização:** 2025-11-28 (MVP Completo - Fases 0-4)
- **Autor(es):** Equipe SecuraDocs
- **Status:** MVP Completo

---

## 2. Abordagem Incremental

Este plano segue uma abordagem de **desenvolvimento incremental**, onde cada fase adiciona funcionalidades validadas antes de avançar para a próxima. O objetivo é ter um **micro MVP** funcional rapidamente e ir evoluindo até um **MVP completo**.

### 2.1 Princípios

- **Validação contínua:** Cada fase deve ser testada e validada antes de avançar.
- **Deploy incremental:** Cada fase pode ser deployada e testada em produção.
- **Feedback rápido:** Priorizar funcionalidades que geram valor imediato.
- **Simplicidade primeiro:** Começar simples e adicionar complexidade conforme necessário.

---

## 3. Fases de Desenvolvimento

### Fase 0: Setup e Infraestrutura Base (Micro MVP Base) ✅ COMPLETA

**Objetivo:** Configurar toda a infraestrutura técnica necessária para desenvolvimento.

**Status:** Completa (2025-01-27)

#### Tarefas

- [x] **0.1** Configurar Drizzle ORM ✅
  - Instaladas dependências: `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`
  - Criado `lib/db/index.ts` com conexão NeonDB (lazy loading + graceful error handling)
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

- [x] **0.4** Configurar Supabase Storage (MVP) ✅
  - Instalado `@supabase/supabase-js`
  - Criado `lib/storage/client.ts` com cliente Supabase (lazy loading + graceful error handling)
  - Configuradas variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
  - Bucket a ser criado no Supabase Dashboard

- [x] **0.5** Estrutura de Pastas Next.js ✅
  - Estrutura de pastas criada conforme TECH_SPECS.md
  - Configuradas rotas: `(auth)/login`, `(auth)/register`, `(app)/dashboard`, `(app)/files`
  - Layout base com navegação criado
  - Criado `lib/env.ts` para verificação de variáveis de ambiente
  - Criada página `/setup` para guiar configuração quando variáveis faltam

**Critérios de Aceitação:**
- [x] Drizzle conecta ao NeonDB e migrations aplicadas
- [x] Better Auth funciona (login e registro testados via curl e browser)
- [x] shadcn/ui componentes renderizam corretamente
- [x] Cliente Supabase Storage configurado
- [x] Estrutura de pastas criada e organizada

**Validação:**
- ✅ Conexão com banco testada
- ✅ Autenticação testada (criar usuário, login, logout)
- ✅ Componentes UI renderizam corretamente

---

### Fase 1: Micro MVP — Autenticação + Upload Básico ✅ COMPLETA

**Objetivo:** Ter um sistema funcional onde usuários podem se autenticar e fazer upload/download de arquivos.

**Status:** Completa (2025-11-28)

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
  - Upload para Supabase Storage com chave única (`{userId}/{timestamp}-{filename}`)
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
  - Busca arquivo do Supabase Storage e retorna como stream com headers corretos
  - Registra evento de auditoria (`FILE_DOWNLOAD`)

**Critérios de Aceitação:**
- [x] Usuário consegue se registrar e fazer login
- [x] Usuário consegue fazer upload de arquivo e ver na lista
- [x] Usuário consegue baixar arquivo próprio
- [x] Arquivos aparecem apenas para o proprietário
- [x] Logs básicos de upload/download funcionam

**Validação:**
- ✅ Registro testado (via curl e browser)
- ✅ Login testado (via curl e browser)
- ✅ Logout testado (via browser)
- ✅ Upload testado (via browser) - arquivo enviado para Supabase Storage e registro criado no DB
- ✅ Listagem testada (via browser) - arquivos exibidos com nome, tamanho, data
- ✅ Download testado (via browser) - arquivo baixado corretamente

---

### Fase 2: MVP Core — Organização e Pastas ✅ COMPLETA

**Objetivo:** Adicionar sistema de pastas para organização hierárquica de arquivos.

**Status:** Completa (2025-11-28)

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

**Critérios de Aceitação:**
- [x] Usuário consegue criar pastas e navegar entre elas
- [x] Usuário consegue fazer upload em pasta específica
- [x] Usuário consegue mover arquivos/pastas entre pastas
- [x] Usuário consegue renomear recursos
- [x] Busca encontra arquivos por nome
- [x] Usuário consegue deletar arquivos e pastas

**Validação:**
- ✅ Criação de estrutura hierárquica testada (pastas aninhadas)
- ✅ Navegação via breadcrumbs funciona corretamente
- ✅ Upload em pastas específicas funciona
- ✅ Mover arquivos/pastas validado (incluindo proteção anti-loop)
- ✅ Renomear funciona com validação de duplicatas
- ✅ Busca retorna resultados com contexto de pasta
- ✅ Deletar remove arquivos do Storage e registros do banco

---

### Fase 3: MVP Compartilhamento — Links e Permissões ✅ COMPLETA

**Objetivo:** Implementar sistema de compartilhamento com controle de permissões.

**Status:** Completa (2025-11-28)

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

**Critérios de Aceitação:**
- [x] Usuário consegue criar link de compartilhamento
  - [x] Link funciona sem autenticação
  - [x] Link expira conforme configurado
- [x] Usuário consegue compartilhar com usuários específicos
- [x] Permissões são respeitadas (read-only não pode modificar)
- [x] Proprietário consegue revogar acesso

**Validação:**
- ✅ Compartilhamento por link testado
- ✅ Compartilhamento com usuário específico testado
- ✅ Validação de permissões implementada
- ✅ Expiração de links funciona corretamente

---

### Fase 4: MVP Completo — Auditoria e Refinamentos ✅ COMPLETA

**Objetivo:** Adicionar sistema de auditoria completo e refinamentos finais de UI/UX e segurança.

**Status:** Completa (2025-11-28)

**Nota:** Deletar arquivos/pastas já implementado na Fase 2.

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

**Critérios de Aceitação:**
- [x] Todos os eventos críticos são registrados em logs
- [x] Usuário consegue visualizar e filtrar logs
- [x] Logs podem ser exportados
- [x] Dashboard mostra atividades recentes
- [x] UI é polida e responsiva
- [x] Segurança básica implementada

**Validação:**
- ✅ LOGIN/LOGOUT são logados com IP e user agent
- ✅ Filtros por ação e período funcionam
- ✅ Exportação CSV/JSON funciona
- ✅ Dashboard exibe stats e atividades recentes
- ✅ Toasts aparecem em todas as ações principais
- ✅ Rate limiting bloqueia requisições excessivas
- ✅ Páginas de erro customizadas funcionam

---

## 4. Roadmap Visual

```
Fase 0: Setup ✅
├── Drizzle + NeonDB
├── Better Auth
├── shadcn/ui
└── Supabase Storage
    ↓
Fase 1: Micro MVP ✅
├── Autenticação (login/registro)
├── Upload de arquivo
├── Listagem de arquivos
└── Download de arquivo
    ↓
Fase 2: MVP Core ✅
├── Sistema de pastas
├── Navegação hierárquica
├── Mover/renomear
└── Busca
    ↓
Fase 3: MVP Compartilhamento ✅
├── Compartilhamento por link
├── Compartilhamento com usuários
├── Gerenciamento de permissões
└── Validação de permissões
    ↓
Fase 4: MVP Completo ✅
├── Sistema de auditoria (expandir)
├── Visualização de logs
├── Dashboard de atividades
└── Refinamentos UI/UX + Segurança

🎉 MVP COMPLETO! 🎉
```

---

## 5. Priorização e Decisões

### 5.1 O que Entra no MVP

- Autenticação básica (email/senha)
- Upload/download de arquivos
- Sistema de pastas
- Compartilhamento (links e usuários)
- Permissões básicas (read/write)
- Logs de auditoria básicos

### 5.2 O que Fica Fora do MVP (Futuro)

- Criptografia ponta a ponta (E2EE)
- Preview de arquivos (imagens, PDFs)
- Versões de arquivos (histórico)
- Comentários e anotações
- Edição colaborativa
- Sincronização desktop/mobile
- Multi-tenant
- API pública
- Notificações push/email

### 5.3 Decisões Técnicas por Fase

**Fase 0-1:** Focar em funcionalidade básica, UI simples.
**Fase 2:** Adicionar organização, manter simplicidade.
**Fase 3:** Implementar segurança e permissões corretamente.
**Fase 4:** Polir e endurecer, preparar para produção.

---

## 6. Métricas de Progresso

### 6.1 Por Fase

- **Fase 0:** Infraestrutura configurada e testada
- **Fase 1:** Usuário consegue fazer upload/download
- **Fase 2:** Usuário consegue organizar arquivos em pastas
- **Fase 3:** Usuário consegue compartilhar com controle de acesso
- **Fase 4:** Sistema completo com auditoria e segurança

### 6.2 Validação Contínua

Após cada fase:
- [x] Testes manuais dos fluxos principais (Fases 0-4)
- [x] Validação de requisitos funcionais da fase (Fases 0-4)
- [ ] Deploy em ambiente de staging (se disponível)
- [ ] Feedback de usuários beta (se disponível)

---

## 7. Riscos e Mitigações

### 7.1 Riscos Técnicos

**Risco:** Complexidade de permissões pode atrasar Fase 3
- **Mitigação:** Começar com permissões simples (read/write), adicionar granularidade depois
- **Resultado:** ✅ Fase 3 concluída com sistema de permissões completo (read/write/admin + herança)

**Risco:** Performance com muitos arquivos
- **Mitigação:** Implementar paginação desde o início, otimizar queries
- **Status:** Pendente - considerar paginação na Fase 4

**Risco:** Migração de dados entre fases
- **Mitigação:** Manter migrations do Drizzle atualizadas, testar em ambiente de dev
- **Resultado:** ✅ Schema estável desde Fase 0

### 7.2 Riscos de Escopo

**Risco:** Feature creep (adicionar funcionalidades não planejadas)
- **Mitigação:** Manter foco no MVP, documentar ideias para futuro

**Risco:** Perfeccionismo em UI
- **Mitigação:** Priorizar funcionalidade sobre perfeição visual nas primeiras fases

---

## 8. Próximos Passos Após MVP

1. **Coleta de Feedback**
   - Deploy para usuários beta
   - Coletar feedback qualitativo
   - Identificar pontos de dor

2. **Melhorias Baseadas em Feedback**
   - Priorizar melhorias de UX
   - Corrigir bugs críticos
   - Otimizar performance

3. **Features Futuras**
   - Preview de arquivos
   - Versões de arquivos
   - API pública
   - Multi-tenant

4. **Preparação para Produção**
   - Documentação de deploy
   - Guias de manutenção
   - Monitoramento e alertas
   - Backup automatizado

---

## 9. Referências

- [PRD.md](PRD.md) - Requisitos do produto
- [TECH_SPECS.md](TECH_SPECS.md) - Especificações técnicas
- [MIGRATION_SELF_HOSTED.md](MIGRATION_SELF_HOSTED.md) - Guia de migração

---

## 10. Notas de Implementação

### 10.1 Ordem Recomendada de Implementação

Seguir a ordem das fases, mas dentro de cada fase, priorizar:
1. Backend (rotas, lógica de negócio)
2. Integração com banco/storage
3. Frontend (componentes, páginas)
4. Validação e testes

### 10.2 Commits e Versionamento

- Commits pequenos e frequentes
- Mensagens descritivas: `feat: adiciona upload de arquivo` ou `fix: corrige validação de permissões`
- Usar conventional commits se possível

### 10.3 Testes

- Testes manuais após cada feature
- Testes de integração para fluxos críticos
- Considerar testes automatizados no futuro (E2E com Playwright)

---

## 11. Log de Implementação

### Sessão 2025-01-27/28

**Fase 0 Completa + Fase 1 Autenticação**

#### Arquivos Criados/Modificados

**Infraestrutura:**
- `lib/db/index.ts` - Conexão Drizzle com NeonDB (lazy loading)
- `lib/db/schema.ts` - Schemas completos (users, sessions, accounts, verifications, files, folders, permissions, shareLinks, auditLogs)
- `lib/auth.ts` - Configuração Better Auth com Drizzle adapter (`usePlural: true`)
- `lib/storage/client.ts` - Cliente Supabase Storage (lazy loading)
- `lib/env.ts` - Helper para verificar variáveis de ambiente
- `drizzle.config.ts` - Configuração Drizzle Kit

**API Routes:**
- `app/api/auth/[...all]/route.ts` - Proxy Better Auth com tratamento de erros

**Páginas:**
- `app/page.tsx` - Página inicial com redirecionamento condicional
- `app/setup/page.tsx` - Página de setup para variáveis não configuradas
- `app/setup/refresh-button.tsx` - Componente cliente para refresh
- `app/(auth)/login/page.tsx` - Formulário de login com validação
- `app/(auth)/register/page.tsx` - Formulário de registro com validação
- `app/(app)/layout.tsx` - Layout protegido com navbar
- `app/(app)/dashboard/page.tsx` - Dashboard com cards
- `app/(app)/files/page.tsx` - Placeholder para arquivos

**Componentes:**
- `components/auth/sign-out-button.tsx` - Botão de logout com fetch JSON
- `components/ui/*` - Componentes shadcn/ui (button, input, card, dialog, dropdown-menu)

#### Problemas Resolvidos

1. **Erro "DATABASE_URL not set" crashava app**
   - Solução: Lazy loading em `lib/db/index.ts`, redirecionamento para `/setup`

2. **Better Auth "users model not found"**
   - Solução: Adicionadas tabelas `sessions`, `accounts`, `verifications` + configuração `usePlural: true`

3. **Erro "Failed to execute 'json' on 'Response'"**
   - Solução: Tratamento robusto de resposta (text → JSON parse com fallback)

4. **Erro "Invalid email" no login/registro**
   - Solução: Validação no cliente + normalização (trim, lowercase)

5. **Erro "UNSUPPORTED_MEDIA_TYPE" no sign-out**
   - Solução: Substituído formulário HTML por componente cliente com `fetch` + `Content-Type: application/json`

6. **Erro "Unexpected end of JSON input" no sign-out**
   - Solução: Enviar body vazio `{}` em vez de nenhum body

---

### Sessão 2025-11-28

**Fase 1 Completa — Upload/Download de Arquivos**

#### Arquivos Criados/Modificados

**Utilitários:**
- `lib/audit/logger.ts` - Helper para registrar eventos de auditoria (FILE_UPLOAD, FILE_DOWNLOAD, etc.)

**API Routes:**
- `app/api/files/upload/route.ts` - Upload de arquivos com validação de sessão, tipo, tamanho; integração Supabase Storage
- `app/api/files/route.ts` - Listagem de arquivos do usuário logado
- `app/api/files/download/[fileId]/route.ts` - Download com validação de propriedade e auditoria

**Componentes:**
- `components/files/file-upload.tsx` - Componente de upload com drag & drop, progress bar, estados (idle/uploading/success/error)
- `components/files/file-list.tsx` - Lista de arquivos com loading/empty/error states
- `components/files/file-item.tsx` - Item individual com ícone por tipo, nome, tamanho formatado, data, ações

**Páginas Atualizadas:**
- `app/(app)/files/page.tsx` - Integração de FileUpload + FileList com refresh após upload

**Scripts:**
- `scripts/test-storage.ts` - Script para testar configuração do Supabase Storage

#### Problemas Resolvidos

1. **Input overlay interceptando cliques no botão de upload**
   - Solução: Renderizar input overlay apenas quando necessário (idle + sem arquivo selecionado)

2. **Bucket não encontrado no Supabase**
   - Solução: Criar bucket `SecuraDocs1` no Supabase Dashboard e atualizar `BUCKET_NAME` em `lib/storage/client.ts`

3. **Erro TypeScript em self-referential FK (folders table)**
   - Solução: Remover `.references()` inline para `parentFolderId` (FK gerenciada pelo banco)

#### Dependências Instaladas

```json
{
  "drizzle-orm": "^0.44.7",
  "drizzle-kit": "^0.31.7",
  "@neondatabase/serverless": "^1.0.2",
  "better-auth": "^1.4.3",
  "@supabase/supabase-js": "^2.86.0",
  "zod": "^4.1.13",
  "react-hook-form": "^7.66.1",
  "@hookform/resolvers": "^5.2.2",
  "nanoid": "^5.1.6"
}
```

#### Próximos Passos (Fase 2)

1. Implementar criação de pastas
2. Navegação hierárquica (breadcrumbs)
3. Upload em pasta específica
4. Mover/renomear arquivos e pastas
5. Busca de arquivos

---

### Sessão 2025-11-28 (continuação)

**Fase 2 Completa — Sistema de Pastas e Organização**

#### Arquivos Criados

**API Routes:**
- `app/api/folders/route.ts` - GET (listar pastas) e POST (criar pasta)
- `app/api/folders/[folderId]/route.ts` - GET (detalhes + caminho) e DELETE (exclusão recursiva)
- `app/api/folders/[folderId]/move/route.ts` - PATCH (mover pasta)
- `app/api/folders/[folderId]/rename/route.ts` - PATCH (renomear pasta)
- `app/api/files/[fileId]/route.ts` - DELETE (excluir arquivo)
- `app/api/files/[fileId]/move/route.ts` - PATCH (mover arquivo)
- `app/api/files/[fileId]/rename/route.ts` - PATCH (renomear arquivo)
- `app/api/search/route.ts` - GET (busca por nome com contexto de pasta)

**Componentes:**
- `components/files/breadcrumbs.tsx` - Navegação hierárquica com links
- `components/files/folder-item.tsx` - Item de pasta com ações (renomear, mover, deletar)
- `components/files/create-folder-dialog.tsx` - Dialog para criar nova pasta
- `components/files/move-dialog.tsx` - Dialog com navegação de pastas para mover
- `components/files/rename-dialog.tsx` - Dialog para renomear arquivo/pasta
- `components/files/search-box.tsx` - Campo de busca com dropdown de resultados

**Páginas:**
- `app/(app)/files/[[...folderId]]/page.tsx` - Página de arquivos com catch-all route

#### Arquivos Modificados

- `app/api/files/route.ts` - Adicionado filtro por `folderId` e retorno de subpastas
- `app/api/files/upload/route.ts` - Adicionado suporte a `folderId` no FormData
- `components/files/file-upload.tsx` - Adicionada prop `folderId`
- `components/files/file-item.tsx` - Adicionadas ações de renomear, mover, deletar
- `components/files/file-list.tsx` - Exibe pastas + arquivos, integra dialogs

#### Problemas Resolvidos

1. **Array mutation em exclusão de pastas**
   - Problema: `folderIds.reverse()` mutava o array original
   - Solução: Usar `[...folderIds].reverse()` para reverter uma cópia

2. **Segurança na busca de caminhos**
   - Problema: `getFolderPath` não verificava ownership das pastas ancestrais
   - Solução: Adicionada verificação `eq(folders.ownerId, userId)` na query

3. **Erro TypeScript com dotenv**
   - Problema: `scripts/test-storage.ts` importava `dotenv` não instalado
   - Solução: Instalado `dotenv` como dev dependency

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

#### Próximos Passos (Fase 4)

1. Expandir sistema de logs de auditoria
2. Visualização e exportação de logs
3. Dashboard de atividades
4. Refinamentos de UI/UX
5. Endurecimento de segurança
6. Tratamento de erros

---

### Sessão 2025-11-28 (Fase 3)

**Fase 3 Completa — Sistema de Compartilhamento**

#### Arquivos Criados

**API Routes:**
- `app/api/share/route.ts` - GET (listar links) e POST (criar link)
- `app/api/share/[token]/route.ts` - GET (info), POST (download), PATCH (atualizar), DELETE (revogar)
- `app/api/share/[token]/file/[fileId]/route.ts` - POST (download arquivo de pasta compartilhada)
- `app/api/permissions/route.ts` - GET (listar) e POST (criar permissão)
- `app/api/permissions/[permissionId]/route.ts` - PATCH (atualizar) e DELETE (revogar)
- `app/api/users/search/route.ts` - GET (buscar usuários por nome/email)

**Páginas:**
- `app/share/[token]/page.tsx` - Página pública de compartilhamento (Server Component)
- `app/share/[token]/client.tsx` - Cliente para página de compartilhamento
- `app/share/[token]/not-found.tsx` - Página de erro para links não encontrados

**Componentes:**
- `components/files/share-dialog.tsx` - Dialog com abas Links/Pessoas para compartilhamento

**Utilitários:**
- `lib/permissions/check.ts` - Helper para validação de permissões

**UI Components (shadcn/ui):**
- `components/ui/select.tsx` - Componente Select
- `components/ui/label.tsx` - Componente Label

#### Arquivos Modificados

- `components/files/file-item.tsx` - Adicionado botão "Compartilhar" no menu
- `components/files/folder-item.tsx` - Adicionado botão "Compartilhar" no menu
- `components/files/file-list.tsx` - Integração com ShareDialog
- `app/api/files/download/[fileId]/route.ts` - Validação de permissões
- `app/api/files/upload/route.ts` - Validação de permissões na pasta destino
- `app/api/files/[fileId]/move/route.ts` - Validação de permissões
- `app/api/files/[fileId]/rename/route.ts` - Validação de permissões
- `app/api/folders/[folderId]/move/route.ts` - Validação de permissões
- `app/api/folders/[folderId]/rename/route.ts` - Validação de permissões

#### Estrutura de Rotas Atualizada (Fase 3)

```
/api/share                           GET, POST
/api/share/[token]                   GET, POST, PATCH, DELETE
/api/share/[token]/file/[fileId]     POST
/api/permissions                     GET, POST
/api/permissions/[permissionId]      PATCH, DELETE
/api/users/search                    GET
```

#### Funcionalidades do Sistema de Permissões

- **Hierarquia de permissões:** admin > write > read
- **Herança:** Arquivos herdam permissões da pasta pai
- **Validação:** Todas as operações verificam permissões antes de executar
- **Share links:** Tokens de 32 caracteres, expiração opcional, renovação com 1 clique

---

### Sessão 2025-11-28 (Fase 4)

**Fase 4 Completa — Auditoria e Refinamentos**

#### Arquivos Criados

**API Routes:**
- `app/api/audit/route.ts` - GET (listar logs com filtros e paginação)
- `app/api/audit/export/route.ts` - GET (exportar logs em CSV ou JSON)
- `app/api/stats/route.ts` - GET (estatísticas do usuário)

**Páginas:**
- `app/(app)/audit/page.tsx` - Página de logs de auditoria
- `app/not-found.tsx` - Página 404 customizada
- `app/error.tsx` - Página de erro de runtime
- `app/global-error.tsx` - Página de erro crítico (root)

**Componentes:**
- `components/audit/audit-filters.tsx` - Filtros para logs (ação, período)
- `components/audit/audit-table.tsx` - Tabela de logs com paginação
- `components/dashboard/dashboard-stats.tsx` - Cards de estatísticas
- `components/dashboard/recent-activity.tsx` - Feed de atividades recentes

**Utilitários:**
- `lib/rate-limit.ts` - Rate limiter in-memory com configurações predefinidas
- `middleware.ts` - Middleware para rate limiting em endpoints críticos

#### Arquivos Modificados

- `lib/auth.ts` - Adicionados hooks para LOGIN/LOGOUT audit events
- `next.config.ts` - Adicionados security headers
- `app/layout.tsx` - Adicionado Toaster do sonner
- `app/(app)/layout.tsx` - Adicionado link "Auditoria" na navegação
- `app/(app)/dashboard/page.tsx` - Redesenhado com stats e atividades
- `components/files/file-upload.tsx` - Toast notifications
- `components/files/file-list.tsx` - Toast notifications
- `components/files/rename-dialog.tsx` - Toast notifications
- `components/files/move-dialog.tsx` - Toast notifications
- `components/files/create-folder-dialog.tsx` - Toast notifications

#### Dependências Instaladas

```json
{
  "sonner": "^2.0.7"
}
```

#### Estrutura de Rotas Final (Fase 4)

```
/api/audit                GET (filtros: action, dateFrom, dateTo, page, limit)
/api/audit/export         GET (formato: csv ou json)
/api/stats                GET (estatísticas do usuário)
```

#### Funcionalidades de Segurança Implementadas

- **Rate Limiting:**
  - Login: 5 tentativas/minuto por IP
  - Registro: 3 tentativas/minuto por IP
  - Upload: 10 uploads/minuto por IP
  - Headers de resposta: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

- **Security Headers:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

#### MVP Completo - Resumo

O SecuraDocs MVP está completo com todas as funcionalidades planejadas:

1. **Autenticação:** Login/registro com email/senha via Better Auth
2. **Arquivos:** Upload, download, renomear, mover, excluir
3. **Pastas:** Criação, navegação hierárquica, breadcrumbs
4. **Compartilhamento:** Links públicos com expiração, permissões por usuário
5. **Auditoria:** Logs completos, visualização, filtros, exportação
6. **Dashboard:** Estatísticas, atividades recentes, ações rápidas
7. **Segurança:** Rate limiting, headers de segurança, validação de permissões
8. **UI/UX:** Toast notifications, loading states, páginas de erro

#### Próximos Passos (Pós-MVP)

1. Deploy para produção
2. Coleta de feedback de usuários
3. Melhorias baseadas em feedback
4. Features futuras: preview de arquivos, versões, API pública

