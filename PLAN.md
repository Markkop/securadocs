# PLAN.md — Plano de Desenvolvimento Incremental

## 1. Metadados

- **Nome do projeto:** SecuraDocs
- **Versão do documento:** v0.2
- **Data:** 2025-01-28
- **Última atualização:** 2025-01-28 (Fase 0 completa, Fase 1 em progresso)
- **Autor(es):** Equipe SecuraDocs
- **Status:** Em Desenvolvimento

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

### Fase 1: Micro MVP — Autenticação + Upload Básico 🔄 EM PROGRESSO

**Objetivo:** Ter um sistema funcional onde usuários podem se autenticar e fazer upload/download de arquivos.

**Duração estimada:** 4-8 horas

**Status:** Autenticação completa, Upload/Download pendente

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

- [ ] **1.3** Upload de Arquivo Único
  - Criar componente `FileUpload` (drag & drop ou input file)
  - Criar rota `/api/files/upload` (Route Handler)
  - Validar arquivo (tipo, tamanho) com Zod
  - Upload para Supabase Storage com chave única (`{userId}/{timestamp}-{filename}`)
  - Criar registro em `files` table via Drizzle
  - Feedback visual de progresso e sucesso/erro

- [ ] **1.4** Listagem de Arquivos do Usuário
  - Criar página `/files` ou seção no dashboard
  - Buscar arquivos do usuário logado via Drizzle
  - Exibir lista com: nome, tamanho, data de upload
  - Componente `FileList` com cards ou tabela

- [ ] **1.5** Download de Arquivo
  - Criar rota `/api/files/download/[fileId]`
  - Validar que usuário é proprietário do arquivo
  - Buscar arquivo do Supabase Storage e retornar como stream
  - Registrar evento de auditoria (`FILE_DOWNLOAD`)

**Critérios de Aceitação:**
- [x] Usuário consegue se registrar e fazer login
- [ ] Usuário consegue fazer upload de arquivo e ver na lista
- [ ] Usuário consegue baixar arquivo próprio
- [ ] Arquivos aparecem apenas para o proprietário
- [ ] Logs básicos de upload/download funcionam

**Validação:**
- ✅ Registro testado (via curl e browser)
- ✅ Login testado (via curl e browser)
- ✅ Logout testado (via browser)
- Pendente: upload → listagem → download

---

### Fase 2: MVP Core — Organização e Pastas

**Objetivo:** Adicionar sistema de pastas para organização hierárquica de arquivos.

**Duração estimada:** 6-10 horas

#### Tarefas

- [ ] **2.1** Criação de Pastas
  - Adicionar botão "Nova Pasta" na interface
  - Criar rota `/api/folders/create` (POST)
  - Validar nome da pasta e permissões
  - Criar registro em `folders` table via Drizzle
  - Suportar criação de pastas dentro de pastas (`parentFolderId`)

- [ ] **2.2** Navegação Hierárquica
  - Criar componente `FolderTree` ou `Breadcrumbs`
  - Criar rota `/files/[folderId]` para navegar em pastas
  - Buscar arquivos e subpastas da pasta atual
  - Exibir hierarquia visual (árvore ou breadcrumbs)

- [ ] **2.3** Upload em Pasta Específica
  - Modificar componente `FileUpload` para aceitar `folderId`
  - Atualizar rota de upload para associar arquivo à pasta
  - Validar permissões na pasta destino

- [ ] **2.4** Mover Arquivos/Pastas
  - Adicionar ação "Mover" no menu de contexto de arquivos/pastas
  - Criar rota `/api/files/move` e `/api/folders/move`
  - Validar que destino é válido (não criar loops)
  - Atualizar `folderId` no banco

- [ ] **2.5** Renomear Arquivos/Pastas
  - Adicionar ação "Renomear" no menu de contexto
  - Criar rotas `/api/files/rename` e `/api/folders/rename`
  - Validar nome único dentro da mesma pasta
  - Atualizar nome no banco (e opcionalmente no Supabase Storage se necessário)

- [ ] **2.6** Busca de Arquivos
  - Adicionar campo de busca na interface
  - Criar rota `/api/files/search?q=...`
  - Buscar por nome de arquivo/pasta (LIKE query no Drizzle)
  - Exibir resultados com contexto (em qual pasta está)

