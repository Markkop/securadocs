# MIGRATION_SELF_HOSTED.md — Guia de Deploy Self-Hosted com Nextcloud

## 1. Metadados

- **Nome do projeto:** SecuraDocs
- **Versão do documento:** v0.2
- **Data:** 2025-01-10
- **Última atualização:** 2025-11-28 (Nextcloud Integration)
- **Autor(es):** Equipe SecuraDocs
- **Status:** Aprovado

---

## 2. Visão Geral

Este documento descreve o processo de deploy do SecuraDocs em infraestrutura self-hosted utilizando **Nextcloud** como backend de armazenamento, garantindo soberania total sobre dados e infraestrutura unificada.

### 2.1 Objetivos

- Deploy completo self-hosted com Docker Compose
- PostgreSQL compartilhado entre SecuraDocs e Nextcloud
- Armazenamento de arquivos via Nextcloud WebDAV API
- Interface web unificada com reverse proxy Nginx
- SSL/HTTPS com Let's Encrypt

### 2.2 Por que Nextcloud?

- **Soberania de dados:** Controle total sobre onde os arquivos são armazenados
- **Interface web:** Acesso direto aos arquivos via browser
- **Apps mobile/desktop:** Sincronização nativa com clientes Nextcloud
- **Versionamento:** Histórico de versões de arquivos built-in
- **Compartilhamento:** Sistema de compartilhamento robusto (pode ser integrado futuramente)
- **Comunidade:** Software maduro com grande comunidade e documentação

### 2.3 Pré-requisitos

- Servidor/VPS com:
  - Mínimo 2GB RAM (recomendado: 4GB+)
  - 20GB+ de espaço em disco (dependendo do volume de arquivos)
  - Docker e Docker Compose instalados
  - Acesso root ou sudo
- Domínio configurado (opcional para desenvolvimento, recomendado para produção)
- Certificado SSL (Let's Encrypt via Certbot) para produção

---

## 3. Arquitetura Self-Hosted

### 3.1 Componentes

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Servidor/VPS Self-Hosted                          │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Nginx (Reverse Proxy + SSL)                                   │ │
│  │  - Porta: 80, 443 (externa)                                    │ │
│  │  - SSL/TLS termination com Let's Encrypt                       │ │
│  │  - Routes:                                                      │ │
│  │    • docs.dominio.com → SecuraDocs (porta 3000)                │ │
│  │    • cloud.dominio.com → Nextcloud (porta 80)                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│         ┌────────────────────┼────────────────────┐                 │
│         │                    │                    │                 │
│  ┌──────▼──────────┐  ┌──────▼──────────┐  ┌──────▼──────────┐     │
│  │  SecuraDocs     │  │  Nextcloud      │  │  PostgreSQL     │     │
│  │  (Next.js)      │  │  (Apache)       │  │  16-alpine      │     │
│  │                 │  │                 │  │                 │     │
│  │  Porta: 3000    │  │  Porta: 80      │  │  Porta: 5432    │     │
│  │  (interna)      │  │  (interna)      │  │  (interna)      │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│         │                    │                    │                 │
│         │                    │                    │                 │
│         │  WebDAV API        │                    │                 │
│         │◄───────────────────┤                    │                 │
│         │                    │                    │                 │
│         └────────────────────┴────────────────────┘                 │
│                              │                                       │
│  ┌───────────────────────────▼────────────────────────────────────┐ │
│  │  Volumes Persistentes                                          │ │
│  │  - postgres_data: /var/lib/postgresql/data                     │ │
│  │  - nextcloud_data: /var/www/html (app + arquivos)              │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 Fluxo de Dados

```
Usuário
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
    │◄────────┤ (upload/download de arquivos)
    │         │
    ▼         ▼
┌─────────────────┐
│   PostgreSQL    │
│ ┌─────┐ ┌─────┐ │
│ │ sd  │ │ nc  │ │ (databases separados)
│ └─────┘ └─────┘ │
└─────────────────┘
```

---

## 4. Docker Compose Setup

### 4.1 Arquivo `docker-compose.yml`

Crie um arquivo `docker-compose.yml` na raiz do projeto:

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
      - "127.0.0.1:5432:5432"  # Apenas localhost
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

### 4.2 Arquivo `.env` para Docker

Crie um arquivo `.env` (não commitar no git):

```bash
# Domain
DOMAIN=seudominio.com

# PostgreSQL Master
POSTGRES_PASSWORD=senha_master_muito_segura

# Nextcloud Database
NEXTCLOUD_DB_PASSWORD=senha_nextcloud_db_segura

# Nextcloud Admin
NEXTCLOUD_ADMIN_PASSWORD=senha_admin_nextcloud_segura

# Nextcloud App Password (gerar após setup inicial do Nextcloud)
NEXTCLOUD_APP_PASSWORD=gerar_no_nextcloud_depois

# SecuraDocs Database
SECURDOCS_DB_PASSWORD=senha_securdocs_db_segura

# SecuraDocs Auth
AUTH_SECRET=gerar_com_openssl_rand_base64_32

# Ambiente
NODE_ENV=production
```

**Para gerar senhas seguras:**
```bash
# Gerar AUTH_SECRET
openssl rand -base64 32

# Gerar senhas de database
openssl rand -hex 16
```

### 4.3 Script de Inicialização do Banco (`init-db.sql`)

Crie um arquivo `init-db.sql` na raiz do projeto:

```sql
-- Este script é executado automaticamente na primeira inicialização do PostgreSQL

-- Criar databases
CREATE DATABASE nextcloud;
CREATE DATABASE securdocs;

-- Criar usuários
CREATE USER nextcloud WITH ENCRYPTED PASSWORD 'senha_nextcloud_db_segura';
CREATE USER securdocs WITH ENCRYPTED PASSWORD 'senha_securdocs_db_segura';

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE nextcloud TO nextcloud;
GRANT ALL PRIVILEGES ON DATABASE securdocs TO securdocs;

-- Configurações adicionais para Nextcloud
\c nextcloud
GRANT ALL ON SCHEMA public TO nextcloud;

-- Configurações adicionais para SecuraDocs
\c securdocs
GRANT ALL ON SCHEMA public TO securdocs;
```

**Importante:** Atualize as senhas no script para corresponder às variáveis do `.env`.

### 4.4 Dockerfile

Crie um `Dockerfile` na raiz:

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

**Nota:** Para usar `standalone` output, adicione ao `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  // ... outras configurações
};
```

### 4.5 Configuração Nginx

Crie `nginx/nginx.conf`:

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

        # Nextcloud específico - tamanho de upload maior
        client_max_body_size 512M;
        
        # Timeouts para uploads grandes
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
    }
}
```

**Nota:** Para desenvolvimento local sem SSL, você pode criar uma versão simplificada:

```nginx
# nginx/nginx-dev.conf (sem SSL)
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

