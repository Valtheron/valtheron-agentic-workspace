# Architektur-Dokumentation — Valtheron Agentic Workspace

**Version:** 1.0.0
**Datum:** Februar 2026

---

## 1. Systemübersicht

### 1.1 Vision

Valtheron Agentic Workspace ist eine Plattform zur Verwaltung, Orchestrierung und Überwachung autonomer KI-Agenten. Das System ermöglicht:

- Erstellung und Verwaltung spezialisierter Agenten
- Task-Zuweisung und -Tracking via Kanban-Board
- Echtzeit-Kommunikation mit Agenten via LLM-Anbindung
- Umfassendes Monitoring, Analytics und Sicherheitsfeatures
- Notfall-Kill-Switch mit automatischen Trigger-Regeln

### 1.2 High-Level-Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 19 + Vite 7.3 + TailwindCSS 3.4 + TypeScript 5.9    │
│                                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌─────┐ ┌──────┐ ┌───────┐    │
│  │Dashb.│ │Agents│ │Kanban│ │Chat │ │Analyt│ │KillSw.│    │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬──┘ └──┬───┘ └──┬────┘    │
│     └────────┴────────┴────────┴────────┴────────┘          │
│                        │ HTTP + WebSocket                    │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────┐
│                     BACKEND                                  │
│  Express 5.1 + TypeScript + Node.js 22                       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              MIDDLEWARE PIPELINE                      │    │
│  │  CORS → JSON → Auth → RBAC → Cache → RateLimiter   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────── ROUTES (11 Module) ──────────────────┐    │
│  │ auth │ agents │ tasks │ workflows │ chat │ collab   │    │
│  │ security │ analytics │ files │ tree │ notifications │    │
│  │ secrets │ backup │ health                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────── SERVICES ──────────────────────────┐     │
│  │ encryption │ websocket │ killSwitchMonitor │ cache  │     │
│  └─────────────────────────────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────── LLM PROVIDERS ─────────────────────┐     │
│  │ Anthropic │ OpenAI │ Ollama │ Custom                │     │
│  └─────────────────────────────────────────────────────┘    │
│                         │                                    │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                    DATENBANK                                  │
│  SQLite (better-sqlite3) + WAL-Modus                         │
│  17 Tabellen │ 20 Indexes │ Foreign Keys                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Komponenten-Architektur

### 2.1 Frontend-Komponenten

```
App.tsx (Root)
├── LoginView           — JWT + MFA Authentifizierung
├── Sidebar             — Navigation (8 Views)
├── CommandPalette      — Ctrl+K Schnellzugriff
├── DashboardView       — KPIs, Status, Top Performers
├── AgentsView          — Agent-Directory + Detail-Panel
│   └── Tabs: Subdimensions, Overview, Layers, Modifiers
├── KanbanView          — 5-Spalten Task-Board
├── ChatView            — LLM Chat-Interface
├── AnalyticsView       — 6 Analytics-Tabs
│   └── Tabs: Trends, Throughput, Errors, Capacity, SLA, Success
├── KillSwitchView      — 4 Sicherheits-Tabs
│   └── Tabs: Panel, History, Risk, Batch
└── LLMSettingsView     — Provider-Konfiguration
    └── Tabs: Providers, Ollama, Defaults, Parameters
```

### 2.2 Backend-Module

| Modul | Pfad | Beschreibung |
|-------|------|-------------|
| **Auth** | `/api/auth/*` | Login, Register, MFA (TOTP), Token Refresh |
| **Agents** | `/api/agents/*` | CRUD + Status-Management |
| **Tasks** | `/api/tasks/*` | CRUD + Kanban-Status + Dependencies |
| **Workflows** | `/api/workflows/*` | Definition + Execution Engine |
| **Chat** | `/api/chat/*` | Sessions + Messages + LLM-Integration |
| **Collaboration** | `/api/collaboration/*` | Multi-Agent Sessions |
| **Security** | `/api/security/*` | Kill-Switch, Events, Audit-Log |
| **Analytics** | `/api/analytics/*` | Dashboard, Performance, SLA, Export |
| **Files** | `/api/files/*` | File Sharing + Versioning |
| **Tree** | `/api/tree/*` | Project-Tree CRUD |
| **Secrets** | `/api/secrets/*` | Encrypted Vault |
| **Backup** | `/api/backup/*` | Create, List, Restore |
| **Health** | `/api/health` | System Status |

---

## 3. Datenmodell

### 3.1 Entity-Relationship-Übersicht

