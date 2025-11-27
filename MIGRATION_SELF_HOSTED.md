# MIGRATION_SELF_HOSTED.md — Guia de Migração para Self-Hosted

## 1. Metadados

- **Nome do projeto:** SecuraDocs
- **Versão do documento:** v0.1
- **Data:** 2025-01-10
- **Autor(es):** Equipe SecuraDocs
- **Status:** Aprovado

---

## 2. Visão Geral

Este documento descreve o processo de migração do SecuraDocs de uma infraestrutura gerenciada (NeonDB + Supabase Storage) para uma infraestrutura self-hosted completa, garantindo soberania total sobre dados e infraestrutura.

### 2.1 Objetivos da Migração

- Migrar banco de dados PostgreSQL do NeonDB para instância self-hosted.
- Migrar arquivos do Supabase Storage para MinIO self-hosted.
- Manter zero downtime durante a migração (quando possível).
- Garantir integridade dos dados durante o processo.

### 2.2 Pré-requisitos

- Servidor/VPS com:
  - Mínimo 2GB RAM (recomendado: 4GB+)
  - 20GB+ de espaço em disco (dependendo do volume de arquivos)
  - Docker e Docker Compose instalados
  - Acesso root ou sudo
- Domínio configurado (opcional, mas recomendado)
- Certificado SSL (Let's Encrypt via Certbot)

---

## 3. Arquitetura Self-Hosted

### 3.1 Componentes

```
┌─────────────────────────────────────────────────────────┐
│              Servidor/VPS Self-Hosted                   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Next.js App (Docker Container)                 │  │
│  │  - Porta: 3000 (interna)                        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  PostgreSQL (Docker Container)                   │  │
│  │  - Porta: 5432 (interna)                        │  │
│  │  - Volume: ./data/postgres                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  MinIO (Docker Container)                       │  │
│  │  - Porta: 9000 (API), 9001 (Console)           │  │
│  │  - Volume: ./data/minio                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Nginx (Reverse Proxy)                          │  │
│  │  - Porta: 80, 443                               │  │
│  │  - SSL/TLS termination                          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
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
      POSTGRES_USER: securdocs
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: securdocs
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"  # Apenas localhost
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U securdocs"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: securdocs-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - ./data/minio:/data
    ports:
      - "127.0.0.1:9000:9000"  # API
      - "127.0.0.1:9001:9001"  # Console
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: securdocs-app
    environment:
      DATABASE_URL: postgresql://securdocs:${POSTGRES_PASSWORD}@postgres:5432/securdocs
      AUTH_SECRET: ${AUTH_SECRET}
      MINIO_ENDPOINT: http://minio:9000
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
      MINIO_BUCKET_NAME: securdocs-files
      NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_healthy
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
    restart: unless-stopped
```

### 4.2 Arquivo `.env` para Docker

Crie um arquivo `.env` (não commitar no git):

```bash
# PostgreSQL
POSTGRES_PASSWORD=seu_password_seguro_aqui

# MinIO
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=seu_password_minio_seguro_aqui

# App
AUTH_SECRET=seu_secret_aleatorio_aqui
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# Opcional: outras variáveis
NODE_ENV=production
```

### 4.3 Dockerfile

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

### 4.4 Configuração Nginx

Crie `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name seu-dominio.com www.seu-dominio.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name seu-dominio.com www.seu-dominio.com;

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

        # Proxy settings
        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Max upload size (ajuste conforme necessário)
        client_max_body_size 100M;
    }
}
```

---

## 5. Processo de Migração

### 5.1 Fase 1: Preparação do Ambiente Self-Hosted

1. **Provisionar servidor/VPS**
   ```bash
   # Instalar Docker e Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # Instalar Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Configurar domínio e SSL**
   ```bash
   # Instalar Certbot
   sudo apt update
   sudo apt install certbot python3-certbot-nginx
   
   # Obter certificado (ajuste domínio)
   sudo certbot certonly --standalone -d seu-dominio.com -d www.seu-dominio.com
   ```

3. **Criar estrutura de diretórios**
   ```bash
   mkdir -p securdocs/{data/postgres,data/minio,nginx/ssl,nginx/logs}
   cd securdocs
   ```

4. **Copiar arquivos de configuração**
   - Copiar `docker-compose.yml`, `Dockerfile`, `.env`, `nginx/nginx.conf`
   - Copiar certificados SSL para `nginx/ssl/`

### 5.2 Fase 2: Migração do Banco de Dados

1. **Fazer dump do NeonDB**
   ```bash
   # Instalar PostgreSQL client se necessário
   sudo apt install postgresql-client
   
   # Fazer dump
   pg_dump "postgresql://user:password@neon-host/database" > backup.sql
   ```

2. **Iniciar PostgreSQL self-hosted**
   ```bash
   docker-compose up -d postgres
   # Aguardar healthcheck passar
   ```

3. **Restaurar dump**
   ```bash
   # Copiar backup.sql para o servidor
   docker cp backup.sql securdocs-postgres:/tmp/
   
   # Restaurar
   docker exec -i securdocs-postgres psql -U securdocs -d securdocs < backup.sql
   ```

4. **Validar migração**
   ```bash
   docker exec -it securdocs-postgres psql -U securdocs -d securdocs -c "SELECT COUNT(*) FROM users;"
   docker exec -it securdocs-postgres psql -U securdocs -d securdocs -c "SELECT COUNT(*) FROM files;"
   ```

### 5.3 Fase 3: Migração dos Arquivos (Supabase Storage → MinIO)

1. **Configurar MinIO self-hosted**
   ```bash
   docker-compose up -d minio
   # Acessar console em http://seu-servidor:9001
   # Criar bucket "securdocs-files"
   ```

2. **Migrar arquivos do Supabase Storage para MinIO self-hosted**

   Script Node.js de migração (recomendado):
   ```typescript
   // scripts/migrate-files-supabase-to-minio.ts
   import { createClient } from '@supabase/supabase-js';
   import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
   import { db } from '@/lib/db';
   import { files } from '@/lib/db/schema';
   
   const supabase = createClient(
     process.env.SOURCE_SUPABASE_URL!,
     process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY!
   );
   
   const minioClient = new S3Client({
     endpoint: process.env.DEST_MINIO_ENDPOINT,
     region: "us-east-1",
     credentials: {
       accessKeyId: process.env.DEST_MINIO_ACCESS_KEY!,
       secretAccessKey: process.env.DEST_MINIO_SECRET_KEY!,
     },
     forcePathStyle: true,
   });
   
   async function migrateFiles() {
     // Buscar todos os arquivos do banco
     const allFiles = await db.select().from(files);
     
     console.log(`Migrando ${allFiles.length} arquivos...`);
     
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
         
         // Upload para MinIO
         await minioClient.send(new PutObjectCommand({
           Bucket: 'securdocs-files',
           Key: file.storagePath,
           Body: buffer,
           ContentType: file.mimeType || 'application/octet-stream',
         }));
         
         console.log(`✓ Migrado: ${file.name}`);
       } catch (error) {
         console.error(`Erro ao migrar ${file.name}:`, error);
       }
     }
     
     console.log('Migração concluída!');
   }
   
   migrateFiles();
   ```

   Alternativa: Usar `mc` (MinIO Client) com Supabase Storage via S3 API
   ```bash
   # Nota: Supabase Storage não expõe diretamente API S3 compatível
   # Use o script Node.js acima ou migre via código
   ```

3. **Validar migração**
   ```bash
   # Comparar contagem de objetos
   mc ls dest/securdocs-files --recursive | wc -l
   
   # Validar alguns arquivos manualmente
   # Comparar tamanhos e checksums se necessário
   ```

### 5.4 Fase 4: Deploy da Aplicação

1. **Build e deploy**
   ```bash
   # Clonar repositório no servidor
   git clone https://github.com/seu-org/securdocs.git
   cd securdocs
   
   # Configurar .env com novas URLs
   cp .env.example .env
   # Editar .env com DATABASE_URL=self-hosted, MINIO_ENDPOINT=self-hosted
   # Remover variáveis do Supabase Storage e adicionar variáveis do MinIO
   
   # Build e iniciar
   docker-compose build
   docker-compose up -d
   ```

2. **Executar migrations (se necessário)**
   ```bash
   docker exec -it securdocs-app pnpm drizzle-kit migrate
   ```

3. **Configurar Nginx e SSL**
   ```bash
   # Copiar certificados
   sudo cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem nginx/ssl/
   sudo cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem nginx/ssl/
   
   # Reiniciar nginx
   docker-compose restart nginx
   ```

### 5.5 Fase 5: Validação e Cutover

1. **Testes funcionais**
   - Login/logout
   - Upload/download de arquivo
   - Compartilhamento
   - Verificar logs de auditoria

2. **Atualizar DNS** (se necessário)
   - Apontar domínio para IP do servidor self-hosted

3. **Monitoramento pós-migração**
   - Verificar logs: `docker-compose logs -f`
   - Monitorar uso de recursos: `docker stats`
   - Validar backups automáticos

---

## 6. Backup e Restore

### 6.1 Backup do Banco de Dados

Criar script `scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