## 5. Processo de Deploy

### 5.1 Fase 1: Preparação do Ambiente

1. **Provisionar servidor/VPS**
   ```bash
   # Instalar Docker e Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # Relogar para aplicar grupo docker
   # logout e login novamente, ou:
   newgrp docker
   ```

2. **Configurar domínio e SSL** (para produção)
   ```bash
   # Instalar Certbot
   sudo apt update
   sudo apt install certbot
   
   # Obter certificados (ajuste os domínios)
   sudo certbot certonly --standalone \
     -d docs.seu-dominio.com \
     -d cloud.seu-dominio.com
   ```

3. **Clonar repositório e criar estrutura**
   ```bash
   git clone https://github.com/seu-org/securdocs.git
   cd securdocs
   
   # Criar diretórios necessários
   mkdir -p nginx/{ssl,logs}
   
   # Copiar certificados (se usando SSL)
   sudo cp /etc/letsencrypt/live/docs.seu-dominio.com/fullchain.pem nginx/ssl/
   sudo cp /etc/letsencrypt/live/docs.seu-dominio.com/privkey.pem nginx/ssl/
   ```

4. **Configurar variáveis de ambiente**
   ```bash
   cp .env.example .env
   
   # Editar .env com suas configurações
   nano .env
   
   # Gerar AUTH_SECRET
   echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env
   ```

### 5.2 Fase 2: Iniciar Infraestrutura Base

1. **Iniciar PostgreSQL e Nextcloud**
   ```bash
   # Subir apenas o banco e Nextcloud primeiro
   docker compose up -d postgres
   
   # Aguardar PostgreSQL ficar saudável
   docker compose logs -f postgres
   # Ctrl+C quando ver "database system is ready to accept connections"
   
   # Subir Nextcloud
   docker compose up -d nextcloud
   
   # Aguardar Nextcloud inicializar (pode levar alguns minutos na primeira vez)
   docker compose logs -f nextcloud
   ```

2. **Acessar e configurar Nextcloud**
   ```bash
   # Se em desenvolvimento local:
   # Acesse http://localhost:8080
   
   # Se em produção com SSL:
   # Acesse https://cloud.seu-dominio.com
   ```

