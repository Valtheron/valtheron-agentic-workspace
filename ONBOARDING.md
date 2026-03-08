# Valtheron Agentic Workspace — Onboarding Guide

**Zielgruppe:** Neue Entwickler, KI-Agenten, externe Mitarbeiter
**Ziel:** Vollständiger Einstieg in das Projekt ohne Rückfragen
**Stand:** 08.03.2026 — v1.0.0 Genesis Release
**Eigentümer:** BlackIceSecure / Valtheron

---

## 1. Projekt in 2 Minuten verstehen

**Was ist Valtheron Agentic Workspace?**

Eine Web-Plattform zur Orchestrierung, Überwachung und Steuerung autonomer KI-Agenten. Unternehmen und Entwickler können bis zu 290 vorkonfigurierte Agenten über ein modernes Dashboard verwalten — mit Echtzeit-Chat, Kill-Switch-Schutz, vollständigem Audit-Trail und Multi-LLM-Unterstützung.

**Kernfunktionen auf einen Blick:**
- Agent-Management (290 vorkonfigurierte Agenten, 10 Kategorien)
- Kanban-Taskboard (5 Spalten: Backlog → In Progress → Review → Done → Archived)
- Echtzeit-Chat mit Persönlichkeitsprofilen
- Analytics-Dashboard (6 Tabs)
- Kill-Switch mit Auto-Trigger-Regeln
- MFA-Authentifizierung (TOTP + Backup Codes)
- Secrets-Vault (AES-256-GCM)
- Automatische Backups (6h-Intervall)