```
users ──────────┐
                │
agents ─────────┼──── tasks ──── task_dependencies
    │           │       │
    │           │       └──── workflow_instances ──── workflow_steps
    │           │
    ├── chat_sessions ──── chat_messages
    │
    ├── collaboration_sessions ──── collaboration_messages
    │
    └── shared_files

security_events    (standalone)
audit_log          (standalone)
project_tree_nodes (self-referencing)
notifications      (standalone)
secrets            (standalone)
workflow_definitions ──── workflow_steps
```

### 3.2 Kerntabellen

| Tabelle | Felder (Auszug) | Zweck |
|---------|-----------------|-------|
| `users` | id, username, passwordHash, role, mfaEnabled, mfaSecret | Benutzerverwaltung |
| `agents` | id, name, category, status, role, llmProvider, llmModel, personality, parameters | Agent-Definitionen |
| `tasks` | id, title, status, priority, category, assignedAgentId, progress | Task-Tracking |
| `chat_sessions` | id, agentId, title | Chat-Kontext |
| `chat_messages` | id, sessionId, sender, senderType, content | Nachrichtenverlauf |
| `security_events` | id, type, severity, message, source | Sicherheitsprotokoll |
| `audit_log` | id, action, userId, targetType, targetId, details | Audit-Trail |
| `secrets` | id, key, encryptedValue, iv, tag | Verschlüsselter Vault |

### 3.3 Indexes

20 Performance-Indexes auf häufig abgefragten Spalten:
- `agents(status)`, `agents(category)`, `agents(name)`
- `tasks(status)`, `tasks(priority)`, `tasks(assignedAgentId)`
- `security_events(type)`, `security_events(severity)`, `security_events(createdAt)`
- `audit_log(action)`, `audit_log(userId)`, `audit_log(createdAt)`
- u.v.m.

---

## 4. Sicherheitsarchitektur

### 4.1 Schichtenmodell

```
┌─────────────────────────────────────┐
│  1. Transport Security (TLS/HTTPS)  │
├─────────────────────────────────────┤
│  2. Rate Limiting (Sliding Window)  │
├─────────────────────────────────────┤
│  3. Authentication (JWT + MFA)      │
├─────────────────────────────────────┤
│  4. Authorization (RBAC)            │
├─────────────────────────────────────┤
│  5. Input Validation                │
├─────────────────────────────────────┤
│  6. Encryption at Rest (AES-256)    │
├─────────────────────────────────────┤
│  7. Audit Logging                   │
├─────────────────────────────────────┤
│  8. Kill-Switch (Emergency Stop)    │
└─────────────────────────────────────┘
```

### 4.2 Authentifizierung

- **JWT**: HS256, 24h Gültigkeit, Bearer-Schema
- **MFA**: TOTP (SHA1, 6 Digits, 30s Period) via `otpauth`
- **Backup-Codes**: 8 Einmal-Codes bei MFA-Setup
- **Token-Refresh**: Erneuerung vor Ablauf

### 4.3 Autorisierung (RBAC)

| Rolle | Berechtigungen |
|-------|---------------|
| `admin` | Vollzugriff (alle Endpunkte) |
| `operator` | CRUD auf Agents, Tasks; Lesen von Analytics |
| `viewer` | Nur-Lese-Zugriff |

In Development-Mode (`NODE_ENV !== 'production'`): `optionalAuth` erlaubt anonymen Zugriff.

### 4.4 Verschlüsselung

- **AES-256-GCM** für Secrets Vault
- 96-bit IV (zufällig generiert pro Verschlüsselung)
- Auth-Tag für Integritätsprüfung
- Key-Rotation über `rotateSecret()`

### 4.5 Kill-Switch-System

```
killSwitchMonitor (30s Polling)
    │
    ├── Prüft: Task Error Rate > Threshold
    ├── Prüft: Failed Agents > Threshold
    └── Prüft: Overall Failure Rate > Threshold
         │
         ▼
    Auto-ARM → Alle Agents → status = 'suspended'
                Security Event geloggt
                WebSocket Broadcast
```

---

## 5. LLM-Integration

### 5.1 Provider-Architektur

```
Frontend (LLMSettingsView)
    │
    ├── Provider-Registry (llmProviders.ts)
    │   ├── Anthropic (Claude 4.5/4.6)
    │   ├── OpenAI (GPT-4.1, o3)
    │   ├── Ollama (lokal)
    │   ├── Google (Gemini 2.5)
    │   ├── Mistral
    │   ├── Groq
    │   ├── OpenRouter
    │   └── Custom Endpoint
    │
    └── Per-Request Headers
        ├── x-llm-api-key
        ├── x-llm-provider
        └── x-llm-model

Backend (chat.ts → callLLM)
    │
    ├── anthropic → @anthropic-ai/sdk
    ├── openai → openai SDK
    ├── ollama → HTTP fetch → localhost:11434
    └── Fallback → Simulated Response
```