3. **Criar usuário técnico `securadocs` no Nextcloud**
   
   Via interface web:
   - Login como admin (usuário configurado em `NEXTCLOUD_ADMIN_USER`)
   - Vá em **Usuários** (ícone de engrenagem → Usuários)
   - Clique em **Novo usuário**
   - Username: `securadocs`
   - Senha: uma senha forte (você vai substituir por app password)
   - Clique em **Criar**

4. **Gerar App Password para o SecuraDocs**
   
   - Faça logout do admin e login como `securadocs`
   - Vá em **Configurações** → **Segurança**
   - Em "Dispositivos e sessões", digite um nome: `SecuraDocs API`
   - Clique em **Criar nova senha de aplicativo**
   - **COPIE A SENHA GERADA** (ela não será mostrada novamente!)
   - Atualize `NEXTCLOUD_APP_PASSWORD` no seu `.env`

5. **Criar diretório base no Nextcloud**
   
   - Ainda logado como `securadocs`
   - Crie uma pasta chamada `SecuraDocs` (será o diretório raiz dos arquivos)

### 5.3 Fase 3: Migração do Banco de Dados (se vindo do NeonDB)

Se você está migrando de uma instalação existente com NeonDB:

1. **Fazer dump do NeonDB**
   ```bash
   # Instalar PostgreSQL client se necessário
   sudo apt install postgresql-client
   
   # Fazer dump
   pg_dump "postgresql://user:password@neon-host/database" > backup.sql
   ```

2. **Restaurar dump no PostgreSQL self-hosted**
   ```bash
   # Copiar backup para o container
   docker cp backup.sql securdocs-postgres:/tmp/
   
   # Restaurar no database securdocs
   docker exec -it securdocs-postgres psql -U securdocs -d securdocs -f /tmp/backup.sql
   ```

3. **Validar migração**
   ```bash
   docker exec -it securdocs-postgres psql -U securdocs -d securdocs -c "SELECT COUNT(*) FROM users;"
   docker exec -it securdocs-postgres psql -U securdocs -d securdocs -c "SELECT COUNT(*) FROM files;"
   ```

### 5.4 Fase 4: Migração dos Arquivos (Supabase Storage → Nextcloud)

Se você está migrando de uma instalação existente com Supabase Storage:

**Script Node.js de migração:**

```typescript
// scripts/migrate-files-supabase-to-nextcloud.ts
import { createClient } from '@supabase/supabase-js';
import { createClient as createWebDAVClient } from 'webdav';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';

// Supabase (origem)
const supabase = createClient(
  process.env.SOURCE_SUPABASE_URL!,
  process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY!
);

// Nextcloud WebDAV (destino)
const nextcloud = createWebDAVClient(
  `${process.env.NEXTCLOUD_URL}${process.env.NEXTCLOUD_WEBDAV_PATH}`,
  {
    username: process.env.NEXTCLOUD_USER!,
    password: process.env.NEXTCLOUD_PASSWORD!,
  }
);

async function migrateFiles() {
  // Buscar todos os arquivos do banco
  const allFiles = await db.select().from(files);
  
  console.log(`Migrando ${allFiles.length} arquivos...`);
  
  // Criar diretório base
  try {
    await nextcloud.createDirectory('/SecuraDocs', { recursive: true });
  } catch (e) {
    // Diretório pode já existir
  }
  
  for (const file of allFiles) {
    try {
      // Download do Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('securdocs-files')
        .download(file.storagePath);
      
      if (downloadError) {
        console.error(`Erro ao baixar ${file.storagePath}:`, downloadError);
        continue;
      }
      
      // Converter Blob para Buffer
      const buffer = Buffer.from(await fileData.arrayBuffer());
      
      // Upload para Nextcloud via WebDAV
      const nextcloudPath = `/SecuraDocs/${file.storagePath}`;
      
      // Criar diretórios pai se necessário
      const parentDir = nextcloudPath.substring(0, nextcloudPath.lastIndexOf('/'));
      try {
        await nextcloud.createDirectory(parentDir, { recursive: true });
      } catch (e) {
        // Pode já existir
      }
      
      await nextcloud.putFileContents(nextcloudPath, buffer, {
        contentLength: buffer.length,
      });
      
      console.log(`✓ Migrado: ${file.name}`);
    } catch (error) {
      console.error(`Erro ao migrar ${file.name}:`, error);
    }
  }
  
  console.log('Migração concluída!');
}

migrateFiles();
```