**Critérios de Aceitação:**
- [ ] Usuário consegue criar pastas e navegar entre elas
- [ ] Usuário consegue fazer upload em pasta específica
- [ ] Usuário consegue mover arquivos/pastas entre pastas
- [ ] Usuário consegue renomear recursos
- [ ] Busca encontra arquivos por nome

**Validação:**
- Testar criação de estrutura hierárquica complexa
- Validar que mover funciona corretamente
- Testar busca com diferentes termos

---

### Fase 3: MVP Compartilhamento — Links e Permissões

**Objetivo:** Implementar sistema de compartilhamento com controle de permissões.

**Duração estimada:** 8-12 horas

#### Tarefas

- [ ] **3.1** Compartilhamento por Link
  - Adicionar botão "Compartilhar" em arquivos/pastas
  - Criar componente `ShareDialog` (modal)
  - Criar rota `/api/files/share` (POST)
  - Gerar token único e seguro (nanoid ou crypto.randomBytes)
  - Criar registro em `share_links` table
  - Retornar link público: `{APP_URL}/share/{token}`

- [ ] **3.2** Página de Compartilhamento Público
  - Criar rota `/share/[token]`
  - Validar token e expiração (se houver)
  - Buscar recurso compartilhado (arquivo ou pasta)
  - Exibir informações do recurso e botão de download
  - Permitir download sem autenticação (se permissão permitir)

- [ ] **3.3** Compartilhamento com Usuários Específicos
  - Adicionar campo de busca de usuários no `ShareDialog`
  - Criar rota `/api/permissions/create` (POST)
  - Criar registro em `permissions` table
  - Notificar usuário (opcional: email ou notificação in-app)

- [ ] **3.4** Gerenciamento de Permissões
  - Criar página `/files/[resourceId]/permissions`
  - Listar usuários e links com acesso ao recurso
  - Permitir editar nível de permissão (read/write/admin)
  - Permitir revogar acesso (deletar permission ou share_link)

- [ ] **3.5** Validação de Permissões em Todas as Operações
  - Criar helper `lib/permissions/check.ts`
  - Validar permissões em:
    - Download de arquivo (proprietário OU permission OU link válido)
    - Upload em pasta (proprietário OU permission write)
    - Mover/renomear (proprietário OU permission write)
    - Compartilhamento (proprietário OU permission admin)

- [ ] **3.6** Expiração de Links
  - Adicionar campo de data de expiração no `ShareDialog`
  - Validar expiração ao acessar link
  - Opção de renovar link expirado (para proprietário)

**Critérios de Aceitação:**
- [ ] Usuário consegue criar link de compartilhamento
  - [ ] Link funciona sem autenticação
  - [ ] Link expira conforme configurado
- [ ] Usuário consegue compartilhar com usuários específicos
- [ ] Usuários compartilhados veem arquivos/pastas na lista
- [ ] Permissões são respeitadas (read-only não pode modificar)
- [ ] Proprietário consegue revogar acesso

**Validação:**
- Testar compartilhamento por link (acessar sem login)
- Testar compartilhamento com usuário específico
- Validar que permissões são respeitadas
- Testar expiração de links

---

### Fase 4: MVP Completo — Auditoria e Refinamentos

**Objetivo:** Adicionar sistema de auditoria completo e refinamentos finais de UI/UX e segurança.

**Duração estimada:** 6-10 horas

#### Tarefas

- [ ] **4.1** Sistema de Logs de Auditoria
  - Criar helper `lib/audit/logger.ts` para registrar eventos
  - Registrar eventos em todas as operações críticas:
    - `LOGIN`, `LOGOUT`
    - `FILE_UPLOAD`, `FILE_DOWNLOAD`, `FILE_DELETE`
    - `FOLDER_CREATE`, `FOLDER_DELETE`
    - `PERMISSION_CREATE`, `PERMISSION_REVOKE`
    - `SHARE_LINK_CREATE`, `SHARE_LINK_REVOKE`
  - Incluir metadados relevantes (IP opcional, resourceId, etc.)

- [ ] **4.2** Visualização de Logs
  - Criar página `/audit` ou `/settings/audit`
  - Listar eventos com filtros:
    - Por tipo de ação
    - Por usuário
    - Por período (data início/fim)
    - Por recurso (arquivo/pasta específico)
  - Paginação para grandes volumes de logs