### 5.2 Datenfluss Chat

```
User Message → POST /api/chat/sessions/:id/messages
    │
    ├── 1. User-Message in DB speichern
    ├── 2. Response sofort senden (201)
    ├── 3. Agent-Kontext laden (Personality, Parameters)
    ├── 4. Letzte 10 Messages als Context
    ├── 5. callLLM() → Provider API
    ├── 6. Agent-Response in DB speichern
    └── 7. WebSocket Broadcast
```

---

## 6. Caching-Strategie

### 6.1 In-Memory TTL Cache

```
┌─────────────────────────────────────────┐
│  MemoryCache                            │
│                                         │
│  queryCache  (TTL: 30s, Max: 500)       │
│  └── DB-Abfragen cachen                │
│                                         │
│  apiCache    (TTL: 10s, Max: 200)       │
│  └── API-Aggregationen cachen          │
│                                         │
│  sessionCache (TTL: 5min, Max: 100)     │
│  └── Session-Daten cachen             │
│                                         │
│  Cache-Middleware für GET-Requests:      │
│  Key = URL + Query-String               │
│  Automatic Expiry + LRU Eviction        │
└─────────────────────────────────────────┘
```

### 6.2 Cache-Invalidierung

- Automatisch nach TTL-Ablauf
- Manuell bei Write-Operationen (POST/PATCH/DELETE invalidieren zugehörige GET-Caches)

---

## 7. Datenbank-Architektur

### 7.1 SQLite-Entscheidung

| Kriterium | SQLite | PostgreSQL |
|-----------|--------|-----------|
| Setup | Kein Server nötig | Server erforderlich |
| Performance (< 100 User) | Excellent | Overkill |
| Backup | Datei kopieren | pg_dump |
| Concurrency | WAL-Modus (Lesen parallel) | Vollständig parallel |
| Deployment | Zero-Config | Konfiguration nötig |

**Entscheidung:** SQLite mit WAL-Modus deckt alle Anforderungen für den vorgesehenen Einsatz ab.

### 7.2 WAL-Modus

- **Write-Ahead Logging** ermöglicht gleichzeitige Lese- und Schreibzugriffe
- Automatisch aktiviert bei DB-Initialisierung
- Checkpoint bei Backups (`PRAGMA wal_checkpoint`)

### 7.3 Backup-Strategie

```
Scheduler (alle 6h)
    │
    ├── WAL Checkpoint (TRUNCATE)
    ├── Datei kopieren → backups/backup-<timestamp>.db
    ├── Rotation: Max 10 Backups behalten
    └── Älteste löschen
```

---

## 8. Testing-Architektur

### 8.1 Test-Pyramide

```
        ┌───────┐
        │  E2E  │  35 Integration-Tests (6 Workflow-Suiten)
        ├───────┤
        │ Perf. │  27 Performance-Tests (Load, Stress, Endurance)
        ├───────┤
        │ Sec.  │  35+ Security-Tests (OWASP Top 10)
        ├───────┤
        │ Comp. │  98 Frontend-Komponenten-Tests
        ├───────┤
        │ Unit  │  280 Backend Unit-Tests (24 Dateien)
        └───────┘
        Total: 475+ Tests
```

### 8.2 Test-Infrastruktur

- **Framework:** Vitest 4.0 (Backend + Frontend)
- **Backend:** supertest + SQLite `:memory:` DB
- **Frontend:** @testing-library/react + jsdom
- **Coverage:** v8 Provider, Ziel > 85%

---

## 9. Entscheidungsprotokoll (ADR)

### ADR-001: SQLite statt PostgreSQL/MongoDB

**Kontext:** Eingebettete Anwendung, < 100 gleichzeitige Benutzer
**Entscheidung:** SQLite mit WAL-Modus
**Begründung:** Zero-Config, Datei-basiertes Backup, ausreichende Performance
**Konsequenz:** Kein separater DB-Server nötig

### ADR-002: Express 5 statt Fastify/Hono

**Kontext:** Ausgereiftes Ökosystem, Team-Vertrautheit
**Entscheidung:** Express 5.1
**Begründung:** Stabiles API, große Middleware-Bibliothek
**Konsequenz:** Etwas weniger Performance als Alternativen, aber breite Kompatibilität

### ADR-003: In-Memory-Cache statt Redis

**Kontext:** Single-Server-Deployment, kein Cluster
**Entscheidung:** Eigener MemoryCache mit TTL
**Begründung:** Keine externe Abhängigkeit, ausreichend für Single-Instance
**Konsequenz:** Cache geht bei Neustart verloren (akzeptabel)