**Para executar:**
```bash
# Configurar variáveis de ambiente de origem
export SOURCE_SUPABASE_URL=https://xxx.supabase.co
export SOURCE_SUPABASE_SERVICE_ROLE_KEY=xxx

# Executar script
npx tsx scripts/migrate-files-supabase-to-nextcloud.ts
```

### 5.5 Fase 5: Deploy da Aplicação SecuraDocs

1. **Build e iniciar SecuraDocs**
   ```bash
   # Fazer build da aplicação
   docker compose build app
   
   # Iniciar todos os serviços
   docker compose up -d
   
   # Verificar status
   docker compose ps
   ```

2. **Executar migrations do Drizzle**
   ```bash
   # Se é uma nova instalação
   docker compose exec app pnpm db:push
   
   # Se migrou dados do NeonDB, as tabelas já existem
   ```

3. **Verificar conectividade com Nextcloud**
   ```bash
   # Testar WebDAV de dentro do container
   docker compose exec app curl -u securadocs:SUA_APP_PASSWORD \
     http://nextcloud/remote.php/dav/files/securadocs/
   ```

### 5.6 Fase 6: Validação e Testes

1. **Testes funcionais básicos**
   - [ ] Acessar SecuraDocs: `https://docs.seu-dominio.com`
   - [ ] Registrar novo usuário
   - [ ] Login/logout
   - [ ] Upload de arquivo
   - [ ] Download de arquivo
   - [ ] Criar pasta
   - [ ] Compartilhar arquivo
   - [ ] Verificar logs de auditoria

2. **Verificar arquivos no Nextcloud**
   - Acessar `https://cloud.seu-dominio.com`
   - Login como `securadocs`
   - Verificar se arquivos aparecem na pasta `SecuraDocs`

3. **Monitoramento**
   ```bash
   # Ver logs de todos os serviços
   docker compose logs -f
   
   # Ver logs de um serviço específico
   docker compose logs -f app
   docker compose logs -f nextcloud
   
   # Monitorar uso de recursos
   docker stats
   ```

4. **Verificar saúde dos serviços**
   ```bash
   # Verificar containers rodando
   docker compose ps
   
   # Verificar conectividade do banco
   docker compose exec postgres pg_isready -U postgres
   ```

---

## 6. Backup e Restore

### 6.1 Backup do Banco de Dados

Criar script `scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups/db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup do banco SecuraDocs
docker exec securdocs-postgres pg_dump -U securdocs securdocs > "$BACKUP_DIR/securdocs_$TIMESTAMP.sql"

# Backup do banco Nextcloud (opcional, recomendado)
docker exec securdocs-postgres pg_dump -U nextcloud nextcloud > "$BACKUP_DIR/nextcloud_$TIMESTAMP.sql"

# Comprimir
gzip "$BACKUP_DIR/securdocs_$TIMESTAMP.sql"
gzip "$BACKUP_DIR/nextcloud_$TIMESTAMP.sql"

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup de bancos criado em $BACKUP_DIR"
```

### 6.2 Backup dos Arquivos (Nextcloud)

Criar script `scripts/backup-files.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups/files"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Parar Nextcloud temporariamente para backup consistente (opcional)
# docker compose stop nextcloud

# Backup do volume Nextcloud
docker run --rm \
  -v securdocs_nextcloud_data:/source:ro \
  -v $(pwd)/backups/files:/backup \
  alpine tar czf /backup/nextcloud_data_$TIMESTAMP.tar.gz -C /source .

# Reiniciar Nextcloud (se parou)
# docker compose start nextcloud

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "nextcloud_data_*.tar.gz" -mtime +7 -delete

echo "Backup de arquivos criado: $BACKUP_DIR/nextcloud_data_$TIMESTAMP.tar.gz"
```

### 6.3 Restore do Banco de Dados

```bash
# Restaurar banco SecuraDocs
gunzip -c backups/db/securdocs_TIMESTAMP.sql.gz | \
  docker exec -i securdocs-postgres psql -U securdocs -d securdocs

# Restaurar banco Nextcloud (se necessário)
gunzip -c backups/db/nextcloud_TIMESTAMP.sql.gz | \
  docker exec -i securdocs-postgres psql -U nextcloud -d nextcloud
```

### 6.4 Restore dos Arquivos

```bash
# Parar Nextcloud
docker compose stop nextcloud

# Restaurar volume
docker run --rm \
  -v securdocs_nextcloud_data:/target \
  -v $(pwd)/backups/files:/backup \
  alpine sh -c "rm -rf /target/* && tar xzf /backup/nextcloud_data_TIMESTAMP.tar.gz -C /target"

# Reiniciar Nextcloud
docker compose start nextcloud
```

