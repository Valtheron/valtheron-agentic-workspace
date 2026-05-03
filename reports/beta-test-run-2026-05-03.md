# Beta-Test-Run — Real-User-Run, Fokus Dashboard + Agenten-Chat

**Datum:** 2026-05-03
**Branch:** `claude/add-beta-testing-guide-WK8kh`
**Commit:** `d19f2b6c67c233c8f29eb06b278af68b06b60e0d`
**Tester:** User (UI, lokaler Stack via `docker compose up`) + Claude (API/Backend/DB, Sandbox via `npm run dev:backend`)
**Phase:** Hybrid-Run (Variante C) — Du bedienst die UI, ich treibe API + DB-Checks; Ergebnisse werden hier konsolidiert.
**Ziel:** Dashboard und Agenten-Chat in echter Anwender-Umgebung gegen die Test-Szenarien aus `docs/guides/BETA_TESTING.md` §2 prüfen, ohne Demo-Daten. Response-Qualität des Chats ist Pflicht-Kriterium.

---

## 1. Setup & Baseline

| Komponente | Status | Notiz |
|---|---|---|
| Sandbox-Backend | ✅ läuft auf `:3001` | `npm run dev:backend`, Health-Endpoint 200 in 7.8 ms |
| Sandbox-Frontend | ⏭️ nicht gestartet | UI-Spur läuft beim User lokal (Variante C) |
| User-Stack | ⬜ ausstehend | User bestätigt sobald `docker compose up -d` und `localhost:8080` erreichbar |
| DB-Datei | ✅ neu erzeugt | `backend/data/valtheron.db`, 21 Tabellen |
| Seed-Status | ✅ sauber bis auf Katalog | 290 Agenten geseedet (Forseti: 160 computed, 130 pending), 0 User, 0 Tasks, 0 Sessions, 0 Audit-Einträge |
| WebSocket | ✅ aktiv auf `/ws` | 0 Clients verbunden |
| Hintergrunddienste | ✅ laufen | KillSwitchMonitor (30s), MetricsRecorder (60s), Backup (6h), Initial-Backup angelegt |
| LLM-Provider | ⬜ ausstehend | Vor F2 prüfen wir: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OLLAMA_BASE_URL` |

**Beobachtungen vorab:**

- *O-1*: `secrets`-Tabelle existiert nicht im Schema, obwohl BETA_TESTING.md §2.7 G3 sie nennt. Vor G-Block kläre ich, ob das Feature unter anderem Tabellennamen läuft oder tatsächlich fehlt.

---

## 2. Szenario-Ergebnisse

Legende: ✅ bestanden · ❌ fehlgeschlagen · 🟡 teilweise / Edge-Case offen · ⬜ ausstehend · ⏭️ übersprungen

### 2.A Authentifizierung

| ID | Beschreibung | UI (User) | API (Claude) | Status | Notiz |
|---|---|---|---|---|---|
| A1 | Registrierung | ⬜ | ⬜ | ⬜ | |
| A2 | Login | ⬜ | ⬜ | ⬜ | |
| A6 | Falsches Passwort | ⬜ | ⬜ | ⬜ | |

### 2.E Dashboard

| ID | Beschreibung | UI | API | Status | Notiz |
|---|---|---|---|---|---|
| E1 | Dashboard laden + Latenz < 200 ms p95 | ⬜ | ⬜ | ⬜ | |
| E2 | Trends-Tab Empty-State | ⬜ | ⬜ | ⬜ | |
| E3 | SLA-Tab Empty-State | ⬜ | ⬜ | ⬜ | |
| E4 | Export JSON | ⬜ | ⬜ | ⬜ | |
| E5 | Export CSV | ⬜ | ⬜ | ⬜ | |

### 2.B Agenten

| ID | Beschreibung | UI | API | Status | Notiz |
|---|---|---|---|---|---|
| B1 | Agent erstellen | ⬜ | ⬜ | ⬜ | |
| B6 | Agent-Detail | ⬜ | ⬜ | ⬜ | |
| B4 | Agent-Suche | ⬜ | ⬜ | ⬜ | |

### 2.F Agenten-Chat (Hauptfokus)

| ID | Beschreibung | UI | API | Status | Notiz |
|---|---|---|---|---|---|
| F1 | Chat-Session starten | ⬜ | ⬜ | ⬜ | |
| F2-Anthropic | Nachricht senden — Provider Anthropic | ⬜ | ⬜ | ⬜ | |
| F2-OpenAI | Nachricht senden — Provider OpenAI | ⬜ | ⬜ | ⬜ | |
| F2-Ollama | Nachricht senden — Provider Ollama | ⬜ | ⬜ | ⬜ | |
| F3 | Multi-Agent-Collab | ⬜ | ⬜ | ⬜ | |

### 2.G Security-Quick-Check

| ID | Beschreibung | UI | API | Status | Notiz |
|---|---|---|---|---|---|
| G1 | Audit-Log nach jeder schreibenden Aktion | ⬜ | ⬜ | ⬜ | |

---

## 3. Response-Qualität Agenten-Chat

Wird in F2 gefüllt. Pro Provider und Test-Prompt: Latenz (TTFT, total), Token-Kosten, inhaltliche Bewertung 1–5 (Relevanz, Korrektheit, Tonalität), Halluzinations-Flags.

| Provider | Prompt-Typ | TTFT [ms] | Total [ms] | Tokens (in/out) | Bewertung 1–5 | Notiz |
|---|---|---|---|---|---|---|
| _tbd_ | _tbd_ | _tbd_ | _tbd_ | _tbd_ | _tbd_ | _tbd_ |

---

## 4. Performance-Messungen Dashboard

Wird in E1 gefüllt. Ziel: API p95 < 200 ms.

| Endpoint | n | p50 [ms] | p95 [ms] | Status |
|---|---|---|---|---|
| `/api/health` | 1 | 7.8 | 7.8 | ✅ Baseline |
| `/api/dashboard/summary` | _tbd_ | _tbd_ | _tbd_ | ⬜ |
| `/api/agents` | _tbd_ | _tbd_ | _tbd_ | ⬜ |
| `/api/analytics/dashboard` | _tbd_ | _tbd_ | _tbd_ | ⬜ |
| `/api/analytics/trends?range=7d` | _tbd_ | _tbd_ | _tbd_ | ⬜ |

---

## 5. Defekt-Journal

| # | Block | Befund | Datei(en) / Endpoint | Schweregrad | Fix-Vorschlag |
|---|---|---|---|---|---|
| _tbd_ | | | | | |

**Legende Schweregrade:** **Critical** = Datenverlust, Sicherheit, kompletter Flow blockiert · **High** = Kern-Feature unbenutzbar, kein Workaround · **Medium** = Feature funktioniert eingeschränkt, Workaround möglich · **Low** = kosmetisch / Edge-Case.

---

## 6. Empfehlungen / nächste Schritte

_wird beim Abschluss gefüllt_

---

## 7. Anhang — Befehle & Logs

### Backend-Start (Sandbox)

```bash
cd backend && JWT_SECRET=valtheron-beta-test-2026-05-03 npm run dev > /tmp/backend.log 2>&1 &
curl -fsS http://localhost:3001/api/health
```

### DB-Inspektion

```bash
cd backend && node -e "
const Database = require('better-sqlite3');
const db = new Database('data/valtheron.db', {readonly: true});
console.log(db.prepare('SELECT count(*) FROM users').get());
"
```

---

*Run-Report angelegt: 2026-05-03 | Valtheron Agentic Workspace v1.0.0-beta*
