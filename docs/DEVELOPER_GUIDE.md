# Entwickler-Handbuch — Valtheron Agentic Workspace

**Version:** 1.0.0
**Datum:** Februar 2026

---

## Inhaltsverzeichnis

1. [Projektstruktur](#1-projektstruktur)
2. [Entwicklungsumgebung](#2-entwicklungsumgebung)
3. [Backend-Architektur](#3-backend-architektur)
4. [Frontend-Architektur](#4-frontend-architektur)
5. [Datenbank](#5-datenbank)
6. [API-Entwicklung](#6-api-entwicklung)
7. [LLM-Integration](#7-llm-integration)
8. [Testing](#8-testing)
9. [Code-Qualität](#9-code-qualitaet)
10. [Contributing](#10-contributing)

---

## 1. Projektstruktur

```
valtheron-workspace/
├── backend/
│   ├── src/
│   │   ├── __tests__/        # Test-Dateien (Vitest)
│   │   ├── db/
│   │   │   ├── schema.ts     # SQLite-Schema + Migrations
│   │   │   └── seed.ts       # Initiale Testdaten
│   │   ├── middleware/
│   │   │   ├── auth.ts       # JWT + RBAC Middleware
│   │   │   ├── cache.ts      # In-Memory TTL Cache
│   │   │   └── rateLimiter.ts# Sliding-Window Rate Limiter
│   │   ├── routes/
│   │   │   ├── agents.ts     # Agent CRUD
│   │   │   ├── analytics.ts  # Dashboard, Performance, SLA, Export
│   │   │   ├── auth.ts       # Login, Register, MFA, Refresh
│   │   │   ├── backup.ts     # Backup/Restore
│   │   │   ├── chat.ts       # Chat Sessions + LLM Integration
│   │   │   ├── collaboration.ts # Multi-Agent Sessions
│   │   │   ├── files.ts      # File Sharing + Versioning
│   │   │   ├── notifications.ts # Push Notifications
│   │   │   ├── secrets.ts    # Encrypted Secrets Vault
│   │   │   ├── security.ts   # Kill-Switch, Events, Audit
│   │   │   ├── tasks.ts      # Task CRUD + Kanban
│   │   │   ├── tree.ts       # Project Tree
│   │   │   └── workflows.ts  # Workflow Execution
│   │   ├── services/
│   │   │   ├── encryption.ts # AES-256-GCM
│   │   │   ├── killSwitchMonitor.ts # Auto-Trigger Engine
│   │   │   └── websocket.ts  # WebSocket Broadcast
│   │   └── app.ts            # Express App Factory
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── __tests__/        # Component + Unit Tests
│   │   ├── components/       # React-Komponenten
│   │   │   ├── AgentsView.tsx
│   │   │   ├── AnalyticsView.tsx
│   │   │   ├── ChatView.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── DashboardView.tsx
│   │   │   ├── KanbanView.tsx
│   │   │   ├── KillSwitchView.tsx
│   │   │   ├── LLMSettingsView.tsx
│   │   │   ├── LoginView.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── services/
│   │   │   ├── api.ts        # HTTP Client + Token Management
│   │   │   └── llmProviders.ts # LLM Provider Registry
│   │   ├── types/index.ts    # TypeScript Interfaces
│   │   └── App.tsx           # Root Component
│   ├── package.json
│   └── vite.config.ts
├── docs/                     # Dokumentation
├── scripts/                  # Utility-Skripte
└── docker-compose.yml
```

---

## 2. Entwicklungsumgebung

### 2.1 Voraussetzungen

- **Node.js 22+** (empfohlen: über `nvm`)
- **npm 10+**
- **Git**

### 2.2 Setup

```bash
# Repository klonen
git clone <repository-url>
cd valtheron-workspace

# Backend
cd backend
npm install
cp .env.example .env
npm run dev    # Startet auf Port 3001

# Frontend (neues Terminal)
cd frontend
npm install
npm run dev    # Startet auf Port 5173
```

### 2.3 Skripte

| Bereich | Befehl | Beschreibung |
|---------|--------|-------------|
| Backend | `npm run dev` | Development Server (ts-node, auto-reload) |
| Backend | `npm run build` | TypeScript → JavaScript kompilieren |
| Backend | `npm test` | Alle Tests ausführen |
| Backend | `npm run test:coverage` | Tests mit Coverage-Report |
| Frontend | `npm run dev` | Vite Dev-Server (HMR) |
| Frontend | `npm run build` | Produktions-Build |
| Frontend | `npm test` | Alle Tests ausführen |
| Frontend | `npm run test:coverage` | Tests mit Coverage-Report |

---

## 3. Backend-Architektur

### 3.1 Tech-Stack

| Technologie | Version | Zweck |
|------------|---------|-------|
| Express | 5.1 | HTTP Framework |
| better-sqlite3 | — | Eingebettete Datenbank |
| jsonwebtoken | — | JWT Auth |
| otpauth | — | TOTP MFA |
| @anthropic-ai/sdk | 0.78.0 | Anthropic LLM |
| openai | 6.23.0 | OpenAI LLM |
| uuid | — | ID-Generierung |

### 3.2 App-Factory-Pattern

Die `createApp()` Funktion in `app.ts` erzeugt eine neue Express-App mit:
- Middleware-Chain (JSON, CORS, Auth, Cache, Rate-Limiting)
- Route-Mounting (11 Router)
- Error-Handler

```typescript
import { createApp } from './app.js';
const app = createApp();
app.listen(3001);
```

### 3.3 Middleware-Pipeline

```
Request → CORS → JSON-Parser → [optionalAuth/requireAuth] → [requireRole] → [cache] → Route Handler → Response
```

- **optionalAuth**: Extrahiert JWT wenn vorhanden, erlaubt anonymen Zugriff in dev
- **requireAuth**: JWT erforderlich (401 wenn fehlt)
- **requireRole(role)**: RBAC-Prüfung (403 wenn nicht autorisiert)
- **cache(ttl)**: In-Memory GET-Response-Cache

### 3.4 Neue Route hinzufügen

```typescript
// backend/src/routes/myfeature.ts
import { Router } from 'express';
import { getDb } from '../db/schema.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const items = db.prepare('SELECT * FROM my_table').all();
  res.json({ items });
});

export default router;
```

```typescript
// In app.ts hinzufügen:
import myFeatureRouter from './routes/myfeature.js';
app.use('/api/myfeature', adminGuard, myFeatureRouter);
```

---

## 4. Frontend-Architektur

### 4.1 Tech-Stack

| Technologie | Version | Zweck |
|------------|---------|-------|
| React | 19 | UI-Framework |
| Vite | 7.3 | Build Tool + Dev-Server |
| TailwindCSS | 3.4 | Utility-First CSS |
| Lucide React | — | Icon Library |
| TypeScript | 5.9 | Typsicherheit |

### 4.2 State-Management

Die App verwendet **lokalen State** in `App.tsx` mit `useState`:

```typescript
const [agents, setAgents] = useState<Agent[]>([]);
const [tasks, setTasks] = useState<Task[]>([]);
const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
const [killSwitch, setKillSwitch] = useState<KillSwitch>({...});
```

Daten werden beim Login via `apiFetch()` geladen und bei Aktionen aktualisiert.

### 4.3 Neue Komponente erstellen

```typescript
// frontend/src/components/MyView.tsx
import React from 'react';
import type { Agent } from '../types';

interface MyViewProps {
  agents: Agent[];
}

export default function MyView({ agents }: MyViewProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My View</h1>
      {/* UI hier */}
    </div>
  );
}
```

### 4.4 Command Palette

Neue Views automatisch in die Command Palette eintragen:

```typescript
// In CommandPalette.tsx → views Array
{ id: 'myview', label: 'My View', icon: '⭐' },
```

---

## 5. Datenbank

### 5.1 SQLite mit better-sqlite3

- **Synchrone API** (kein async/await nötig)
- **WAL-Modus** für bessere Concurrency
- **Foreign Keys** aktiviert
- **:memory:** Datenbank für Tests

### 5.2 Schema

17 Tabellen: `users`, `agents`, `tasks`, `task_dependencies`, `security_events`, `audit_log`, `chat_sessions`, `chat_messages`, `collaboration_sessions`, `collaboration_messages`, `workflow_definitions`, `workflow_steps`, `workflow_instances`, `shared_files`, `project_tree_nodes`, `notifications`, `secrets`

### 5.3 Neue Tabelle hinzufügen

```typescript
// In schema.ts → initializeDatabase()
db.exec(`
  CREATE TABLE IF NOT EXISTS my_table (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`);

// Index hinzufügen
db.exec('CREATE INDEX IF NOT EXISTS idx_my_table_name ON my_table(name)');
```

### 5.4 Queries

```typescript
const db = getDb();

// SELECT
const items = db.prepare('SELECT * FROM agents WHERE status = ?').all('active');

// INSERT
db.prepare('INSERT INTO agents (id, name) VALUES (?, ?)').run(id, name);

// UPDATE
db.prepare('UPDATE agents SET status = ? WHERE id = ?').run('idle', id);

// Transaction
db.transaction(() => {
  db.prepare('...').run();
  db.prepare('...').run();
})();
```

---

## 6. API-Entwicklung

### 6.1 Konventionen

- **REST-konform**: GET (lesen), POST (erstellen), PATCH (aktualisieren), DELETE (löschen)
- **JSON-Response**: Immer `res.json({...})` zurückgeben
- **Error-Format**: `{ error: "Fehlermeldung" }`
- **Status-Codes**: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)

### 6.2 Auth-Guards

```typescript
// Kein Auth (öffentlich)
app.use('/api/health', healthRouter);

// Optional Auth (dev-mode bypassed)
app.use('/api/agents', adminGuard, agentsRouter);

// Strict Auth
app.use('/api/secrets', requireAuth, requireRole('admin'), secretsRouter);
```

### 6.3 Vollständige API-Referenz

Siehe `docs/API.md` für alle 89 Endpunkte mit Request/Response-Formaten.

---

## 7. LLM-Integration

### 7.1 Unterstützte Provider

| Provider | Backend | Frontend |
|----------|---------|----------|
| Anthropic | ✅ | ✅ |
| OpenAI | ✅ | ✅ |
| Ollama | ✅ | ✅ |
| Google | — | ✅ (Config) |
| Mistral | — | ✅ (Config) |
| Groq | — | ✅ (Config) |
| OpenRouter | — | ✅ (Config) |
| Custom | ✅ | ✅ (Config) |

### 7.2 Provider per Header

```bash
curl -X POST /api/chat/sessions/:id/messages \
  -H "x-llm-api-key: sk-..." \
  -H "x-llm-provider: anthropic" \
  -H "x-llm-model: claude-sonnet-4-5-20250929" \
  -d '{"content": "Hallo!"}'
```

### 7.3 Neuen Provider hinzufügen

In `backend/src/routes/chat.ts` → `callLLM()`:

```typescript
if (provider === 'myprovider') {
  // API-Client initialisieren
  // Messages senden
  // Antwort extrahieren
  return responseText;
}
```

### 7.4 Fallback-Modus

Ohne API-Key generiert das System simulierte Antworten basierend auf:
- Agent-Kategorie (trading, security, development, etc.)
- Persönlichkeitsprofil (formal, casual, technical, diplomatic)
- Zufällige domänenspezifische Antworten

---

## 8. Testing

### 8.1 Test-Framework

- **Vitest 4.0** für Backend und Frontend
- **@testing-library/react** + **jsdom** für Component-Tests
- **supertest** für API-Tests

### 8.2 Tests ausführen

```bash
# Backend
cd backend && npm test                    # Alle Tests
cd backend && npx vitest run --coverage   # Mit Coverage

# Frontend
cd frontend && npm test                   # Alle Tests
cd frontend && npx vitest run --coverage  # Mit Coverage
```

### 8.3 Test-Struktur

```typescript
// backend/src/__tests__/myfeature.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

let app: Express;
let token: string;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  app = createApp();
  // Register + Login für Auth-Token
});

describe('MyFeature', () => {
  it('returns list', async () => {
    const res = await request(app)
      .get('/api/myfeature')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
```

### 8.4 Coverage-Ziele

| Bereich | Ziel | Aktuell |
|---------|------|---------|
| Backend Lines | > 85% | 87.8% |
| Frontend Lines | > 70% | ~70% |
| Backend Branches | > 75% | ~80% |

---

## 9. Code-Qualität

### 9.1 Linting

```bash
cd backend && npx eslint src/
cd frontend && npx eslint src/
```

### 9.2 Formatting

```bash
npx prettier --write "**/*.{ts,tsx,json,md}"
```

### 9.3 Pre-Commit Hooks

Konfiguriert via lint-staged:
- ESLint auf geänderte `.ts/.tsx` Dateien
- Prettier auf alle geänderten Dateien

### 9.4 Security-Scans

```bash
# SAST (statische Analyse)
./scripts/security-audit.sh

# DAST (dynamische Analyse gegen laufenden Server)
./scripts/dast-scanner.sh

# Dependency-Scanning
npm audit
```

---

## 10. Contributing

### 10.1 Branch-Konvention

- `main` — Produktionscode
- `develop` — Entwicklungs-Branch
- `feature/<name>` — Feature-Branches
- `fix/<name>` — Bugfix-Branches
- `claude/<task>-<id>` — KI-generierte Branches

### 10.2 Commit-Konvention

```
<type>: <kurze beschreibung>

<optionale details>
```

Typen: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`

### 10.3 Pull-Request-Prozess

1. Feature-Branch von `develop` abzweigen
2. Änderungen implementieren
3. Tests schreiben und bestehen lassen
4. PR erstellen mit Beschreibung
5. Code-Review
6. Merge nach `develop`

---

*Valtheron Agentic Workspace v1.0.0 — Entwickler-Handbuch*
