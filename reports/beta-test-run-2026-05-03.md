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

- *O-1*: `secrets`-Tabelle existiert nicht im Schema, obwohl BETA_TESTING.md §2.7 G3 sie nennt — `backend/src/routes/secrets.ts` existiert aber als Route. Vor G-Block kläre ich, ob das Feature unter anderem Tabellennamen läuft oder tatsächlich nur als Route-Stub vorhanden ist.
- *O-2*: A6-Antworten für falsches Passwort und nicht-existierenden User sind **identisch** ("Invalid credentials", 401, ~1.8 ms) — kein User-Enumeration via Status-Code oder Timing. Gut.

---

## 2. Szenario-Ergebnisse

Legende: ✅ bestanden · ❌ fehlgeschlagen · 🟡 teilweise / Edge-Case offen · ⬜ ausstehend · ⏭️ übersprungen

### 2.A Authentifizierung

Test-Account: `beta-tester-2026-05-03` (Passwort separat, nicht im Report). UUID: `e9b38f56-d133-45ad-b3f2-e53d4444a2df`. Erste Registrierung → automatisch `role=admin` (nicht im Doc dokumentiert).

| ID | Beschreibung | UI (User) | API (Claude) | Status | Notiz |
|---|---|---|---|---|---|
| A1 | Registrierung | ⬜ | ✅ HTTP 200, 14.2 ms | 🟡 | Funktional ok, aber siehe Defekte D-1 (kein E-Mail-Feld), D-2 (Passwort-Min nur 6 Zeichen), D-3 (Auto-Admin undokumentiert), D-4 (SHA-256 ohne Salt) |
| A2 | Login | ⬜ | ✅ HTTP 200, 3.8 ms · `/me` 200 in 2.6 ms · JWT exp = iat + 24 h | 🟡 | Funktional ok, aber siehe D-5 (keine Audit-Spur für erfolgreiche Logins) |
| A6 | Falsches Passwort | ⬜ | ✅ HTTP 401 "Invalid credentials" 1.8 ms · A6b nicht existierender User identisch (kein Enum-Leak) | ❌ | Kritische Sekundär-Befunde D-6 (kein security_event bei Fehl-Login) und D-7 (kein Rate-Limit: 10 Fehlversuche in 16 ms ohne Verlangsamung, danach korrekter Login sofort erfolgreich) |

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
| D-1 | A | `POST /api/auth/register` akzeptiert nur `username` + `password`. Kein E-Mail-Feld, keine E-Mail-Validierung, keine E-Mail-Verifizierung. Die Doc (USER_GUIDE.md, BETA_TESTING.md A1) suggeriert ein vollständiges Registrierungsformular. | `backend/src/routes/auth.ts:50-84`, `backend/src/db/schema.ts:39-44` (users-Tabelle hat nur id/username/passwordHash/role/createdAt) | High | E-Mail-Feld zu users-Tabelle + register-Handler hinzufügen. Optional E-Mail-Verifizierung via Token-Link. |
| D-2 | A | `password.length < 6` ist die einzige Stärkeprüfung — keine Komplexität (Großbuchstaben, Zahlen, Sonderzeichen), keine Pwned-Password-Liste, keine Mindestentropie. | `backend/src/routes/auth.ts:58-61` | High | Passwort-Policy implementieren (mind. 12 Zeichen, Komplexitätsregeln) und in der UI gespiegelt anzeigen. |
| D-3 | A | Erster registrierter User wird automatisch `role=admin`. Vollkommen undokumentiert in README, USER_GUIDE, ADMIN_GUIDE und BETA_TESTING.md. Tester registriert sich, ist zufällig Admin, alle weiteren werden zu `operator`. | `backend/src/routes/auth.ts:71-72` | Medium | Verhalten in ADMIN_GUIDE.md dokumentieren ODER initial-admin via CLI/Setup-Wizard erzwingen statt versehentlich. |
| D-4 | A | **Passwörter werden mit plain SHA-256 ohne Salt und ohne Work-Factor gehasht.** SQL: 64 hex-Zeichen pro `passwordHash`. Anfällig für Rainbow-Table und schnellen Brute-Force (eine moderne GPU schafft Milliarden SHA-256-Hashes pro Sekunde). | `backend/src/routes/auth.ts:9-11`, `backend/src/db/seed.ts:79-81` | **Critical** | bcrypt (cost=12) oder argon2id einsetzen. Migrations-Pfad: bei nächstem Login der Bestandsuser den Hash neu erzeugen. |
| D-5 | A | Erfolgreiche Logins erzeugen **keinen Audit-Log-Eintrag**. Auch Registrierung nicht. `audit_log`-Tabelle hat zudem **keine `userId`-Spalte** (nur `agentId`), kann User-Aktionen also gar nicht referenzieren. | `backend/src/db/schema.ts` (audit_log-Tabelle), `backend/src/routes/auth.ts:13-84` (kein Insert in audit_log) | High | `userId TEXT` zur audit_log-Tabelle ergänzen (nullable, falls Aktion ohne User), und in register/login/logout Audit-Einträge schreiben. |
| D-6 | A | Fehlgeschlagene Logins (10 Versuche) erzeugen **keine `security_events`**. `security_events` hat ebenfalls keine `userId`-Spalte. Damit ist eine Brute-Force-Attacke aus den Logs nicht erkennbar. | `backend/src/db/schema.ts` (security_events-Tabelle), `backend/src/routes/auth.ts:14-46` | High | `security_events` um `userId` erweitern + Insert mit `severity='warning'` bei jedem 401-Login. Auf 5+ Fehlversuche/IP/User → severity='high'. |
| D-7 | A | **Kein Rate-Limit auf `/api/auth/login`.** 10 Fehlversuche in 16 ms (~600 req/s/Verbindung), keine Verlangsamung, keine Sperre, danach erfolgreicher Login sofort. Damit ist Online-Brute-Force gegen schwache Passwörter trivial machbar. | `backend/src/routes/auth.ts:14-46`, `backend/src/middleware/` (kein rate-limit-middleware) | **Critical** | `express-rate-limit` für `/api/auth/login` (z. B. 5 req/IP/min, 15 req/User/15min) + temporäres Account-Lockout nach n Fehlversuchen. |
| D-8 | E | Dashboard zeigt **"TASKS HEUTE 0 von 80 total"** auf einer leeren DB (Backend-Query: `SELECT count(*) FROM tasks` = 0). Der Wert "80 total" hat keine DB-Quelle und ist offenbar fabriziert. | `frontend/src/components/Dashboard*` (zu lokalisieren), `backend/src/routes/analytics.ts` (zu prüfen) | High | "Total Tasks" gegen echte Query bauen oder Empty-State zeigen. Mock-Daten dürfen in einer "echte Anwenderumgebung"-Beta nicht erscheinen. |
| D-9 | E | **"TASKS TREND (7 TAGE)" zeigt 7 Balken** mit deutlich variierenden Höhen, obwohl `tasks`-Tabelle leer ist und `metrics_history` keine Einträge hat (MetricsRecorder läuft seit <2 Min). Trenddiagramm ist offensichtlich Mock. | `frontend/src/components/Dashboard*`, `backend/src/routes/analytics.ts /trends` | High | Trendgraph an `metrics_history`/`tasks.createdAt` koppeln; Empty-State implementieren. |
| D-10 | E | Dashboard-Kacheln **ERFOLGSRATE 88.5%**, **FEHLERRATE 3.1%**, **45ms Avg Response**, **UPTIME 99.97%** sind ohne ausgeführte Tasks und ohne Metrics-Historie nicht berechenbar — also entweder hardcoded oder aus Agent-Stammdaten deterministisch derived. Suggeriert Aktivität, die nicht stattgefunden hat. | wie D-9 | High | Sollwerte/Empty-States; aktuelle Werte als "—" oder "noch keine Daten" rendern. |
| D-11 | E | **Top Performer**-Liste zeigt 5 Agenten mit Score `99`. Da kein Agent in dieser Session ausgeführt wurde, kann das Ranking keine echten Performance-Daten haben. Wahrscheinlich aus deterministisch abgeleiteten Agent-Eigenschaften (Forseti / Capability) generiert, aber ohne Hinweis darauf in der UI. | `frontend/src/components/Dashboard*`, evtl. `backend/src/services/forsetiScoring.ts` | Medium | Quelle der Scores in der UI ausweisen ("Capability-Score" statt "Performance"); Tooltip mit Datenquelle. |
| D-12 | E | **Agent Status 72/72/73/73** (active/working/idle/blocked) summiert auf 290 — deterministisch aus Agent-IDs ableitbar (siehe `backend/src/db/seed.ts:11-19` Kommentar). Bei 0 ausgeführten Tasks unmöglich echte Laufzeit-Status. | `backend/src/db/seed.ts:153-180` (status-Derivation), `frontend/src/components/Dashboard*` | Medium | Status erst setzen, wenn Agent tatsächlich eine Task hatte; vorher `idle` oder `unconfigured`. |
| D-13 | E | **"Anmelden"-Button oben rechts** sichtbar, obwohl User direkt das Dashboard sieht → keine Auth-Wand davor. Bestätigt Onboarding-Report D-2: Dev-Modus überspringt LoginView via `import.meta.env.PROD`-Gate. Für eine Beta in "echter Anwenderumgebung" ist das gefährlich (Tester könnten meinen, das System sei im Produktionsmodus public-zugänglich). | `frontend/src/App.tsx:465` (laut Onboarding-Report), `npm run dev` | High | Dev-Auth-Bypass abschaltbar machen (`VITE_VALTHERON_REQUIRE_AUTH=true`) und im README-Beta-Abschnitt als Pflicht für Beta-Tester. |
| D-14 | E | **Kill-Switch-Karte** zeigt rote AKTIV-Kugel + Text "System geschützt — Auto-Trigger aktiv" + Badge "0 Auto-Trigger-Regeln". "AKTIV" ist mehrdeutig (Kill-Switch zündet gerade vs. Schutzfunktion läuft). Backend-Default ist tatsächlich `armed=false` — die UI zeigt also den **Schutz-Modus** als "AKTIV", was vom Wort her das Gegenteil suggeriert. | `frontend/src/components/KillSwitch*`, `backend/src/services/killSwitchMonitor.ts` | Medium | Begriff klären: "Schutz: aktiv" vs. "Kill-Switch: GEZÜNDET". Farbcodierung anpassen (Rot = Kill, Grün = Schutz). |
| D-15 | G | `secrets`-Tabelle existiert nicht im Schema, obwohl `backend/src/routes/secrets.ts` als Route registriert ist. BETA_TESTING.md §2.7 G3 erwartet Secrets-Vault-CRUD. | `backend/src/db/schema.ts` (kein CREATE TABLE secrets), `backend/src/routes/secrets.ts` | High | Tabelle anlegen oder Feature aus der Doc nehmen. (Detail folgt im G-Block.) |

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
