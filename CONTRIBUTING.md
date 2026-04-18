# Contributing Guide — Valtheron Agentic Workspace

**Für:** Entwickler, KI-Agenten, externe Mitarbeiter
**Stand:** 08.03.2026

---

## 1. Grundregeln (immer einhalten)

1. **Kein direktes Pushen auf `main`** — ausnahmslos
2. **Alle Tests müssen bestehen** bevor ein PR geöffnet wird
3. **Conventional Commits** für alle Commit-Messages
4. **Branch-Naming-Konvention** einhalten (siehe unten)
5. **Kein `--no-verify`** bei git commits — Pre-commit-Hooks sind Pflicht
6. **Kein `--force` Push** ohne explizite Erlaubnis

---

## 2. Branch-Strategie

### Branch-Typen

| Branch | Zweck | Wer darf pushen |
|--------|-------|----------------|
| `main` | Produktionsstand | Nur via PR + Review |
| `claude/<beschreibung>-<session-id>` | Feature/Fix durch AI-Agenten | Agent (automatisch) |
| `feature/<beschreibung>` | Neue Features durch Menschen | Entwickler |
| `fix/<beschreibung>` | Bug-Fixes durch Menschen | Entwickler |
| `docs/<beschreibung>` | Nur Dokumentation | Alle |

### Branch-Naming für KI-Agenten (KRITISCH)

KI-Agenten (Claude Code, etc.) **müssen** folgendes Schema einhalten:

```
claude/<kurze-beschreibung>-<session-id>
```

Beispiele:
- `claude/fix-ubuntu-startup-h7rJg`
- `claude/add-postgresql-support-x2Kpm`
- `claude/improve-analytics-dashboard-R9qWs`

> **Achtung:** Push schlägt mit HTTP 403 fehl, wenn der Branch nicht mit `claude/` beginnt und mit der korrekten Session-ID endet.

---

## 3. Entwicklungs-Workflow

### Schritt 1 — Branch erstellen

```bash
# Von main abzweigen
git checkout main
git pull origin main
git checkout -b feature/mein-feature
```

### Schritt 2 — Entwickeln & Testen

```bash
# Entwickeln...

# Tests laufen lassen (PFLICHT vor commit)
cd backend && npm test
cd ../frontend && npm test

# Linting prüfen
cd backend && npm run lint
cd ../frontend && npm run lint
```

### Schritt 3 — Committen

```bash
# Nur relevante Dateien hinzufügen (nie git add -A)
git add backend/src/routes/agents.ts
git add backend/src/__tests__/agents.test.ts

# Commit mit Conventional Commits Schema
git commit -m "feat: add pagination support to agents list endpoint"
```

### Schritt 4 — Push & Pull Request

```bash
git push -u origin feature/mein-feature
```

PR erstellen auf GitHub mit:
- Klarem Titel (max 70 Zeichen)
- Beschreibung: Was wurde geändert? Warum?
- Test-Plan: Wie wurde getestet?
- Screenshots bei UI-Änderungen

### Schritt 5 — Review & Merge

- Mindestens 1 Review erforderlich
- Alle GitHub Actions müssen grün sein
- Squash-Merge bevorzugt für saubere Historie

---

## 4. Commit-Message-Format

### Schema

```
<typ>(<scope>): <kurze beschreibung>

[optionaler detaillierter body]

[optionaler footer, z.B. "Closes #123"]
```

### Typen

| Typ | Wann verwenden |
|-----|---------------|
| `feat` | Neue Funktionalität |
| `fix` | Bug-Behebung |
| `docs` | Nur Dokumentationsänderungen |
| `test` | Tests hinzufügen oder ändern |
| `refactor` | Code-Umbau ohne Verhaltensänderung |
| `perf` | Performance-Verbesserung |
| `chore` | Build, Dependencies, Config |
| `ci` | CI/CD-Änderungen |

### Scopes (optional aber empfohlen)

`agents`, `tasks`, `auth`, `chat`, `analytics`, `kill-switch`, `workflows`, `backend`, `frontend`, `docs`, `db`, `security`

### Beispiele

```
feat(agents): add bulk status update endpoint
fix(auth): handle expired JWT gracefully with 401 response
docs(onboarding): add local setup instructions
test(analytics): add coverage for SLA calculation
refactor(db): extract schema to separate module
chore(deps): update vitest to 4.0.3
```

---

## 5. Code-Standards

### TypeScript

```typescript
// RICHTIG — explizite Typen
const fetchAgents = async (filter: AgentFilter): Promise<Agent[]> => { ... }

// FALSCH — any ohne Begründung
const fetchAgents = async (filter: any): Promise<any> => { ... }

// RICHTIG — Interface in types/index.ts definieren
// FALSCH — inline-Typen für wiederverwendbare Strukturen
```

### Backend (Express)

- Fehler immer an `next(error)` weitergeben, nie selbst Response senden
- Authentifizierung via `authenticate`-Middleware aus `middleware/auth.ts`
- RBAC via `authorize(['admin', 'operator'])`-Middleware
- Neue Routen in `routes/` anlegen, in `app.ts` registrieren
- Business Logic in `services/` auslagern, nicht in Routes