### ADR-004: TOTP statt SMS-MFA

**Kontext:** Keine SMS-Infrastruktur, höhere Sicherheit
**Entscheidung:** TOTP via Authenticator-App
**Begründung:** Kein SMS-Provider nötig, sicherer als SMS (SIM-Swapping)
**Konsequenz:** Benutzer benötigen Authenticator-App

### ADR-005: JWT statt Session-Cookies

**Kontext:** API-first Architektur, SPA-Frontend
**Entscheidung:** JWT Bearer Tokens
**Begründung:** Stateless Backend, einfache API-Integration
**Konsequenz:** 24h Gültigkeit, Token-Refresh erforderlich

---

## 10. Vision & Geschäftsziele

> Inhalt übernommen aus dem Konzeptdokument `docs/archive/AGENTIC_WORKSPACE_KONZEPT.md` (Januar 2026) und auf den IST-Stand des Genesis Release angepasst.

### 10.1 Vision

Ein System, das nicht nur funktioniert — sondern das, was es tut, mit Würde tut.

Der Valtheron Agentic Workspace ist nicht gebaut worden, um zu beeindrucken. Er ist gebaut worden, um zu dienen: als verlässliches Fundament für autonome Operationen, bei denen jeder Fehler Konsequenzen hat und jede Entscheidung nachvollziehbar sein muss.

### 10.2 Kernfunktionalität

- **Multi-Agent-Orchestrierung** — Verwaltung und Koordination von 200 (Standard) bzw. 290 (Erweitert) spezialisierten Agenten mit unterschiedlichen Rollen und Fähigkeiten.
- **Dynamisches Agent-Loading** — Spezialisierte Personas mit Custom Instructions als System-Prompts, filterbar nach Kategorie.
- **Multi-Agent-Zusammenarbeit** — Kollaborative Sessions, in denen mehrere Agenten gemeinsam an gemeinsamen Dateien und Problemen arbeiten.
- **Gemeinsamer Dateikontext** — Versionsverfolgte Code-Snippets, Logs und Dokumente, auf die mehrere Agenten zugreifen können.
- **Anforderungsextraktion** — Parsing von Anforderungen aus URLs in strukturierte Aufgabenlisten.
- **Kill-Switch-Schutz** — Sofortige Deaktivierung von Agenten außerhalb der Risikoparameter mit automatischen Eigentümer-Benachrichtigungen.
- **Vollständiger Audit-Trail** — Lückenlose Protokollierung aller Agent-Interaktionen für Compliance, Debugging und Leistungsanalyse.

### 10.3 Zielgruppe

Organisationen und Entwickler, die autonome KI-Agenten für komplexe, mehrstufige Operationen einsetzen — z. B. FinTech, Sicherheitsunternehmen, Software-Entwicklungsteams und strategische Operationszentren.

### 10.4 Primäre Geschäftsziele

| Ziel | Beschreibung |
|------|--------------|
| **Autonomie & Effizienz** | Vollständig autonome Operationen ohne menschliche Eingriffe; Zielreduktion der Durchlaufzeit um 70 %. |
| **Transparenz & Kontrolle** | Echtzeit-Audit-Trails über alle Agent-Aktivitäten; Kill-Switch zur Risikokontrolle. |
| **Skalierbarkeit** | Bis zu 200 (bzw. 290) gleichzeitig arbeitende Agenten; Verwaltung von Millionen Aufgaben pro Tag. |
| **Zuverlässigkeit** | Systemverfügbarkeit 99,99 % mit automatischem Failover und Disaster Recovery. |

### 10.5 Sekundäre Geschäftsziele

- **Benutzerfreundlichkeit** — Intuitive UI, auch für Nicht-Techniker.
- **Erweiterbarkeit** — Modulare Architektur für neue Agent-Typen und Funktionen.
- **Sicherheit** — Enterprise-Grade-Sicherheit mit Verschlüsselung, Authentifizierung und Autorisierung.

---

## 11. Anforderungen (FR / NFR)

> Inhalt übernommen aus `docs/archive/AGENTIC_WORKSPACE_KONZEPT.md`, Abschnitt „Anforderungsanalyse".

### 11.1 Funktionale Anforderungen

