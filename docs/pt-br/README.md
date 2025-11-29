# SecuraDocs

> Uma plataforma segura e auto-hospedável de armazenamento e compartilhamento de arquivos para organizações que precisam de soberania e privacidade de dados.

[![Status](https://img.shields.io/badge/status-MVP%20in%20development-yellow)](https://github.com/securdocs/securdocs)

## Visão Geral

**SecuraDocs** é uma plataforma segura de armazenamento e compartilhamento de arquivos projetada para organizações sociais, ONGs e coletivos que precisam de soberania e privacidade de dados. É essencialmente uma "alternativa ao Google Drive" focada em segurança, autonomia e controle sobre dados.

### Principais Funcionalidades

- 🔐 **Autenticação Segura** - Better Auth com email/senha
- 📁 **Gerenciamento de Arquivos** - Upload, download e organização de arquivos em pastas
- 👥 **Compartilhamento e Permissões** - Compartilhe arquivos com controle granular de permissões
- 🔗 **Links de Compartilhamento** - Crie links públicos de compartilhamento com expiração
- 📊 **Logs de Auditoria** - Rastreie quem acessou o quê e quando
- 🏠 **Auto-Hospedável** - Faça deploy em sua própria infraestrutura para controle total

## Stack Tecnológica

| Componente | Tecnologia |
|-----------|------------|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Linguagem** | TypeScript 5.x |
| **Estilização** | Tailwind CSS 4 + shadcn/ui |
| **Banco de Dados** | PostgreSQL 16 + Drizzle ORM |
| **Autenticação** | Better Auth |
| **Armazenamento de Arquivos** | Nextcloud (auto-hospedado via Docker) |
| **Gerenciador de Pacotes** | pnpm |
| **Deploy** | Docker Compose |

## Início Rápido (5 minutos)

### Pré-requisitos

- **Docker** e **Docker Compose** - [Instalar Docker](https://docs.docker.com/get-docker/)

É isso! Todo o resto roda no Docker.

### Passo 1: Clonar e Iniciar

```bash
git clone https://github.com/your-org/securdocs.git
cd securdocs

# Iniciar todos os serviços
docker compose up -d

# Aguardar os serviços ficarem prontos (cerca de 30-60 segundos)
docker compose ps
```

### Passo 2: Executar Migrações do Banco de Dados

```bash
docker compose exec app pnpm db:push
```

### Passo 3: Configurar Nextcloud

1. **Acesse o Nextcloud** em http://localhost:8080
   - Login: `admin`
   - Senha: `admin123`

2. **Criar o usuário SecuraDocs:**
   - Clique no seu avatar (canto superior direito) → **Usuários**
   - Clique em **Novo usuário**
   - Nome de usuário: `securadocs`
   - Nome de exibição: `SecuraDocs`
   - Senha: (escolha uma senha)
   - Clique em **Adicionar novo usuário**

3. **Gerar uma Senha de Aplicativo:**
   - Faça logout e login como `securadocs`
   - Clique no avatar → **Configurações pessoais**
   - Vá em **Segurança** (barra lateral esquerda)
   - Role até **Dispositivos e sessões**
   - Digite "SecuraDocs API" como nome do dispositivo
   - Clique em **Criar nova senha de aplicativo**
   - **Copie a senha** (você só verá uma vez!)

4. **Criar a pasta de armazenamento:**
   - Vá em **Arquivos** (ícone de pasta, canto superior esquerdo)
   - Clique em **+** → **Nova pasta**
   - Nomeie como `SecuraDocs`

### Passo 4: Configurar a Aplicação

Atualize o arquivo `.env` com sua senha de aplicativo:

```bash
# Editar arquivo .env
nano .env  # ou use seu editor preferido
```

Altere esta linha:
```env
NEXTCLOUD_PASSWORD=your_app_password_here
```

### Passo 5: Adicionar Domínio Confiável do Nextcloud

```bash
docker exec -u www-data securdocs-nextcloud php occ config:system:set trusted_domains 2 --value=nextcloud
```

### Passo 6: Reiniciar a Aplicação

```bash
docker compose restart app
```

### Passo 7: Acessar SecuraDocs

Abra http://localhost:3000 e crie sua primeira conta de usuário!

---

## Credenciais Padrão

| Serviço | URL | Nome de Usuário | Senha |
|---------|-----|-----------------|-------|
| SecuraDocs | http://localhost:3000 | (crie o seu próprio) | - |
| Nextcloud | http://localhost:8080 | `admin` | `admin123` |
| PostgreSQL | localhost:5432 | `postgres` | `postgres_dev_password` |

## Solução de Problemas

### Erro "Table does not exist"
Execute as migrações do banco de dados:
```bash
docker compose exec app pnpm db:push
```

### Upload falha com erro 400
Certifique-se de que:
1. Criou a pasta `SecuraDocs` no Nextcloud
2. Adicionou a senha de aplicativo ao `.env`
3. Adicionou o domínio confiável:
   ```bash
   docker exec -u www-data securdocs-nextcloud php occ config:system:set trusted_domains 2 --value=nextcloud
   ```
4. Reiniciou a aplicação: `docker compose restart app`

### Verificar logs
```bash
# Todos os serviços
docker compose logs -f

# Apenas a aplicação
docker compose logs -f app

# Apenas Nextcloud
docker compose logs -f nextcloud
```

### Resetar tudo
```bash
docker compose down -v  # AVISO: Isso deleta todos os dados!
docker compose up -d
```

---

## Desenvolvimento

### Estrutura do Projeto

```
app/
  (app)/                # Rotas protegidas (requer autenticação)
    dashboard/
    files/
    audit/
  (auth)/               # Rotas de autenticação
    login/
    register/
  api/                  # Rotas da API
    auth/
    files/
    folders/
    permissions/
    share/
    audit/
lib/
  auth.ts               # Configuração Better Auth
  db/
    index.ts            # Instância Drizzle
    schema.ts           # Schemas do banco de dados
  storage/
    nextcloud.ts        # Cliente WebDAV do Nextcloud
  permissions/
    check.ts            # Validação de permissões
  audit/
    logger.ts           # Logging de auditoria
components/
  ui/                   # Componentes shadcn/ui
  files/                # Componentes de gerenciamento de arquivos
  auth/                 # Componentes de autenticação
```

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `docker compose up -d` | Iniciar todos os serviços |
| `docker compose logs -f app` | Ver logs da aplicação |
| `docker compose exec app pnpm db:push` | Executar migrações do banco de dados |
| `docker compose exec app pnpm db:studio` | Abrir Drizzle Studio |
| `docker compose restart app` | Reiniciar a aplicação |
| `docker compose down` | Parar todos os serviços |
| `./scripts/backup.sh` | Criar backup completo |
| `./scripts/restore.sh <file>` | Restaurar de backup |

### Variáveis de Ambiente

Variáveis principais no `.env`:

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NEXTCLOUD_PASSWORD` | Senha de aplicativo para API do Nextcloud | (obrigatório) |
| `AUTH_SECRET` | Segredo para assinar sessões | `dev_secret...` |
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação | `http://localhost:3000` |

### Testando com cURL

```bash
# Registrar um usuário
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

# Listar arquivos
curl http://localhost:3000/api/files -b cookies.txt

# Fazer upload de um arquivo (exemplo text/plain)
echo "Hello World" > test.txt
curl -X POST http://localhost:3000/api/files/upload \
  -b cookies.txt \
  -F "file=@test.txt;type=text/plain"

# Criar uma pasta
curl -X POST http://localhost:3000/api/folders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"My Folder"}'
```

---

## Backup e Restauração

O SecuraDocs inclui scripts para fazer backup e restaurar todos os dados (banco de dados, arquivos e configuração).

### Criar um Backup

```bash
./scripts/backup.sh
```

Isso cria um arquivo compactado em `./backups/` contendo:
- Dump do banco de dados PostgreSQL
- Todos os arquivos do Nextcloud
- Arquivos de configuração (`.env`, `docker-compose.yml`)

Exemplo de saída:
```
╔════════════════════════════════════════╗
║     Backup Complete!                   ║
╚════════════════════════════════════════╝

  📦 Arquivo: ./backups/securadocs_backup_20251128_184946.tar.gz
  📊 Tamanho: 401M
```

### Restaurar de Backup

```bash
./scripts/restore.sh ./backups/securadocs_backup_20251128_184946.tar.gz
```

⚠️ **Aviso:** Isso sobrescreverá todos os dados existentes!

### Backups Agendados (Cron)

Adicione ao crontab para backups diários às 2h da manhã:

```bash
# Editar crontab
crontab -e

# Adicione esta linha (ajuste o caminho conforme necessário)
0 2 * * * cd /path/to/securadocs && ./scripts/backup.sh >> /var/log/securadocs-backup.log 2>&1
```

### Backup para Armazenamento Remoto

Após criar um backup, você pode copiá-lo para armazenamento remoto:

```bash
# Para S3
aws s3 cp ./backups/securadocs_backup_*.tar.gz s3://your-bucket/backups/

# Para outro servidor via SCP
scp ./backups/securadocs_backup_*.tar.gz user@remote-server:/backups/

# Para Google Drive (usando rclone)
rclone copy ./backups/ gdrive:SecuraDocs/backups/
```

---

## Deploy em Produção

Para produção, atualize estes valores no `.env`:

```env
# Gerar um segredo seguro
AUTH_SECRET=$(openssl rand -base64 32)

# Use seu domínio
NEXT_PUBLIC_APP_URL=https://docs.yourdomain.com

# Use senhas fortes
POSTGRES_PASSWORD=your_secure_password
NEXTCLOUD_ADMIN_PASSWORD=your_secure_password
```

Execute com Dockerfile de produção:
```bash
DOCKERFILE=Dockerfile docker compose up -d --build
```

Veja [MIGRATION_SELF_HOSTED.md](../en/MIGRATION_SELF_HOSTED.md) para guia detalhado de deploy em produção.

---

## Arquitetura

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

## Documentação

- **[PRD.md](../en/PRD.md)** - Documento de Requisitos do Produto
- **[TECH_SPECS.md](../en/TECH_SPECS.md)** - Especificações Técnicas
- **[PLAN.md](../en/PLAN.md)** - Plano de Desenvolvimento
- **[MIGRATION_SELF_HOSTED.md](../en/MIGRATION_SELF_HOSTED.md)** - Guia de Migração Self-Hosted

## Contribuindo

Contribuições são bem-vindas! Este projeto foi projetado para empoderar organizações com soberania de dados.

1. Faça um fork do repositório
2. Crie uma branch de funcionalidade (`git checkout -b feature/amazing-feature`)
3. Faça commit das suas mudanças (`git commit -m 'Add amazing feature'`)
4. Envie para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## Licença

[A ser definida]

---

**Status:** MVP em desenvolvimento ativo. Veja [PLAN.md](../en/PLAN.md) para progresso atual.