docker exec securdocs-postgres pg_dump -U securdocs securdocs > $BACKUP_FILE

# Comprimir
gzip $BACKUP_FILE

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup criado: $BACKUP_FILE.gz"
```

### 6.2 Backup dos Arquivos (MinIO)

Criar script `scripts/backup-files.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups/files"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Usar mc para fazer backup do MinIO self-hosted
mc mirror dest/securdocs-files $BACKUP_DIR/files_$TIMESTAMP

# Comprimir
tar -czf $BACKUP_DIR/files_$TIMESTAMP.tar.gz $BACKUP_DIR/files_$TIMESTAMP
rm -rf $BACKUP_DIR/files_$TIMESTAMP

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "files_*.tar.gz" -mtime +7 -delete

echo "Backup de arquivos criado: $BACKUP_DIR/files_$TIMESTAMP.tar.gz"
```

**Nota:** Se ainda estiver usando Supabase Storage (antes da migração), use o script Node.js para fazer backup via API do Supabase.

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

**MinIO não acessível:**
```bash
# Verificar logs
docker-compose logs minio

# Verificar se bucket existe
mc ls dest/
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

## 9. Checklist de Migração

- [ ] Servidor provisionado com Docker instalado
- [ ] Domínio configurado e SSL obtido
- [ ] Estrutura de diretórios criada
- [ ] Arquivos de configuração copiados (docker-compose.yml, Dockerfile, nginx.conf)
- [ ] Backup do NeonDB realizado
- [ ] PostgreSQL self-hosted iniciado e saudável
- [ ] Dump do NeonDB restaurado no PostgreSQL self-hosted
- [ ] Dados validados (contagem de registros)
- [ ] MinIO self-hosted iniciado e bucket criado
- [ ] Arquivos migrados do Supabase Storage para MinIO self-hosted
- [ ] Arquivos validados (contagem de objetos)
- [ ] Aplicação buildada e deployada
- [ ] Migrations executadas (se necessário)
- [ ] Nginx configurado e SSL funcionando
- [ ] Testes funcionais realizados
- [ ] DNS atualizado (se necessário)
- [ ] Backups automatizados configurados
- [ ] Monitoramento configurado
- [ ] Documentação atualizada com novas URLs/credenciais

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
- [MinIO Docker Image](https://hub.docker.com/r/minio/minio)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt / Certbot](https://certbot.eff.org/)