**Unternehmenskontext:**
- **Eigentümer:** BlackIceSecure (https://blackicesecure.com)
- **Marke:** Valtheron (https://valtheron.com)
- **Status:** v1.0.0 produktionsreif — **Release-Priorität: SOFORT**

---

## 2. Technologie-Stack (Überblick)

| Layer | Technologie | Version |
|-------|-------------|---------|
| Frontend | React + TypeScript | 19.2 / 5.9 |
| Build | Vite | 7.3 |
| Styling | TailwindCSS + shadcn/ui | 3.4 |
| Backend | Express + TypeScript | 5.1 / 5.9 |
| Datenbank | SQLite (better-sqlite3, WAL-Modus) | — |
| Auth | JWT (HS256, 24h) + TOTP MFA | — |
| Verschlüsselung | AES-256-GCM | — |
| LLM | Anthropic, OpenAI, Ollama, Custom | — |
| Echtzeit | WebSocket (ws) | 8.18 |
| Testing | Vitest | 4.0 |
| Container | Docker + Docker Compose | — |
| CI/CD | GitHub Actions | — |

---

## 3. Lokale Entwicklungsumgebung aufsetzen

### Voraussetzungen

```bash
node --version    # Muss >= 22.0.0 sein
npm --version     # Muss >= 10.0.0 sein
docker --version  # Optional, für Container-Deployment
```

### Schritt 1 — Repository klonen

```bash
git clone https://github.com/Valtheron/valtheron-agentic-workspace.git
cd valtheron-agentic-workspace
```

### Schritt 2 — Backend starten

```bash
cd backend
npm install
npm run dev
# Läuft auf http://localhost:3001
# WebSocket: ws://localhost:3001/ws
```

### Schritt 3 — Frontend starten (neues Terminal)

```bash
cd frontend
npm install
npm run dev
# Läuft auf http://localhost:5173
```

### Schritt 4 — Ersten Admin-Account anlegen

Das System hat **keine** Default-Credentials. Der erste registrierte User wird automatisch Admin.

1. Öffne http://localhost:5173
2. Klicke auf "Registrieren"
3. Erstelle deinen Admin-Account
4. Du hast sofort vollen Admin-Zugriff

### Schritt 5 — LLM konfigurieren (optional für Chat-Funktionen)

Navigiere zu **Einstellungen → LLM-Einstellungen** und trage einen API-Key ein:
- Anthropic: `ANTHROPIC_API_KEY`
- OpenAI: `OPENAI_API_KEY`
- Ollama: Lokale URL (kein Key nötig)

### Alternativ: Docker Compose

```bash
# Im Root-Verzeichnis:
docker-compose up --build

# Frontend: http://localhost:8080
# Backend:  http://localhost:3001
```

---

## 4. Verzeichnisstruktur — Was ist wo?

```
valtheron-agentic-workspace/
│
├── ONBOARDING.md               ← DIESE DATEI — Startpunkt für neue Mitarbeiter
├── PROJECT_STATUS.md           ← Aktueller Projektstatus + Release-Roadmap
├── CONTRIBUTING.md             ← Git-Workflow, Branch-Naming, PR-Regeln
│
├── README.md                   ← Projektübersicht (Konzept-Ebene)
├── CHANGELOG.md                ← Vollständige Versionshistorie
├── RELEASE_NOTES.md            ← v1.0.0 Release Highlights
├── TECHNICAL_IMPLEMENTATION_GUIDE.md  ← Technische Tiefen-Dokumentation
│
├── docs/                       ← Betriebsdokumentation
│   ├── API.md                  ← Alle 50+ API-Endpunkte mit Beispielen
│   ├── ARCHITECTURE.md         ← Systemarchitektur + Datenmodell + ADRs
│   ├── DEVELOPER_GUIDE.md      ← Entwickler-Workflow + Code-Standards
│   ├── ADMIN_GUIDE.md          ← System-Administration + Monitoring
│   ├── USER_GUIDE.md           ← Benutzerhandbuch (Endnutzer)
│   ├── DEPLOYMENT_GUIDE.md     ← Docker, Nginx, PM2, Bare Metal
│   ├── TROUBLESHOOTING_GUIDE.md ← Häufige Probleme + Diagnose-Befehle
│   └── BETA_TESTING.md         ← Test-Szenarien + Checkliste
│
├── backend/
│   ├── src/
│   │   ├── server.ts           ← Entry Point: startet alle Services
│   │   ├── app.ts              ← Express-Setup + DB-Initialisierung
│   │   ├── db/
│   │   │   ├── schema.ts       ← 17 DB-Tabellen + 23 Indizes (hier schreiben!)
│   │   │   └── seed.ts         ← Initiale Seed-Daten
│   │   ├── routes/             ← 13 API-Module (je eine Datei = ein Bereich)
│   │   ├── services/           ← 10 Business-Logic-Services
│   │   ├── middleware/         ← 6 Express-Middleware (auth, rbac, cache, etc.)
│   │   └── __tests__/          ← 26 Test-Dateien (280+ Tests)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx             ← Root-Komponente + Routing
│   │   ├── main.tsx            ← Entry Point
│   │   ├── components/         ← 19 View-Komponenten + 3 UI-Primitives
│   │   ├── services/           ← API-Client, LLM-Service, Persistence
│   │   ├── types/index.ts      ← Alle TypeScript-Interfaces
│   │   └── __tests__/          ← 11 Test-Dateien (98 Tests)
│   └── package.json
│
├── scripts/                    ← Sicherheits-Scripts (SAST, DAST, Pentest)
└── docker-compose.yml
```

---

## 5. Datenbank-Schema (Schnellreferenz)

Die vollständige Schema-Definition liegt in `/backend/src/db/schema.ts`.

**17 Tabellen:**

| Tabelle | Zweck |
|---------|-------|
| `users` | Auth + MFA + Rollen (admin/operator/viewer) |
| `agents` | 290 vorkonfigurierte Agenten + Status |
| `tasks` | Aufgaben mit Kanban-Status + Abhängigkeiten |
| `workflows` | Workflow-Definitionen + Instanzen + Steps |
| `projects` | Projekt-Container |
| `project_tree_nodes` | Hierarchische Projekt-Baumstruktur |
| `chat_sessions` | Chat-Sitzungen pro Agent |
| `chat_messages` | Chat-Nachrichten-History |
| `collaboration_sessions` | Multi-Agent-Shared-Workspaces |
| `shared_files` | Datei-Sharing mit Versionierung |
| `task_dependencies` | Abhängigkeiten zwischen Tasks |
| `security_events` | Sicherheitsereignisse + Kill-Switch-History |
| `audit_log` | Vollständiges Aktivitäts-Log (alle Ops) |
| `kill_switch` | Kill-Switch-Status + Auto-Trigger-Regeln |
| `notifications` | Push-Benachrichtigungen |
| `secrets` | Verschlüsselter Secrets-Vault |
| `backups` | Backup-Metadata + Rotation |

---

## 6. API-Schnellreferenz

Basis-URL: `http://localhost:3001/api`

### Authentifizierung

```bash
# Registrieren
POST /api/auth/register
{ "username": "user", "email": "user@example.com", "password": "password" }

# Login
POST /api/auth/login
{ "username": "user", "password": "password" }
# → { "token": "eyJ...", "user": { ... } }

# Token im Header senden:
Authorization: Bearer <token>
```

### Wichtigste Endpunkte

```
GET    /api/agents              Alle Agenten (+ ?search=, ?category=, ?status=)
POST   /api/agents              Neuen Agenten erstellen
PATCH  /api/agents/:id          Agenten aktualisieren
DELETE /api/agents/:id          Agenten löschen

GET    /api/tasks               Alle Tasks (+ ?status=, ?assignedTo=)
POST   /api/tasks               Task erstellen
PATCH  /api/tasks/:id           Task aktualisieren (inkl. Status-Wechsel)

GET    /api/analytics/dashboard Haupt-Metriken
GET    /api/security/audit      Audit-Logs (+ ?limit=, ?offset=, ?action=)

POST   /api/security/kill-switch/arm    Kill-Switch aktivieren
POST   /api/security/kill-switch/disarm Kill-Switch deaktivieren

GET    /api/health              System-Gesundheitsstatus
```

Vollständige Dokumentation: `docs/API.md`

---

## 7. Tests ausführen

```bash
# Backend — alle Tests
cd backend && npm test

# Backend — mit Coverage-Report
cd backend && npm run test:coverage
# Ziel: > 85% (aktuell: 87.8%)

# Frontend — alle Tests
cd frontend && npm test

# Alles auf einmal (aus Root)
npm test
```

**Vor jedem Commit müssen alle Tests bestehen.**

---

## 8. Code-Standards & Konventionen

### TypeScript
- Strict-Mode aktiv (`tsconfig.json`)
- Keine `any`-Typen ohne Begründung
- Interfaces in `frontend/src/types/index.ts` definieren

### Commit-Messages
Wir verwenden Conventional Commits:
```
feat: neue Funktionalität
fix: Bug-Behebung
docs: nur Dokumentation
test: Tests hinzufügen/ändern
refactor: Code-Umstrukturierung ohne Funktionsänderung
chore: Build-Prozess, Dependencies
```

### Branching
Neue Branches folgen dem Schema: `claude/<beschreibung>-<session-id>`

Details: `CONTRIBUTING.md`

### Linting
```bash
cd backend && npm run lint    # ESLint
cd frontend && npm run lint   # ESLint
```

---

## 9. Rollen & Berechtigungen

| Rolle | Beschreibung | Berechtigungen |
|-------|-------------|----------------|
| `admin` | Vollzugriff | CRUD auf alles, Kill-Switch, User-Management |
| `operator` | Tages-Betrieb | CRUD auf Agents/Tasks, kein Kill-Switch-Arm |
| `viewer` | Nur lesen | GET-Requests, kein Schreiben |

Der erste registrierte User bekommt automatisch `admin`.

---

## 10. Wichtige Konfiguration (Umgebungsvariablen)

**Backend** (`backend/.env`):
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=<zufälliger-string-min-32-zeichen>
ENCRYPTION_KEY=<32-byte-hex-für-AES-256>
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3001
```

Beide Repos haben `.env.example`-Dateien als Vorlage.

---

## 11. Häufige Fehler & Lösungen

| Problem | Lösung |
|---------|--------|
| Port 3001 belegt (`EADDRINUSE`) | `lsof -i :3001` → Prozess killen, oder `PORT=3002 npm run dev` |
| SQLite-Datei fehlt | Wird automatisch beim ersten Start erstellt |
| JWT-Fehler 401 | Token abgelaufen (24h) → neu einloggen |
| CORS-Fehler | `VITE_API_URL` in `frontend/.env` korrekt setzen |
| Tests schlagen fehl | `npm install` erneut ausführen, dann `npm test` |
| MFA QR-Code scannen | Google Authenticator oder Authy App verwenden |

Ausführliche Hilfe: `docs/TROUBLESHOOTING_GUIDE.md`

---

## 12. Wo was nachschlagen

| Frage | Dokument |
|-------|----------|
| Projektarchitektur verstehen | `docs/ARCHITECTURE.md` |
| API-Endpunkte nachschlagen | `docs/API.md` |
| Deployment einrichten | `docs/DEPLOYMENT_GUIDE.md` |
| Als Admin das System verwalten | `docs/ADMIN_GUIDE.md` |
| Code beitragen / PR erstellen | `CONTRIBUTING.md` |
| Aktueller Projektstatus + Prioritäten | `PROJECT_STATUS.md` |
| Agent-Kategorien & Personas | `AGENT_INSTRUKTIONEN.md` |
| Vollständige technische Details | `TECHNICAL_IMPLEMENTATION_GUIDE.md` |
| Gesamtkonzept & Vision | `AGENTIC_WORKSPACE_KONZEPT.md` |

---

## 13. Kontakt & Organisations-Links

- **Organisation GitHub:** https://github.com/Valtheron
- **BlackIceSecure:** https://blackicesecure.com
- **Valtheron:** https://valtheron.com
- **Issues melden:** GitHub Issues im Repository

---

*Letztes Update: 08.03.2026 | Status: v1.0.0 Genesis Release*
