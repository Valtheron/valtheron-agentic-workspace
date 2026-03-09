# Administrator-Handbuch — Valtheron Agentic Workspace

**Version:** 1.0.0
**Datum:** Februar 2026

---

## Inhaltsverzeichnis

1. [Systemanforderungen](#1-systemanforderungen)
2. [Installation](#2-installation)
3. [Konfiguration](#3-konfiguration)
4. [Benutzerverwaltung](#4-benutzerverwaltung)
5. [Sicherheit](#5-sicherheit)
6. [Backup & Recovery](#6-backup--recovery)
7. [Monitoring & Alerting](#7-monitoring--alerting)
8. [Performance-Tuning](#8-performance-tuning)
9. [Wartung](#9-wartung)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Systemanforderungen

### Minimum

| Komponente | Anforderung |
|-----------|------------|
| **OS** | Linux (Ubuntu 22.04+), macOS 13+, Windows 11 |
| **Node.js** | 22.0+ |
| **RAM** | 2 GB |
| **Disk** | 1 GB (+ Backups) |
| **CPU** | 2 Cores |

### Empfohlen (Produktion)

| Komponente | Anforderung |
|-----------|------------|
| **OS** | Ubuntu 24.04 LTS |
| **Node.js** | 22.x LTS |
| **RAM** | 8 GB |
| **Disk** | 20 GB SSD |
| **CPU** | 4+ Cores |
| **Reverse Proxy** | Nginx / Caddy |
| **TLS** | Let's Encrypt |

---

## 2. Installation

### 2.1 Aus Quellcode

```bash
# Repository klonen
git clone <repository-url> valtheron-workspace
cd valtheron-workspace

# Backend installieren
cd backend
npm install
cp .env.example .env
# .env bearbeiten (siehe Abschnitt 3)
npm run build

# Frontend installieren
cd ../frontend
npm install
npm run build

# Backend starten
cd ../backend
npm start
```

### 2.2 Mit Docker

```bash
# Docker Compose starten
docker compose up -d

# Logs prüfen
docker compose logs -f
```

### 2.3 Verzeichnisstruktur

```
valtheron-workspace/
├── backend/
│   ├── src/             # Backend-Quellcode
│   ├── data/            # SQLite-Datenbank
│   ├── backups/         # Automatische Backups
│   └── .env             # Umgebungsvariablen
├── frontend/
│   ├── src/             # Frontend-Quellcode
│   └── dist/            # Build-Ausgabe
├── docs/                # Dokumentation
├── scripts/             # Utility-Skripte
└── docker-compose.yml
```

---

## 3. Konfiguration

### 3.1 Umgebungsvariablen (`backend/.env`)

| Variable | Standard | Beschreibung |
|----------|---------|-------------|
| `PORT` | `3001` | Backend-Port |
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `JWT_SECRET` | auto-generiert | Geheimer Schlüssel für JWT-Tokens |
| `ENCRYPTION_KEY` | auto-generiert | AES-256-Verschlüsselungsschlüssel |
| `ANTHROPIC_API_KEY` | — | Anthropic API-Schlüssel |
| `OPENAI_API_KEY` | — | OpenAI API-Schlüssel |
| `BACKUP_INTERVAL_HOURS` | `6` | Backup-Intervall in Stunden |
| `BACKUP_MAX_COUNT` | `10` | Maximale Anzahl aufbewahrter Backups |
| `RATE_LIMIT_WINDOW` | `60` | Rate-Limiting Fenster (Sekunden) |
| `RATE_LIMIT_MAX` | `20` | Max. Requests pro Fenster (Auth-Endpunkte) |

### 3.2 Produktions-Konfiguration

```bash
# Empfohlene Produktions-.env
NODE_ENV=production
PORT=3001
JWT_SECRET=<sicherer-zufalls-string-64-zeichen>
ENCRYPTION_KEY=<32-byte-hex-string>
ANTHROPIC_API_KEY=sk-ant-...
BACKUP_INTERVAL_HOURS=1
BACKUP_MAX_COUNT=48
```

### 3.3 Reverse-Proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name workspace.example.com;

    ssl_certificate     /etc/letsencrypt/live/workspace.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/workspace.example.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/valtheron/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 4. Benutzerverwaltung

### 4.1 Rollen

| Rolle | Rechte |
|-------|--------|
| **admin** | Vollzugriff auf alle Funktionen |
| **operator** | Agents und Tasks verwalten, Analytics lesen |
| **viewer** | Nur-Lese-Zugriff |

### 4.2 Benutzer erstellen (API)

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePass123!",
    "email": "admin@example.com",
    "role": "admin"
  }'
```

### 4.3 MFA erzwingen

Empfehlung: Alle Admin-Benutzer sollten MFA aktivieren.

```bash
# MFA-Status prüfen
curl http://localhost:3001/api/auth/mfa/status \
  -H "Authorization: Bearer <token>"
```

---

## 5. Sicherheit

### 5.1 JWT-Token

- **Gültigkeit:** 24 Stunden
- **Algorithmus:** HS256
- **Refresh:** Über `/api/auth/refresh`
- **Empfehlung:** JWT_SECRET regelmäßig rotieren (bei Rotation werden alle Sessions invalidiert)

### 5.2 Verschlüsselung

- **Algorithmus:** AES-256-GCM
- **Verwendung:** Secrets Vault, sensitive Felder
- **Key:** Über `ENCRYPTION_KEY` Umgebungsvariable

### 5.3 Rate Limiting

- **Auth-Endpunkte:** 20 Requests/60 Sekunden (Sliding Window)
- **Deaktiviert:** Im Test-Modus (`NODE_ENV=test`)

### 5.4 SAST-Scanning

```bash
# Sicherheits-Audit ausführen
./scripts/security-audit.sh

# Prüft auf:
# - npm-Schwachstellen
# - eval()-Verwendung
# - Hardcoded Secrets
# - SQL-Injection-Muster
```

### 5.5 DAST-Scanning

```bash
# DAST-Scanner gegen laufenden Server
./scripts/dast-scanner.sh http://localhost:3001

# Report wird in reports/ gespeichert
```

---

## 6. Backup & Recovery

### 6.1 Automatische Backups

- **Intervall:** Alle 6 Stunden (konfigurierbar)
- **Rotation:** Letzte 10 Backups werden aufbewahrt
- **Methode:** SQLite WAL Checkpoint + Dateikopie
- **Speicherort:** `backend/backups/`

### 6.2 Manuelles Backup

```bash
# Backup erstellen
curl -X POST http://localhost:3001/api/backup/create \
  -H "Authorization: Bearer <admin-token>"

# Backups auflisten
curl http://localhost:3001/api/backup/list \
  -H "Authorization: Bearer <admin-token>"
```

### 6.3 Wiederherstellung

```bash
# Aus Backup wiederherstellen
curl -X POST http://localhost:3001/api/backup/restore \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"filename": "backup-2026-02-26T120000.db"}'
```

### 6.4 RPO / RTO

| Metrik | Wert |
|--------|------|
| **RPO** (Recovery Point Objective) | 6 Stunden (Standard) / 1 Stunde (empfohlen) |
| **RTO** (Recovery Time Objective) | < 5 Minuten |

---

## 7. Monitoring & Alerting

### 7.1 Health-Endpoint

```bash
curl http://localhost:3001/api/health
# {"status":"ok","timestamp":"...","uptime":...}
```

### 7.2 Analytics-Dashboard

- **Echtzeit-Metriken** über WebSocket (`ws://localhost:3001/ws`)
- **Dashboard:** `/api/analytics/dashboard` (cached 15s)
- **Performance:** `/api/analytics/performance` (7-Tage-Trends)
- **SLA:** `/api/analytics/sla`

### 7.3 Kill-Switch-Monitoring

Der Kill-Switch-Monitor prüft alle 30 Sekunden:
- Fehlerrate aller Tasks
- Anzahl fehlgeschlagener Agents
- Gesamte Failure-Rate

Bei Schwellwertüberschreitung wird der Kill-Switch automatisch aktiviert.

### 7.4 Security Events

```bash
# Letzte Events abrufen
curl http://localhost:3001/api/security/events \
  -H "Authorization: Bearer <token>"

# Audit-Log exportieren
curl http://localhost:3001/api/security/audit/export \
  -H "Authorization: Bearer <token>" > audit.csv
```

---

## 8. Performance-Tuning

### 8.1 Datenbank

- **WAL-Modus** ist standardmäßig aktiv (bessere Concurrency)
- **23 Indexes** für optimierte Abfragen
- **Foreign Keys** aktiviert

### 8.2 Caching

| Cache | TTL | Max. Einträge | Zweck |
|-------|-----|--------------|-------|
| queryCache | 30s | 500 | DB-Abfragen |
| apiCache | 10s | 200 | API-Aggregationen |
| sessionCache | 5min | 100 | Session-Daten |

### 8.3 Optimierungs-Tipps

1. **BACKUP_INTERVAL_HOURS:** In Produktion auf 1h setzen
2. **Node.js Cluster:** Für Multi-Core mit `pm2` betreiben
3. **Statische Assets:** Über Nginx ausliefern (nicht über Express)
4. **WebSocket:** Connection-Pooling bei vielen gleichzeitigen Clients

---

## 9. Wartung

### 9.1 Updates

```bash
git pull origin main
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
# Backend neustarten
```

### 9.2 Datenbank-Wartung

```bash
# Datenbank kompaktieren (VACUUM)
sqlite3 backend/data/workspace.db "VACUUM;"

# WAL Checkpoint
sqlite3 backend/data/workspace.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

### 9.3 Log-Rotation

Logs werden über Morgan (HTTP) auf stdout geschrieben. Empfehlung:
- `pm2` oder `systemd` für Log-Rotation nutzen
- Audit-Logs regelmäßig exportieren und archivieren

---

## 10. Troubleshooting

### Häufige Probleme

| Problem | Lösung |
|---------|--------|
| "SQLITE_BUSY" | WAL-Modus prüfen, gleichzeitige Schreibzugriffe reduzieren |
| "JWT expired" | Token über `/api/auth/refresh` erneuern |
| Port 3001 belegt | `lsof -i :3001` → Prozess beenden oder Port ändern |
| WebSocket trennt | Firewall/Proxy WebSocket-Upgrade prüfen |
| Hohe Memory-Nutzung | Cache-Größen in `cache.ts` reduzieren |
| Backup fehlgeschlagen | Schreibrechte auf `backups/` prüfen |

### Logs prüfen

```bash
# Backend-Logs (pm2)
pm2 logs valtheron-backend

# Docker-Logs
docker compose logs -f backend
```

### Support

Bei weiteren Fragen:
1. Troubleshooting-Guide konsultieren
2. Issue im Repository erstellen
3. Audit-Log und Health-Status beilegen

---

*Valtheron Agentic Workspace v1.0.0 — Administrator-Handbuch*