- [ ] **4.3** Exportação de Logs
  - Adicionar botão "Exportar" na página de logs
  - Criar rota `/api/audit/export` (CSV ou JSON)
  - Incluir todos os campos relevantes

- [ ] **4.4** Dashboard de Atividades
  - Adicionar seção no dashboard com atividades recentes
  - Exibir últimos N eventos do usuário logado
  - Exibir estatísticas básicas (arquivos totais, espaço usado)

- [ ] **4.5** Deletar Arquivos/Pastas
  - Adicionar ação "Deletar" no menu de contexto
  - Criar rotas `/api/files/delete` e `/api/folders/delete`
  - Validar permissões (apenas proprietário ou admin)
  - Deletar arquivo do Supabase Storage e registro do banco
  - Registrar evento de auditoria

- [ ] **4.6** Refinamentos de UI/UX
  - Melhorar feedback visual (loading states, toasts)
  - Adicionar confirmações para ações destrutivas (deletar)
  - Melhorar responsividade mobile
  - Adicionar ícones apropriados (lucide-react)
  - Polir animações e transições

- [ ] **4.7** Endurecimento de Segurança
  - Adicionar rate limiting em endpoints críticos (login, upload)
  - Validar e sanitizar todas as entradas
  - Adicionar headers de segurança (CSP, HSTS)
  - Revisar e testar validação de permissões
  - Testar proteção contra path traversal

- [ ] **4.8** Tratamento de Erros
  - Criar páginas de erro customizadas (404, 500)
  - Melhorar mensagens de erro para usuário
  - Logging de erros no servidor (sem expor detalhes sensíveis)

**Critérios de Aceitação:**
- [ ] Todos os eventos críticos são registrados em logs
- [ ] Usuário consegue visualizar e filtrar logs
- [ ] Logs podem ser exportados
- [ ] Dashboard mostra atividades recentes
- [ ] Deletar funciona corretamente
- [ ] UI é polida e responsiva
- [ ] Segurança básica implementada

**Validação:**
- Testar que todos os eventos são logados
- Validar filtros e exportação de logs
- Testar ações destrutivas (deletar)
- Revisar segurança (tentar acessar recursos sem permissão)
- Testar em diferentes dispositivos (mobile, desktop)

---

## 4. Roadmap Visual

```
Fase 0: Setup
├── Drizzle + NeonDB
├── Better Auth
├── shadcn/ui
└── Supabase Storage
    ↓
Fase 1: Micro MVP
├── Autenticação (login/registro)
├── Upload de arquivo
├── Listagem de arquivos
└── Download de arquivo
    ↓
Fase 2: MVP Core
├── Sistema de pastas
├── Navegação hierárquica
├── Mover/renomear
└── Busca
    ↓
Fase 3: MVP Compartilhamento
├── Compartilhamento por link
├── Compartilhamento com usuários
├── Gerenciamento de permissões
└── Validação de permissões
    ↓
Fase 4: MVP Completo
├── Sistema de auditoria
├── Visualização de logs
├── Dashboard de atividades
├── Deletar recursos
└── Refinamentos UI/UX + Segurança
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
- [ ] Testes manuais dos fluxos principais
- [ ] Validação de requisitos funcionais da fase
- [ ] Deploy em ambiente de staging (se disponível)
- [ ] Feedback de usuários beta (se disponível)

---

## 7. Riscos e Mitigações

### 7.1 Riscos Técnicos

**Risco:** Complexidade de permissões pode atrasar Fase 3
- **Mitigação:** Começar com permissões simples (read/write), adicionar granularidade depois

**Risco:** Performance com muitos arquivos
- **Mitigação:** Implementar paginação desde o início, otimizar queries

**Risco:** Migração de dados entre fases
- **Mitigação:** Manter migrations do Drizzle atualizadas, testar em ambiente de dev

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

**Fase 0 Completa + Fase 1 Parcial**

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

#### Próximos Passos (Fase 1)

1. Criar bucket no Supabase Storage
2. Implementar componente `FileUpload`
3. Criar rota `/api/files/upload`
4. Implementar listagem de arquivos
5. Criar rota `/api/files/download/[fileId]`

