# Troubleshooting-Handbuch — Valtheron Agentic Workspace

**Version:** 1.0.0
**Datum:** Februar 2026

---

## Inhaltsverzeichnis

1. [Installation & Setup](#1-installation--setup)
2. [Backend-Probleme](#2-backend-probleme)
3. [Frontend-Probleme](#3-frontend-probleme)
4. [Datenbank-Probleme](#4-datenbank-probleme)
5. [Authentifizierung](#5-authentifizierung)
6. [LLM-Integration](#6-llm-integration)
7. [Performance-Probleme](#7-performance-probleme)
8. [WebSocket-Probleme](#8-websocket-probleme)
9. [Docker-Probleme](#9-docker-probleme)
10. [Diagnose-Befehle](#10-diagnose-befehle)

---

## 1. Installation & Setup

### Problem: `npm install` schlägt fehl mit `better-sqlite3`

**Symptom:** Build-Fehler bei nativer SQLite-Erweiterung

**Lösung:**
```bash
# Build-Tools installieren
# Ubuntu/Debian
sudo apt install build-essential python3

# macOS
xcode-select --install

# Windows
npm install --global windows-build-tools

# Danach erneut installieren
rm -rf node_modules package-lock.json
npm install
```

### Problem: Node.js-Version zu alt

**Symptom:** `SyntaxError: Unexpected token` oder `ERR_REQUIRE_ESM`

**Lösung:**
```bash
# Version prüfen (mind. 22 erforderlich)
node --version

# Mit nvm aktualisieren
nvm install 22
nvm use 22
```

### Problem: Port 3001 bereits belegt

**Symptom:** `EADDRINUSE: address already in use :::3001`

**Lösung:**
```bash
# Prozess auf Port 3001 finden
lsof -i :3001
# oder
netstat -tlnp | grep 3001

# Prozess beenden
kill -9 <PID>

# Oder alternativen Port setzen
PORT=3002 npm start
```

---

## 2. Backend-Probleme

### Problem: Server startet nicht

**Mögliche Ursachen:**
1. `.env`-Datei fehlt → `cp .env.example .env`
2. Dependencies nicht installiert → `npm install`
3. Build fehlt → `npm run build`
4. Port belegt → Siehe oben

### Problem: API gibt 500 zurück

**Diagnose:**
```bash
# Server-Logs prüfen
pm2 logs valtheron-backend
# oder
NODE_ENV=development npm run dev  # Zeigt Stack-Traces
```

**Häufige Ursachen:**
- Datenbank-Datei fehlt oder korrupt → Neustart erstellt neue DB
- Fehlende Tabelle → Schema-Migration prüfen
- Ungültige JSON-Eingabe → Request-Body prüfen

### Problem: CORS-Fehler

**Symptom:** `Access-Control-Allow-Origin` fehlt im Browser

**Lösung:** CORS ist standardmäßig auf `*` konfiguriert. In Produktion:
```bash
# In .env spezifische Origin setzen
CORS_ORIGIN=https://workspace.example.com
```

---

## 3. Frontend-Probleme

### Problem: Leere Seite nach Build

**Lösung:**
```bash
# Build prüfen
cd frontend
npm run build
ls dist/  # Sollte index.html und assets/ enthalten

# Dev-Server zum Testen
npm run preview
```

### Problem: API-Aufrufe schlagen fehl

**Diagnose:**
1. Browser DevTools → Netzwerk-Tab öffnen
2. API-URL prüfen (Standard: `http://localhost:3001`)
3. CORS-Header prüfen

**Lösung:** API-URL in `frontend/src/services/api.ts` prüfen:
```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### Problem: Styling fehlt (Tailwind)

**Lösung:**
```bash
cd frontend
npx tailwindcss --help  # Prüfen ob installiert
npm run dev             # Dev-Server mit HMR
```

---

## 4. Datenbank-Probleme

### Problem: `SQLITE_BUSY`

**Ursache:** Gleichzeitige Schreibzugriffe bei hoher Last

**Lösung:**
```bash
# WAL-Modus prüfen (sollte aktiv sein)
sqlite3 backend/data/workspace.db "PRAGMA journal_mode;"
# Erwartete Ausgabe: wal

# Busy-Timeout erhöhen
sqlite3 backend/data/workspace.db "PRAGMA busy_timeout = 5000;"
```

### Problem: Datenbank korrupt

**Symptome:** `SQLITE_CORRUPT` oder `database disk image is malformed`

**Lösung:**
```bash
# 1. Aus Backup wiederherstellen
curl -X POST http://localhost:3001/api/backup/restore \
  -H "Authorization: Bearer <token>" \
  -d '{"filename": "<letztes-backup>"}'

# 2. Oder manuell
cp backend/backups/<letztes-backup>.db backend/data/workspace.db
# Server neustarten
```

### Problem: Datenbank wächst unkontrolliert

**Lösung:**
```bash
# VACUUM kompaktiert die DB
sqlite3 backend/data/workspace.db "VACUUM;"

# WAL-Datei bereinigen
sqlite3 backend/data/workspace.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

---

## 5. Authentifizierung

### Problem: JWT Token abgelaufen

**Symptom:** `401 Unauthorized` bei API-Aufrufen

**Lösung:**
```bash
# Token erneuern
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Authorization: Bearer <alter-token>"
```

### Problem: MFA-Code wird nicht akzeptiert

**Ursachen:**
1. **Zeitabweichung** — TOTP ist zeitbasiert (30s Fenster)
   - Systemzeit synchronisieren: `sudo ntpdate pool.ntp.org`
2. **Falscher Secret** — MFA neu einrichten
3. **Backup-Codes** — Einen der gespeicherten Backup-Codes verwenden

### Problem: Passwort vergessen

**Lösung (Admin):**
```bash
# Neuen Benutzer mit gleichem Namen erstellen (wenn DB es erlaubt)
# Oder: Direkt in der DB zurücksetzen (nur im Notfall)
sqlite3 backend/data/workspace.db
# UPDATE users SET passwordHash = '...' WHERE username = '...';
```

### Problem: Rate-Limiting blockiert Login

**Symptom:** `429 Too Many Requests`

**Lösung:** 60 Sekunden warten (Sliding Window). In Produktion:
```bash
# Rate-Limit-Fenster in .env anpassen
RATE_LIMIT_WINDOW=120
RATE_LIMIT_MAX=50
```

---

## 6. LLM-Integration

### Problem: Chat gibt nur simulierte Antworten

**Ursache:** Kein API-Key konfiguriert

**Lösung:**
1. Settings → LLM → Providers
2. API-Key für gewünschten Provider eingeben
3. Oder via Header: `x-llm-api-key: sk-...`

### Problem: Anthropic API-Fehler

**Häufige Fehlermeldungen:**

| Fehler | Lösung |
|--------|--------|
| `401 Unauthorized` | API-Key prüfen |
| `429 Rate Limited` | Weniger Anfragen oder höheren Plan nutzen |
| `529 Overloaded` | Später erneut versuchen |
| `400 Invalid Model` | Modellname prüfen (z.B. `claude-sonnet-4-5-20250929`) |

### Problem: Ollama verbindet nicht

**Diagnose:**
```bash
# Ollama läuft?
curl http://localhost:11434/api/tags

# Modelle vorhanden?
ollama list

# Ollama starten
ollama serve
```

**Lösung:** Ollama-Endpunkt in den LLM-Settings prüfen (Standard: `http://localhost:11434`).

### Problem: OpenAI API-Fehler

| Fehler | Lösung |
|--------|--------|
| `insufficient_quota` | Guthaben aufladen |
| `model_not_found` | Modellname prüfen (z.B. `gpt-4.1`) |
| `context_length_exceeded` | `maxTokens` reduzieren |

---

## 7. Performance-Probleme

### Problem: Langsame API-Antworten

**Diagnose:**
```bash
# Response-Zeiten messen
curl -w "%{time_total}" http://localhost:3001/api/agents \
  -H "Authorization: Bearer <token>"
```

**Lösungen:**
1. **Cache prüfen** — Wiederholte Anfragen sollten schneller sein
2. **DB-Indexes** — 23 Indexes sind konfiguriert, prüfen ob aktiv
3. **WAL-Modus** — Bessere Concurrency

### Problem: Hoher Speicherverbrauch

**Diagnose:**
```bash
pm2 monit
# oder
top -p $(pgrep -f "node dist/index.js")
```

**Lösung:** Cache-Größen reduzieren in `backend/src/middleware/cache.ts`

### Problem: WebSocket-Verbindungen summieren sich

**Lösung:** Clients senden `ping` alle 30s. Inaktive Verbindungen werden nach 60s getrennt. Bei Problemen: Server neustarten.

---

## 8. WebSocket-Probleme

### Problem: WebSocket verbindet nicht

**Ursachen:**
1. **Firewall** blockiert WebSocket-Upgrade
2. **Reverse Proxy** leitet WebSocket nicht weiter

**Nginx-Lösung:**
```nginx
location /ws {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Problem: WebSocket trennt häufig

**Ursachen:**
- Proxy-Timeout zu niedrig → `proxy_read_timeout 86400s;`
- Netzwerk-Instabilität → Client reconnect-Logik prüfen

---

## 9. Docker-Probleme

### Problem: Container startet nicht

```bash
# Logs prüfen
docker compose logs backend

# Container-Status
docker compose ps

# Neustart
docker compose down && docker compose up -d
```

### Problem: Volume-Berechtigungen

```bash
# Berechtigungen korrigieren
docker compose exec backend chown -R node:node /app/data /app/backups
```

### Problem: Docker Build fehlgeschlagen

```bash
# Cache löschen und neu bauen
docker compose build --no-cache
```

---

## 10. Diagnose-Befehle

### Quick-Check

```bash
# System-Status
curl -s http://localhost:3001/api/health | jq .

# DB-Größe
ls -lh backend/data/workspace.db

# Backup-Status
curl -s http://localhost:3001/api/backup/list \
  -H "Authorization: Bearer <token>" | jq .

# Agent-Anzahl
curl -s http://localhost:3001/api/agents \
  -H "Authorization: Bearer <token>" | jq '.agents | length'

# Letzte Security Events
curl -s http://localhost:3001/api/security/events \
  -H "Authorization: Bearer <token>" | jq '.events[:5]'
```

### Vollständiger Health-Check

```bash
#!/bin/bash
echo "=== Valtheron Health Check ==="
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Disk: $(df -h backend/data/ | tail -1)"
echo "Memory: $(free -m | grep Mem)"
echo "API Health: $(curl -s http://localhost:3001/api/health | jq -r .status)"
echo "DB Size: $(ls -lh backend/data/workspace.db | awk '{print $5}')"
echo "Backups: $(ls backend/backups/ 2>/dev/null | wc -l)"
echo "Processes: $(pm2 jlist 2>/dev/null | jq '.[].pm2_env.status' 2>/dev/null || echo 'pm2 not running')"
```

---

*Valtheron Agentic Workspace v1.0.0 — Troubleshooting-Handbuch*