```typescript
// RICHTIG — Route delegiert an Service
router.get('/', authenticate, async (req, res, next) => {
  try {
    const agents = await agentService.getAll(req.query);
    res.json(agents);
  } catch (err) {
    next(err);
  }
});
```

### Frontend (React)

- Komponenten in `components/` als `.tsx`-Dateien
- State lokal halten, keine globalen State-Libraries
- API-Calls über `services/api.ts` (zentraler HTTP-Client)
- Props-Types inline definieren für kleine Komponenten, `types/index.ts` für geteilte Types

### Datenbank

- Schema-Änderungen **immer** in `backend/src/db/schema.ts`
- Neue Tabellen: Index auf alle frequently-queried Spalten anlegen
- Migrations werden beim Start automatisch ausgeführt (schema.ts re-evaluiert)
- **Keine Breaking Changes** an bestehenden Tabellen ohne Datenmigration

---

## 6. Testing-Pflichten

### Mindestanforderungen

| Was | Anforderung |
|-----|-------------|
| Backend Coverage | > 85% Lines |
| Neue Backend-Features | Mindestens 5 Unit-Tests |
| Neue API-Endpunkte | Request/Response-Tests (Supertest) |
| Frontend-Komponenten | Render + Interaktions-Test |
| Security-Features | Explizite Security-Tests |
| Alle Tests gesamt | 100% Pass Rate |

### Test-Datei-Naming

```
backend/src/__tests__/<modul-name>.test.ts
frontend/src/__tests__/<Komponenten-Name>.test.tsx
```

### Test-Struktur

```typescript
describe('AgentService', () => {
  beforeEach(() => { /* Setup */ });
  afterEach(() => { /* Cleanup */ });

  describe('getAll', () => {
    it('should return all agents', async () => { ... });
    it('should filter by category', async () => { ... });
    it('should handle empty result', async () => { ... });
  });
});
```

### Tests ausführen

```bash
cd backend && npm test              # Einmalig
cd backend && npm run test:watch    # Watch-Mode
cd backend && npm run test:coverage # Mit Coverage-Report

cd frontend && npm test
cd frontend && npm run test:coverage
```

---

## 7. Security-Checkliste (vor jedem PR)

Prüfe vor dem PR-Öffnen:

- [ ] Keine API-Keys, Passwörter oder Secrets im Code
- [ ] Keine `eval()`, `Function()` oder ähnliches
- [ ] User-Input wird validiert (nicht blind an DB weitergegeben)
- [ ] Neue Endpunkte haben `authenticate`-Middleware
- [ ] Sensitive Operationen haben `authorize`-Middleware
- [ ] Keine SQL-Injection-Vektoren (ORM/prepared statements nutzen)
- [ ] `npm audit` zeigt keine neuen High/Critical Vulnerabilities

```bash
# Security-Scan lokal ausführen
cd backend && npm audit --omit=dev
cd frontend && npm audit --omit=dev
bash scripts/security-audit.sh
```

---

## 8. Umgebungsvariablen

**Neue Umgebungsvariablen:**
1. In `backend/.env.example` und `frontend/.env.example` dokumentieren
2. In `docs/DEPLOYMENT_GUIDE.md` erklären
3. Nie echte Werte committen (`.gitignore` prüfen)

---

## 9. Dokumentations-Updates

Wenn du folgendes änderst, aktualisiere auch die entsprechende Doku:

| Änderung | Dokument updaten |
|----------|-----------------|
| Neuer API-Endpunkt | `docs/API.md` |
| Neue Konfiguration | `docs/DEPLOYMENT_GUIDE.md` + `docs/ONBOARDING.md` |
| Neue DB-Tabelle/Spalte | `docs/ARCHITECTURE.md` |
| Neue UI-Funktionalität | `docs/USER_GUIDE.md` |
| Breaking Changes | `CHANGELOG.md` + `RELEASE_NOTES.md` |

---

## 10. PR-Template

Beim Erstellen eines PRs, folgendes einbeziehen:

```markdown
## Was wurde geändert?
[Kurze Beschreibung]

## Warum?
[Begründung / verlinktes Issue]

## Wie wurde getestet?
- [ ] Unit Tests
- [ ] Manuelle Tests (Browser)
- [ ] Linting OK
- [ ] Security-Checkliste OK

## Screenshots (bei UI-Änderungen)
[Vorher / Nachher]
```

---

## 11. Häufige Fehler vermeiden

| Fehler | Vermeidung |
|--------|-----------|
| `git add .` verwendet | Nur spezifische Dateien hinzufügen |
| Tests nicht ausgeführt | Immer `npm test` vor commit |
| Auf `main` gepusht | Branch-Schutz verhindert das, trotzdem merken |
| `.env`-Datei committet | `.gitignore` prüfen |
| `any`-Typ in TypeScript | Explizite Typen definieren |
| Force-Push ohne Erlaubnis | Alternativen suchen (rebase, neue commits) |
| Pre-commit Hook mit `--no-verify` umgangen | Hook-Fehler verstehen und beheben |

---

*Letztes Update: 08.03.2026 | BlackIceSecure & blackiceguard.io / Valtheron*
