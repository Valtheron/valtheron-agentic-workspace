# Changelog — Valtheron Agentic Workspace

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/) und dieses Projekt verwendet [Semantic Versioning](https://semver.org/lang/de/).

---

## [Unreleased]

### Hinzugefügt

- **Agent Capability Model (Branch 2, Commit 1):** Kanonische Spezifikation
  unter `the-290-agent-database/capability-model/`:
  5 Layers × 6 Sub-Dimensions = 30 Metriken (Skala 0-9), 3 Modifier-Achsen
  (Personality Influence, Performance History, Test Results), deterministische
  Index-Variation `(i % 3 - 1) * 0.3` — keine `Math.sin`-Dekoration,
  vollständig reproduzierbar. Strukturell extrahiert aus
  `frontend/src/components/AgentsView.tsx:11-84` und `:307-336` (Quelle in
  `provenance.md` dokumentiert). State-Invariante:
  `State = {value: b ∈ ℬ, status: S, timestamp: t, pendingReason: r} mit b ≠ 1` —
  keine Capability-Zelle beansprucht absolute Autorität. Sovereign Null:
  Fehlende Inputs → SQL NULL, kein Ersatz-JSON. Neuer Sync-Befehl
  `npm run sync:capability`; `sync:all` läuft jetzt Agents + KB + Capability.
  `scripts/sync-capability-model.mjs` validiert 5 × 6 = 30, drei Modifier-Keys,
  sowie Präsenz von `b ∈ ℬ` und `b ≠ 1` in der Invariante vor dem Schreiben;
  Post-Write MD5-Identity-Check. Backend 399/399 grün, keine Schema-Änderung
  in diesem Commit — folgende Commits: Schema-Migration + Seed + API +
  AgentsView-Integration.
- **Wissensbasis-Integration für 290 Agenten**: Jeder Agent erhält einen
  kategorie-basierten `knowledgeScope` mit bis zu 5 Dokument-Verweisen und
  einen um eine "## Wissensbasis"-Sektion angereicherten System-Prompt.
- **Neuer "Wissen"-Tab** in `AgentsView` mit Kategorien, aufklappbaren
  Summaries und Hinweis auf Katalog-Einträge ohne Binärdatei.
- **KB-Sync-Pipeline** (`scripts/sync-kb-to-frontend.mjs`): bündelt
  `knowledge-base/manifest.json` und 47 Summaries in
  `frontend/src/data/kb/`. Erweitert um das flache
  `valtheron-cybersec-database/`-Verzeichnis, wodurch 216 reale PDFs als
  `doc-db-NNN`-Einträge ins Manifest einfließen (gesamt 456 Dokumente).
- **Integrity-Annotation**: jedes Dokument wird mit
  `integrityStatus` (`valid` / `missing` / `empty` / `zero-pages` /
  `wrong-format-html` / `wrong-format-other`), `pageCount`, `fileSize`
  und `detectedFormat` versehen. Broken Files werden aus Agent-Scopes
  ausgeschlossen; bei Gleichstand im Tag-Score gewinnen reale PDFs vor
  Katalog-Platzhaltern.
- **Neue Typen** `KnowledgeDoc`, `KnowledgeScope`, `KnowledgeDocSource`
  und optionales `Agent.knowledgeScope`-Feld in `types/index.ts`.
- **Service** `frontend/src/services/knowledgeBase.ts` mit
  `loadKBManifest()`, `getKnowledgeScopeForAgent()`,
  `enrichSystemPromptWithKB()` und `getSummaryContent()`.
- **23 neue Vitest-Tests** in `__tests__/knowledgeBase.test.ts` decken
  Mapping, Ranking, Integrity-Filter und das 290-Agenten-Ingest ab.

### Geändert

- **Canonical-Agent-Source-Sync:** Backend-Seed (`backend/src/db/seed.ts`)
  liest den 290-Agenten-Katalog jetzt aus den kanonischen JSONs unter
  `the-290-agent-database/` — nicht mehr aus einer placeholder
  `AGENT_NAMES`-Tabelle mit 290 zufälligen Namen in 10 Kategorien. Jeder
  Agent behält seinen authored System-Prompt, die kategorie-Zuordnung
  (alle 16 realen Kategorien) und die Beschreibung. Runtime-Attribute
  (successRate, personality, parameters, hooks, testResults) werden
  deterministisch aus der Agent-ID abgeleitet, damit Reseeds stabil
  bleiben. Neuer Sync-Pfad:
  `the-290-agent-database/ → frontend/src/data/ + backend/src/data/` via
  `scripts/sync-agents.mjs` (Checksum-Verifikation, Byte-Identität
  erzwungen). Root-`package.json` bekommt `sync:agents`, `sync:kb` und
  `sync:all`. `backend/.gitignore` wurde von `data/` auf `/data/`
  verengt, damit die Laufzeit-SQLite-DB ignoriert bleibt, während
  `backend/src/data/` als Build-Artefakt getrackt wird.
- `scripts/sync-kb-to-frontend.mjs` scannt jetzt zwei Quellverzeichnisse
  und schreibt ein zusammengeführtes Manifest mit `source`-Feld.
- Frontend-Build zieht KB-Manifest (`frontend/src/data/kb/*.json`) zur
  Build-Zeit als statischen Import — keine Runtime-Fetches.

### Dokumentation

- `knowledge-base/README.md` an `index.yaml` angeglichen: 218 Dokumente
  / 9 Kategorien → 240 Dokumente / 14 Kategorien (fehlende Sektionen
  Meta, AI-Native, Fintech, Trading, Specialized Data ergänzt).
  `index.yaml` wird als autoritative Quelle markiert.
- README um Abschnitt "Wissensbasis (Knowledge Base)" erweitert mit
  Sync-Befehl und Verzeichnis-Layout.
- Projekt-Dokumente aus dem Repo-Root nach `docs/` verschoben
  (9 Dateien inkl. `ONBOARDING.md`, `PROJECT_STATUS.md`,
  `AGENTIC_WORKSPACE_KONZEPT.md`, `MASTER_ANLEITUNG.md`,
  `TECHNICAL_IMPLEMENTATION_GUIDE.md`); Duplikat
  `API_SPEZIFIKATION.md` entfernt (`docs/API.md` ist kanonisch).
  Interne Verweise in `README.md`, `CONTRIBUTING.md` und
  `docs/ONBOARDING.md` aktualisiert.
- README, `docs/API.md`, `docs/ARCHITECTURE.md`,
  `docs/DEVELOPER_GUIDE.md` und `docs/PROJECT_STATUS.md` gegen
  den aktuellen Codebasis-Stand abgeglichen: Test-Badge 468 → 614,
  Agent-Kategorien 10 → 16 mit realer Verteilung, View-Zählweisen
  (15 Routen / 21 `.tsx`-Dateien), DB-Indizes 23 → 20,
  API-Endpunkte 89. `docs/API.md` um 8 fehlende Endpunkte
  ergänzt (u. a. `POST /tasks/:id/execute`,
  `GET /security/audit/export`, Kill-Switch-Auto-Trigger-Rules,
  `POST /notifications`, `POST /secrets/generate-key`, neue
  Donations-Sektion mit `POST /donations/create-checkout-session`).

### Behoben

- **Hotfix für D-5 (`install:all`):** Die Kette
  `cd backend && npm install && cd ../frontend && npm install && npm install`
  hinterließ die Shell im `frontend/`-Verzeichnis, sodass der dritte
  `npm install` nicht im Repo-Root lief. `concurrently` wurde deshalb nie
  gezogen und `npm run dev` scheiterte auf frischen Maschinen mit
  `sh: 1: concurrently: not found`. Script nutzt jetzt
  `npm install --prefix backend && npm install --prefix frontend && npm install`,
  wodurch jeder Aufruf ein absolutes Ziel hat und kein `cd`-State zwischen
  Schritten leckt.
- **Onboarding-Walkthrough 2026-04-20 — 10 Defekte (D-1 bis D-10) behoben:**
  - **D-1 (blocker):** Agent-Katalog wird nun automatisch bei leerer DB geladen.
    `seedAgentCatalog()` aus `seedDatabase()` extrahiert; `initDatabase()` ruft sie
    außerhalb von Tests auf, sofern `SEED_DEMO` nicht gesetzt ist. Dadurch erhält
    jede Neu-Installation die beworbenen 290 Agenten, und `POST /api/chat/sessions`
    scheitert nicht mehr am `SQLITE_CONSTRAINT_FOREIGNKEY`.
  - **D-2 (major):** Neuer ENV-Flag `VALTHERON_REQUIRE_AUTH`
    (Backend, `backend/src/app.ts`) und `VITE_VALTHERON_REQUIRE_AUTH`
    (Frontend, `frontend/src/App.tsx`) erzwingt den Produktions-Auth-Flow auch im
    Dev-Modus. README um Dev-vs-Prod-Login-Abschnitt ergänzt.
  - **D-3 (minor):** Vite `base` ist nur noch für `command === 'build'` auf
    `/valtheron-agentic-workspace/` gesetzt; Dev-Server läuft wieder unter `/`
    (`http://localhost:5173/` funktioniert ohne Redirect).
  - **D-4 (minor):** README erwähnt jetzt `cp frontend/.env.example frontend/.env`.
  - **D-5 (major):** Root-`package.json`: `dev`-Script nutzt `concurrently`
    statt `&` → funktioniert plattformübergreifend (Linux/macOS/Windows),
    propagiert Kill-Signale und bricht bei Absturz beider Prozesse ab.
  - **D-6 (minor):** `docker-compose.yml` ohne obsoleten `version:`-Key;
    README referenziert `docker compose` (v2-Syntax) statt `docker-compose`.
  - **D-7 (major):** README-Voraussetzungen erwähnen den Docker-Gruppen-Workaround
    (`sudo usermod -aG docker $USER`), damit Linux-Ersttnutzer nicht an
    `permission denied on /var/run/docker.sock` scheitern.
  - **D-8 (major):** `backend/src/middleware/auth.ts` prüft beim Boot, ob
    `JWT_SECRET` noch auf dem Default-Wert steht. In `NODE_ENV=production` bricht
    der Start mit klarer Fehlermeldung ab; im Dev-Modus erscheint eine Warnung.
  - **D-9 (minor):** `npm audit fix` auf Root-, Backend- und Frontend-Paket
    angewandt (Vite, path-to-regexp, picomatch, flatted, brace-expansion).
    `npm audit` meldet jetzt 0 Vulnerabilities.
  - **D-10 (minor):** README macht explizit, dass alle Setup-Befehle im Repo-Root
    laufen; `.env`-Pfade mit `# (im Repo-Root ausführen)` annotiert.
  - Befundbericht: `reports/onboarding-walkthrough-2026-04-20.md`.
- `App.tsx`: versionierte Agent-Cache-Migration. Existierende
  localStorage-Einträge mit dem alten 200-Agenten-/10-Kategorien-Bundle
  werden beim nächsten Dashboard-Start durch den vollen 290-Agenten-
  Katalog (16 Kategorien) ersetzt. `AGENTS_CACHE_VERSION` kann bei
  weiteren Katalog-Änderungen erhöht werden, um Migrationen erneut
  auszulösen.
- `App.tsx`: Migration ist jetzt zusätzlich selbstheilend — wenn das
  gecachte `agents`-Array kürzer als `EXPECTED_AGENT_COUNT` (290) ist,
  wird unabhängig vom Versionsstand neu generiert. Schützt vor
  Edge-Cases, in denen ein anderer Codepfad das Array nach der
  Versions-Migration wieder auf 200 Einträge zurückgeschrieben hat.

### Dev-Tooling

- `.claude/settings.json`: neuer `PostToolUse`-Hook auf `Bash(git push*)`,
  der nach jedem Push einen Reminder zur Post-Push-Checklist
  (CHANGELOG / README / PR-Body / Test + Lint) in den Model-Kontext
  injiziert. Greift in neu gestarteten Sessions; einmalig `/hooks`
  öffnen oder neu starten, falls bereits eine Session läuft.

---

## [1.0.0] — 2026-02-26

### Phase 1: Projektinitialisierung

#### Hinzugefügt
- Git-Repository mit Monorepo-Struktur (backend + frontend)
- Docker-Compose-Setup für lokale Entwicklung
- Express 5.1 Backend mit TypeScript
- React 19 + Vite 7.3 Frontend mit TailwindCSS
- ESLint + Prettier Konfiguration
- GitHub Actions CI/CD (Tests, Linting, Build)
- Pre-commit Hooks (lint-staged)
- Environment-Variablen-Dokumentation (.env.example)

---

### Phase 2: Kernfunktionalität

#### Hinzugefügt
- **Agent-Management**: Vollständiges CRUD mit Status-Tracking (290 vordefinierte Agenten)
  - 10 Kategorien: Trading, Security, Development, QA, Documentation, Deployment, Analyst, Support, Integration, Monitoring
  - Persönlichkeitsprofil-System (Archetyp, Kommunikationsstil, Kreativität, Risikotoleranz)
  - 5 Layer × 4 Subdimensionen pro Kategorie
- **Task-Management**: CRUD mit Kanban-Board (5 Spalten)
  - Task-Zuweisung an Agenten
  - Abhängigkeiten zwischen Tasks
  - Prioritäten und Fortschrittstracking
- **Authentifizierung**: JWT-basierte Auth mit Role-Based Access Control
  - Login, Register, Token-Refresh
  - 3 Rollen: admin, operator, viewer
- **Web-Dashboard**: React SPA mit 8 Navigations-Views
  - Dashboard mit KPIs und Status-Übersicht
  - Agent-Directory mit Detail-Panel
  - Kanban-Board mit Drag-Status
  - Login-Seite
- **API-Client**: Fetch-basiert mit Bearer-Token-Interceptor

---

### Phase 3: Erweiterte Funktionen

#### Hinzugefügt
- **Multi-Agent-Collaboration**: Sessions mit Nachrichten-Austausch
  - Shared-Workspace für Agenten-Gruppen
  - File-Sharing mit Versionierung
- **Chat-Interface**: Echtzeit-Kommunikation mit LLM-Anbindung
  - Sessions pro Agent
  - Nachrichtenverlauf
  - Anthropic + OpenAI + Ollama Provider
  - Fallback-Simulation ohne API-Key
- **Audit-Trail**: Vollständiges Activity-Logging
  - Security Events mit Severity-Levels
  - CSV-Export für Compliance
- **Analytics-Dashboard**: 6 Tabs mit umfassenden Metriken
  - Trends, Throughput, Errors, Capacity, SLA, Success Rate
  - Performance-Dashboard (7-Tage-Trends)
  - CSV/JSON Export
- **Project-Tree**: Hierarchische Projektstruktur
  - CRUD mit Eltern-Kind-Beziehungen
  - Expand/Collapse UI
- **Kill-Switch**: Notfall-Stopp-System
  - Manuelles Arm/Disarm
  - Auto-Trigger Rules Engine (30s Polling)
  - 3 Metriken: Task Error Rate, Failed Agents, Overall Failure Rate
  - Automatische Agent-Suspendierung
- **Workflow-Engine**: Definition und Ausführung von Workflows
  - Sequentielle und parallele Steps
  - Status-Tracking und Execution-History
- **Notifications**: Push-Benachrichtigungen mit WebSocket
- **Secrets Vault**: AES-256-GCM verschlüsselter Key-Value-Store
  - Key-Rotation
  - Secrets nie im Klartext in Responses
- **Command Palette**: Ctrl+K Schnellzugriff auf alle Views
- **WebSocket Real-Time**: Live-Updates für alle Datenbereiche

---

### Phase 4: Sicherheit & Optimierung

#### Hinzugefügt
- **Multi-Faktor-Authentifizierung (MFA)**: TOTP via Authenticator-App
  - QR-Code-basiertes Setup
  - 8 Backup-Codes
  - Login-Integration
- **Verschlüsselung**: AES-256-GCM für sensitive Daten
  - 96-bit IV, Auth-Tag-Verifikation
  - Key-Rotation-Prozess
- **Rate Limiting**: Sliding-Window auf Auth-Endpunkte (20 req/60s)
- **SAST-Scanning**: Automatisiertes Security-Audit-Script
  - eval()-Erkennung, Hardcoded-Secrets, SQL-Injection-Patterns
- **Performance-Caching**: In-Memory TTL Cache
  - 3 Cache-Tiers: Query (30s), API (10s), Session (5min)
  - Cache-Middleware für GET-Requests
- **Datenbank-Optimierung**: 23 Performance-Indexes, WAL-Modus
- **Backup & Recovery**: Automatische Backups alle 6h
  - Rotation (max. 10 Backups)
  - Restore-API
  - RPO: 6h, RTO: < 5min
- **LLM Settings View**: Frontend-Konfiguration für 8 Provider

---

### Phase 5: Tests & Finalisierung

#### Hinzugefügt
- **Unit-Tests**: 280 Backend-Tests (24 Dateien), 98 Frontend-Tests
  - Backend Coverage: 87.8% Lines, ~80% Branches
  - Frontend Coverage: ~70% Lines
- **Integration-Tests**: 35 E2E-Workflow-Tests (6 Suiten)
  - Auth → Agent → Task Workflows
  - Workflow Execution Pipeline
  - Security Events Lifecycle
  - Chat Lifecycle
  - Analytics Pipeline
  - Collaboration Sessions
- **Performance-Tests**: 27 Tests (Load, Stress, Endurance)
  - Load: 100 parallele Requests
  - Stress: 500 parallele Requests
  - Endurance: Sustained-Load-Simulation
- **Security-Tests**: 35+ Tests (OWASP Top 10)
  - SQL Injection, XSS, CSRF, Auth Bypass
  - Rate Limiting, Information Disclosure
  - Insecure Direct Object References
  - DAST-Scanner Script
  - Penetration-Testing Script
- **Dokumentation**: 8 vollständige Guides
  - API-Dokumentation (50+ Endpunkte)
  - User Guide (Deutsch)
  - Admin Guide
  - Developer Guide
  - Deployment Guide
  - Troubleshooting Guide
  - Architecture Documentation (inkl. ADRs)
  - Beta-Testing Checklist & Report Template
- **LLM Ollama Backend**: Lokale LLM-Unterstützung
  - Ollama Provider (HTTP, localhost:11434)
  - Custom OpenAI-kompatibler Endpoint-Support
- **Release**: Changelog + Release-Notes

---

## Statistiken

| Metrik | Wert |
|--------|------|
| **Backend-Tests** | 280+ |
| **Frontend-Tests** | 98 |
| **Integration-Tests** | 35 |
| **Performance-Tests** | 27 |
| **Security-Tests** | 35+ |
| **Gesamt-Tests** | 475+ |
| **Backend Coverage** | 87.8% Lines |
| **API-Endpunkte** | 50+ |
| **Agenten** | 290 |
| **DB-Tabellen** | 17 |
| **DB-Indexes** | 23 |
| **Dokumentations-Seiten** | 8 Guides |

---

*Valtheron Agentic Workspace — Made with autonomous agents.*