### 6.3 Automatizar Backups

Adicionar ao crontab (`crontab -e`):

```cron
# Backup diário do banco às 2h da manhã
0 2 * * * /caminho/para/securdocs/scripts/backup-db.sh

# Backup diário de arquivos às 3h da manhã
0 3 * * * /caminho/para/securdocs/scripts/backup-files.sh
```

---

## 7. Manutenção e Atualizações

### 7.1 Atualizar Aplicação

```bash
# Pull das mudanças
git pull origin main

# Rebuild e restart
docker-compose build app
docker-compose up -d app
```

### 7.2 Atualizar Dependências do Sistema

```bash
# Atualizar imagens Docker
docker-compose pull
docker-compose up -d

# Limpar imagens antigas
docker image prune -a
```

### 7.3 Renovar Certificado SSL

```bash
# Certbot renova automaticamente, mas pode forçar:
sudo certbot renew --dry-run
```

---

## 8. Troubleshooting

### 8.1 Problemas Comuns

**PostgreSQL não inicia:**
```bash
# Verificar logs
docker-compose logs postgres

# Verificar permissões do volume
sudo chown -R 999:999 data/postgres
```

**Nextcloud não acessível:**
```bash
# Verificar logs
docker-compose logs nextcloud

# Verificar se o serviço está rodando
docker-compose ps nextcloud
```

**Aplicação não conecta ao banco:**
```bash
# Verificar DATABASE_URL no .env
# Testar conexão manualmente
docker exec -it securdocs-postgres psql -U securdocs -d securdocs
```

### 8.2 Logs e Monitoramento

```bash
# Ver todos os logs
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs -f app

# Ver uso de recursos
docker stats
```

---

## 9. Checklist de Deploy

### 9.1 Preparação
- [ ] Servidor provisionado com Docker instalado
- [ ] Domínio(s) configurado(s) (docs.dominio.com, cloud.dominio.com)
- [ ] Certificados SSL obtidos (Let's Encrypt)
- [ ] Repositório clonado no servidor
- [ ] Arquivos de configuração criados (.env, init-db.sql, nginx.conf)

### 9.2 Infraestrutura
- [ ] PostgreSQL iniciado e saudável
- [ ] Nextcloud iniciado e acessível
- [ ] Usuário técnico `securadocs` criado no Nextcloud
- [ ] App password gerado e configurado no .env
- [ ] Diretório `SecuraDocs` criado no Nextcloud

### 9.3 Aplicação
- [ ] SecuraDocs buildado e iniciado
- [ ] Migrations do Drizzle executadas
- [ ] Conectividade com Nextcloud WebDAV testada
- [ ] Nginx configurado com SSL

### 9.4 Migração (se aplicável)
- [ ] Backup do NeonDB realizado
- [ ] Dump restaurado no PostgreSQL self-hosted
- [ ] Arquivos migrados do Supabase Storage para Nextcloud
- [ ] Dados validados (contagem de registros e arquivos)

### 9.5 Validação
- [ ] Login/registro funcionando
- [ ] Upload de arquivo funcionando
- [ ] Download de arquivo funcionando
- [ ] Arquivos visíveis no Nextcloud
- [ ] Compartilhamento funcionando
- [ ] Logs de auditoria funcionando

### 9.6 Produção
- [ ] DNS atualizado para apontar aos novos IPs
- [ ] Backups automatizados configurados
- [ ] Monitoramento configurado
- [ ] Documentação interna atualizada

---

## 10. Próximos Passos Após Migração

- [ ] Configurar monitoramento avançado (Prometheus, Grafana - opcional)
- [ ] Implementar alertas (ex: serviço fora do ar, disco cheio)
- [ ] Documentar procedimentos de recuperação de desastre
- [ ] Treinar equipe em manutenção básica
- [ ] Estabelecer rotina de atualizações de segurança

---

## 11. Referências

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Nextcloud Docker Image](https://hub.docker.com/_/nextcloud)
- [Nextcloud Admin Manual](https://docs.nextcloud.com/server/stable/admin_manual/)
- [Nextcloud WebDAV API](https://docs.nextcloud.com/server/stable/developer_manual/client_apis/WebDAV/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt / Certbot](https://certbot.eff.org/)

### Recursos Adicionais

- [Nextcloud All-in-One (AIO)](https://github.com/nextcloud/all-in-one) - Alternativa simplificada
- [webdav npm package](https://www.npmjs.com/package/webdav) - Cliente WebDAV para Node.js

