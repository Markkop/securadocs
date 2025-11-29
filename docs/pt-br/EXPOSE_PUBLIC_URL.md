# Expor SecuraDocs via URL Pública

Use Cloudflare Tunnel para compartilhar seu ambiente de desenvolvimento local com testadores.

## Pré-requisitos

```bash
# macOS
brew install cloudflared

# Linux
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/

# Windows
winget install cloudflare.cloudflared
```

## Início Rápido

```bash
# 1. Iniciar serviços
docker compose up -d

# 2. Criar túnel (execute em terminal separado)
cloudflared tunnel --url http://localhost:3000
```

Copie a URL gerada (ex: `https://random-words.trycloudflare.com`) e compartilhe com testadores.

## Com Configuração Adequada de URL da Aplicação

Para que autenticação e redirecionamentos funcionem corretamente:

```bash
# 1. Iniciar o túnel primeiro para obter a URL
cloudflared tunnel --url http://localhost:3000

# 2. Em outro terminal, reiniciar aplicação com a URL do túnel
NEXT_PUBLIC_APP_URL=https://your-tunnel-url.trycloudflare.com docker compose up -d app
```

## Notas

- A URL do túnel muda cada vez que você reinicia o `cloudflared`
- Gratuito, sem necessidade de conta
- HTTPS habilitado automaticamente
- O túnel fecha quando você para o processo `cloudflared` (Ctrl+C)
