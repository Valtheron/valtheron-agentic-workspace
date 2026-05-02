# Deployment-Handbuch — Valtheron Agentic Workspace

**Version:** 1.0.0
**Datum:** Februar 2026

---

## Inhaltsverzeichnis

1. [Deployment-Übersicht](#1-deployment-uebersicht)
2. [Lokale Installation](#2-lokale-installation)
3. [Docker-Deployment](#3-docker-deployment)
4. [Produktions-Deployment](#4-produktions-deployment)
5. [Reverse-Proxy-Konfiguration](#5-reverse-proxy-konfiguration)
6. [SSL/TLS-Konfiguration](#6-ssltls-konfiguration)
7. [Process-Management](#7-process-management)
8. [CI/CD-Pipeline](#8-cicd-pipeline)
9. [Monitoring in Produktion](#9-monitoring-in-produktion)
10. [Rollback-Strategie](#10-rollback-strategie)

---

## 1. Deployment-Übersicht

### Architektur

```
                  ┌───────────────────────┐
                  │   Reverse Proxy       │
                  │   (Nginx / Caddy)     │
                  │   :443 (HTTPS)        │
                  └───────┬───────────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
   ┌────────▼────┐ ┌──────▼──────┐ ┌───▼───────┐
   │  Frontend   │ │  Backend    │ │ WebSocket │
   │  (Static)   │ │  (Express)  │ │ (/ws)     │
   │  /dist/     │ │  :3001      │ │ :3001     │
   └─────────────┘ └──────┬──────┘ └───────────┘
                          │
                   ┌──────▼──────┐
                   │   SQLite    │
                   │   (WAL)     │
                   └─────────────┘
```

### Deployment-Varianten

| Variante | Empfohlen für |
|----------|--------------|
| **Lokal (Dev)** | Entwicklung, Testing |
| **Docker Compose** | Staging, kleine Teams |
| **Bare Metal + Nginx** | Produktion (Single-Server) |
| **Kubernetes** | Skalierte Produktion |

---

## 2. Lokale Installation

```bash
# Voraussetzungen: Node.js 22+, npm 10+

# 1. Repository klonen
git clone <repository-url> valtheron-workspace
cd valtheron-workspace

# 2. Backend
cd backend
npm install
cp .env.example .env
# .env anpassen (JWT_SECRET, API Keys, etc.)
npm run build
npm start

# 3. Frontend (neues Terminal)
cd frontend
npm install
npm run build
npm run preview    # Oder: Dateien aus dist/ über Webserver ausliefern
```

**Zugriff:** `http://localhost:5173` (Frontend) → `http://localhost:3001` (API)

---

## 3. Docker-Deployment

### 3.1 docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - backend-data:/app/data
      - backend-backups:/app/backups
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  backend-data:
  backend-backups:
```

### 3.2 Backend Dockerfile

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
RUN mkdir -p data backups
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### 3.3 Frontend Dockerfile

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
```

### 3.4 Starten

```bash
# Umgebungsvariablen setzen
export JWT_SECRET=$(openssl rand -hex 32)
export ENCRYPTION_KEY=$(openssl rand -hex 16)

# Starten
docker compose up -d

# Logs prüfen
docker compose logs -f

# Stoppen
docker compose down
```

---

## 4. Produktions-Deployment

### 4.1 Vorbereitung

```bash
# 1. Node.js installieren
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Build-Tools
sudo apt install -y build-essential python3

# 3. PM2 (Process Manager)
sudo npm install -g pm2

# 4. Anwendung deployen
cd /opt/valtheron
git pull origin main
cd backend && npm ci --omit=dev && npm run build
cd ../frontend && npm ci && npm run build
```

### 4.2 Umgebungsvariablen

```bash
# /opt/valtheron/backend/.env
NODE_ENV=production
PORT=3001
JWT_SECRET=<openssl rand -hex 32>
ENCRYPTION_KEY=<openssl rand -hex 16>
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
BACKUP_INTERVAL_HOURS=1
BACKUP_MAX_COUNT=48
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX=20
```

### 4.3 Berechtigungen

```bash
# Eigenen User erstellen
sudo useradd -r -s /bin/false valtheron
sudo chown -R valtheron:valtheron /opt/valtheron
sudo chmod 600 /opt/valtheron/backend/.env
sudo chmod 700 /opt/valtheron/backend/data
sudo chmod 700 /opt/valtheron/backend/backups
```

---

## 5. Reverse-Proxy-Konfiguration

### 5.1 Nginx

```nginx
# /etc/nginx/sites-available/valtheron
upstream backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

server {
    listen 80;
    server_name workspace.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name workspace.example.com;

    ssl_certificate     /etc/letsencrypt/live/workspace.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/workspace.example.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'" always;

    # Frontend (statische Dateien)
    location / {
        root /opt/valtheron/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
    }

    # WebSocket
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }

    # Request-Größe begrenzen
    client_max_body_size 10M;
}
```

### 5.2 Caddy (Alternative)

```caddyfile
workspace.example.com {
    # Frontend
    handle {
        root * /opt/valtheron/frontend/dist
        try_files {path} /index.html
        file_server
    }

    # API + WebSocket
    handle /api/* {
        reverse_proxy 127.0.0.1:3001
    }
    handle /ws {
        reverse_proxy 127.0.0.1:3001
    }

    # Security Headers
    header {
        X-Frame-Options SAMEORIGIN
        X-Content-Type-Options nosniff
        Strict-Transport-Security "max-age=63072000"
    }
}
```

---

## 6. SSL/TLS-Konfiguration

### Let's Encrypt (certbot)

```bash
# Certbot installieren
sudo apt install certbot python3-certbot-nginx

# Zertifikat erstellen
sudo certbot --nginx -d workspace.example.com

# Auto-Renewal testen
sudo certbot renew --dry-run
```

---

## 7. Process-Management

### 7.1 PM2

```bash
# App starten
pm2 start /opt/valtheron/backend/dist/index.js \
  --name valtheron-backend \
  --env production

# Status prüfen
pm2 status

# Logs anzeigen
pm2 logs valtheron-backend

# Auto-Start bei Systemstart
pm2 startup
pm2 save

# Neustart (bei Updates)
pm2 restart valtheron-backend
```

### 7.2 Systemd (Alternative)

```ini
# /etc/systemd/system/valtheron.service
[Unit]
Description=Valtheron Agentic Workspace
After=network.target

[Service]
Type=simple
User=valtheron
WorkingDirectory=/opt/valtheron/backend
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable valtheron
sudo systemctl start valtheron
sudo systemctl status valtheron
```

---

## 8. CI/CD-Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: cd backend && npm ci && npm test
      - run: cd frontend && npm ci && npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Server
        run: |
          ssh ${{ secrets.DEPLOY_HOST }} 'cd /opt/valtheron && git pull && cd backend && npm ci --omit=dev && npm run build && pm2 restart valtheron-backend'
          ssh ${{ secrets.DEPLOY_HOST }} 'cd /opt/valtheron/frontend && npm ci && npm run build'
```

---

## 9. Monitoring in Produktion

### 9.1 Health-Check

```bash
# Cron-Job: alle 5 Minuten
*/5 * * * * curl -sf http://localhost:3001/api/health || systemctl restart valtheron
```

### 9.2 Metriken

- **Uptime:** `/api/health` → `uptime` Feld
- **Response Times:** Access-Logs oder APM-Tool
- **Error Rate:** `/api/analytics/dashboard` → `errorRate`
- **Active Agents:** `/api/analytics/dashboard` → `activeAgents`

### 9.3 Alerting

Empfohlene Monitoring-Tools:
- **UptimeRobot** / **Uptime Kuma** — HTTP-Checks
- **Prometheus + Grafana** — Metriken-Dashboard
- **Sentry** — Error-Tracking

---

## 10. Rollback-Strategie

### 10.1 Schneller Rollback

```bash
# Letzte funktionierende Version
git log --oneline -5

# Auf vorherige Version zurücksetzen
git checkout <commit-hash>
cd backend && npm ci --omit=dev && npm run build
pm2 restart valtheron-backend
cd ../frontend && npm ci && npm run build
```

### 10.2 Datenbank-Rollback

```bash
# Backup wiederherstellen
curl -X POST http://localhost:3001/api/backup/restore \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"filename": "backup-2026-02-26T120000.db"}'
```

### 10.3 Checkliste vor Deployment

- [ ] Alle Tests bestehen (`npm test`)
- [ ] Build erfolgreich (`npm run build`)
- [ ] Security-Scan clean (`npm audit`)
- [ ] Backup erstellt
- [ ] Rollback-Plan dokumentiert
- [ ] Health-Check nach Deploy

---

*Valtheron Agentic Workspace v1.0.0 — Deployment-Handbuch*