| ID | Bereich | Anforderung |
|----|---------|-------------|
| **FR1** | Agent-Management | Profil-Verwaltung, Konfiguration (System-Prompts, Parameter), Status-Tracking, Leistungsmetriken (Erfolgsquote, Dauer, Fehlerquote). |
| **FR2** | Task-Management | Erstellung mit Beschreibung/Priorität/Deadline, automatische und manuelle Zuweisung, Status-Verfolgung, Abhängigkeiten. |
| **FR3** | Collaboration | Shared Workspace, File-Sharing, Versionskontrolle, Agent-zu-Agent-Kommunikation. |
| **FR4** | Audit & Compliance | Activity Logging, vollständiger Audit-Trail, RBAC, automatische Compliance-Berichte. |
| **FR5** | Risk Management | Kill-Switch, Risikoparameter, Alerts, Rollback. |
| **FR6** | Monitoring & Analytics | Real-time Dashboard, Performance-Metriken, Analytics, Reporting. |

### 11.2 Nicht-funktionale Anforderungen

| ID | Bereich | Anforderung |
|----|---------|-------------|
| **NFR1** | Performance | ≥ 10.000 Aufgaben/min Durchsatz, < 200 ms Latenz für Dashboard-Operationen, 200+ gleichzeitige Agenten. |
| **NFR2** | Verfügbarkeit | 99,99 % Uptime, Failover < 30 s, Disaster Recovery < 1 h, tägliche Backups (30 Tage Aufbewahrung). |
| **NFR3** | Sicherheit | MFA für alle Benutzer, End-to-End-Verschlüsselung, RBAC mit granularen Berechtigungen, vollständige Audit-Trails. |
| **NFR4** | Wartbarkeit | ≥ 80 % Test-Coverage, umfassende API-Doku, proaktives Monitoring, Updates ohne Downtime. |

---

## 12. Personas & Agent-Modell

> Konzeptionelle Grundlage übernommen aus `docs/archive/MASTER_ANLEITUNG.md`. Implementierungsdetails siehe `the-290-agent-database/`.

### 12.1 Was sind die Personas?

Personas sind **spezialisierte Rollen-Definitionen mit Custom Instructions**, die als System-Prompts für KI-Agenten fungieren. Sie ermöglichen es, ein einzelnes LLM-Modell in viele spezialisierte Rollen zu transformieren.

- **Standard-Set:** 200 Personas, organisiert in **10 Kategorien × 20 Personas**.
- **Erweitertes Set:** 290 Personas (siehe `the-290-agent-database/`).
- Jede Persona hat ein konsistentes Schema mit 7 Kernattributen: Nummer, Name, Kategorie, Hintergrund, Antwortformat, Beschreibung, Favoriten.

### 12.2 Die 10 Kategorien (Standard-Set)

| # | Kategorie | Domäne |
|---|-----------|--------|
| 1 | Gesundheitsexperten | Health & Wellness |
| 2 | Analytiker | Data Analysis & Insights |
| 3 | Marketer | Marketing & Growth |
| 4 | Produzenten | Production & Operations |
| 5 | Unternehmer | Entrepreneurship & Business |
| 6 | Entertainer | Entertainment & Media |
| 7 | Lehrer | Education & Training |
| 8 | Schriftsteller | Content & Writing |
| 9 | E-Commerce | E-Commerce & Sales |
| 10 | Entwickler | Development & Infrastructure |

### 12.3 Aufbau der Custom Instructions

Jede Persona definiert in ihren Custom Instructions u. a.:

```
Beruf/Rolle, Aktuelle Projekte/Herausforderungen,
Spezifische Interessen, Werte und Prinzipien,
Lernstil, Persönlicher Hintergrund, Ziele,
Präferenzen, Sprachkompetenz, Spezialisiertes Wissen,
Bildungshintergrund, Art zu Kommunizieren
```

### 12.4 Terminologie

Im aktuellen Sprachgebrauch der Plattform wird statt „Person" der Begriff **„Digital Persona"** verwendet — eine spezialisierte Konfiguration eines KI-Modells mit definierten Rollen, Fähigkeiten, Verhaltensrichtlinien und Sicherheitsparametern. Damit wird Anthropomorphisierung vermieden und die technische Natur klar kommuniziert.

### 12.5 Verbindung zur Implementierung

- DB-Tabelle `agents` (siehe Abschnitt 3) hält die operative Agent-Definition (Name, Kategorie, Rolle, LLM-Provider, Personality, Parameters).
- Die Persona-Custom-Instructions werden in den Personality- und Parameter-Feldern bzw. als System-Prompt zur LLM-Aufruf-Zeit eingespielt (siehe Abschnitt 5.2 „Datenfluss Chat").
- Erweitertes 290-Agenten-Set inklusive Capability-Model und Provenance-Tracking ist im Verzeichnis `the-290-agent-database/` dokumentiert.

---

*Valtheron Agentic Workspace v1.0.0 — Architektur-Dokumentation*
