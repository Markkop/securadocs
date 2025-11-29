# Expose SecuraDocs via Public URL

Use Cloudflare Tunnel to share your local development environment with testers.

## Prerequisites

```bash
# macOS
brew install cloudflared

# Linux
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/

# Windows
winget install cloudflare.cloudflared
```

## Quick Start

```bash
# 1. Start services
docker compose up -d

# 2. Create tunnel (run in separate terminal)
cloudflared tunnel --url http://localhost:3000
```

Copy the generated URL (e.g., `https://random-words.trycloudflare.com`) and share it with testers.

## With Proper App URL Configuration

For authentication and redirects to work correctly:

```bash
# 1. Start the tunnel first to get the URL
cloudflared tunnel --url http://localhost:3000

# 2. In another terminal, restart app with the tunnel URL
NEXT_PUBLIC_APP_URL=https://your-tunnel-url.trycloudflare.com docker compose up -d app
```

## Notes

- Tunnel URL changes each time you restart `cloudflared`
- Free, no account required
- HTTPS enabled automatically
- Tunnel closes when you stop the `cloudflared` process (Ctrl+C)
