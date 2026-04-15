# Changelog — Valtheron Agentic Workspace

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/) und dieses Projekt verwendet [Semantic Versioning](https://semver.org/lang/de/).

---

## [Unreleased]

### Hinzugefügt

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

- `scripts/sync-kb-to-frontend.mjs` scannt jetzt zwei Quellverzeichnisse
  und schreibt ein zusammengeführtes Manifest mit `source`-Feld.
- Frontend-Build zieht KB-Manifest (`frontend/src/data/kb/*.json`) zur
  Build-Zeit als statischen Import — keine Runtime-Fetches.

### Dokumentation

- README um Abschnitt "Wissensbasis (Knowledge Base)" erweitert mit
  Sync-Befehl und Verzeichnis-Layout.

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
