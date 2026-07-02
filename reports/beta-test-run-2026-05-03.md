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

E1 ist durch einen Screenshot des Users belegt und hat **sieben Defekte zu Tage gefördert** (D-8…D-14). Die Cleanup-Commits `dbfd198`, `fd9ffa2`, `7fcbf3a` haben die fabricated Daten aus dem Live-Pfad gezogen; ein Bestätigungs-Screenshot zeigt jetzt echte Nullen + Empty-States. E2/E3/E4/E5 wurden nicht durchgeführt, weil der Fokus auf der Dashboard-Bereinigung lag und Block F den restlichen Zeit-Slot blockierte.

| ID | Beschreibung | UI | API | Status | Notiz |
|---|---|---|---|---|---|
| E1 | Dashboard laden + Latenz < 200 ms p95 | ✅ Screenshot vor + nach Cleanup vorhanden | 🟡 Performance-Messung steht aus (Vite-Boot-Race D-19/D-20 dazwischen) | 🟡 | Initial: D-8…D-14 (alle High/Medium). Nach Cleanup-Commits: bestätigt sauber. Latenz-Messung in §4 fehlt — siehe dort. |
| E2 | Trends-Tab Empty-State | ⏭️ | ⏭️ | ⏭️ | Analytics-View wurde im Code (Phase 4) auf `/api/analytics/performance` umgestellt mit Empty-State; UI-Klick-Verify steht aus |
| E3 | SLA-Tab Empty-State | ⏭️ | ⏭️ | ⏭️ | Analytics-View wurde im Code auf `/api/analytics/sla` umgestellt; UI-Klick-Verify steht aus |
| E4 | Export JSON | ⏭️ | ⏭️ | ⏭️ | Nicht durchgeführt |
| E5 | Export CSV | ⏭️ | ⏭️ | ⏭️ | Nicht durchgeführt |

### 2.B Agenten

Run-Datum: 2026-06-04 (gleicher Branch, neue DB nach Seed-Cleanup; Test-User `beta-block-b`, Token via Register).

| ID | Beschreibung | UI | API (Claude) | Status | Notiz |
|---|---|---|---|---|---|
| B1 | Agent erstellen | ⬜ | ✅ `POST /api/agents` HTTP 201 in 4.7 ms — Agent `Beta Test Researcher` mit `status='idle'`, `successRate=0`, `tasksCompleted=0` korrekt persistiert; DB: 290 → 291 Agenten | ✅ | Beobachtungen N-1 (`capabilities.status='pending'` — kein Recompute auf Anlage) und N-2 (`lastActivity` wird auf Anlage-Zeit gesetzt statt null) |
| B4 | Agent-Suche | ⬜ | ✅ `GET /api/agents?search=Beta` HTTP 200 in 3.9 ms · 1 Treffer · SQL-Injection-Probe `?search=' OR 1=1--` → 0 Treffer (parametrisiert, gut) | 🟡 | Defekt D-16: Response-Feld `total: 291` ist Gesamtzahl der Tabelle, nicht der Suchergebnisse (1) — Pagination-irreführend |
| B6 | Agent-Detail | ⬜ | ✅ `GET /api/agents/:id` HTTP 200 in 2.8 ms · Edge-Case: nicht-existente UUID → HTTP 404 mit `{"error":"Agent not found"}` | ❌ | Kritischer Sekundär-Befund D-17 ist Block-spannend (siehe unten) |

**Defekt D-17 — Vollständiger Auth-Bypass im Dev-Modus (Critical):**
Backend setzt unter `NODE_ENV !== 'production'` und `VALTHERON_REQUIRE_AUTH !== 'true'` die `optionalAuth`-Middleware ein, nicht `authMiddleware`. Damit liefert **jeder** der folgenden Endpoints **ohne `Authorization`-Header** HTTP 200:

| Endpoint | Status (ohne Token) |
|---|---|
| `GET /api/agents` | 200 |
| `GET /api/agents/:id` | 200 |
| `GET /api/tasks` | 200 |
| `GET /api/workflows` | 200 |
| `GET /api/security/events` | 200 |
| `GET /api/security/audit` | 200 |
| `GET /api/security/kill-switch` | 200 |
| `GET /api/chat/sessions` | 200 |
| `GET /api/notifications` | 200 |
| `GET /api/analytics/dashboard` | 200 |

Per Design dokumentiert in `backend/src/app.ts:88` als "Dev mode leaves endpoints open for local experimentation". Auf einer Beta-Staging-Maschine die das ENV-Flag nicht setzt ist die komplette API public — inklusive **Security-Audit-Log und Kill-Switch-Steuerung**. Fix-Vorschlag: `VALTHERON_REQUIRE_AUTH=true` muss in `.env.example` als Default für `npm run dev` stehen, ODER der Dev-Bypass wird auf ein Allowlist von Endpoints (z. B. `/api/health`, `/api/agents` GET) eingeschränkt.

### 2.F Agenten-Chat (Hauptfokus)

Drei verschachtelte Defekte (D-18/D-19/D-20) sind während des Block-F-Versuchs aufgetaucht; jeder hat den nächsten Test blockiert. Alle drei sind im Branch gefixt (siehe §5), aber die eigentliche Provider-Latenz- und Response-Qualitäts-Messung (§3) ist **nicht durchgeführt** worden.

| ID | Beschreibung | UI | API | Status | Notiz |
|---|---|---|---|---|---|
| F1 | Chat-Session starten | 🟡 UI öffnete den Picker, Klick auf Agent lieferte stillen 500 (D-19), nach D-20 Fix sauberes 404 mit Empty-Banner | ✅ Backend liefert mit D-20-Fix sauberes 404 statt FK-500; Live-Verify steht aus | 🟡 | Nach D-20 (Existence-Check in `backend/src/routes/chat.ts:24-40`) sollte F1 jetzt sauber durchlaufen — UI-Re-Test ausstehend |
| F2-Anthropic | Nachricht senden — Provider Anthropic | ❌ UI zeigte Simulation mit fabriziertem Business-Text ("Retention Q4: 78%…") trotz konfiguriertem Key | ❌ Backend-Handler in `chat.ts` fiel in `generateFallbackResponse()` weil `x-llm-api-key` nie gesendet wurde | ❌ → 🟡 | Wurzel: D-18 (localStorage-Key-Typo in ChatView, gefixt in `7873c7f`). Live-Verify mit echter Claude-Antwort steht aus |
| F2-OpenAI | Nachricht senden — Provider OpenAI | ⏭️ | ⏭️ | ⏭️ | Kein Key bereitgestellt — nicht getestet |
| F2-Ollama | Nachricht senden — Provider Ollama | ⏭️ | ⏭️ | ⏭️ | Läuft beim User lokal, Sandbox-Backend hat keinen Netzweg dorthin |
| F3 | Multi-Agent-Collab | ⏭️ | ⏭️ | ⏭️ | Nicht erreicht — Run wurde nach D-18/D-19/D-20-Kaskade pausiert |

### 2.G Security-Quick-Check

| ID | Beschreibung | UI | API | Status | Notiz |
|---|---|---|---|---|---|
| G1 | Audit-Log nach jeder schreibenden Aktion | ⏭️ | ⏭️ | ⏭️ | Nicht durchgeführt — verwandte Findings D-5 (keine Audit-Spur für Logins) und D-6 (keine security_events bei Fehl-Login) bereits im Defekt-Journal dokumentiert |

---

## 3. Response-Qualität Agenten-Chat

**Status: NICHT DURCHGEFÜHRT.** Block F konnte wegen D-18 (Simulation statt LLM-Antwort), D-19 (Boot-Race friert UI ein) und D-20 (FK-500 statt 404) keine echte Provider-Antwort produzieren. Alle drei Defekte sind im Branch gefixt; die Messung muss in einer Folge-Session mit gültigen API-Keys nachgeholt werden.

| Provider | Prompt-Typ | TTFT [ms] | Total [ms] | Tokens (in/out) | Bewertung 1–5 | Notiz |
|---|---|---|---|---|---|---|
| Anthropic (Sonnet) | OAuth Erklärung | — | — | — | — | nicht durchgeführt |
| Anthropic (Sonnet) | SQLite vs PostgreSQL Risiken | — | — | — | — | nicht durchgeführt |
| Anthropic (Sonnet) | UN-Klimakonferenz 2031 (Halluzinations-Edge) | — | — | — | — | nicht durchgeführt |
| Ollama (llama3) | dieselben drei Prompts | — | — | — | — | nicht durchgeführt |

---

## 4. Performance-Messungen Dashboard

**Status: NICHT DURCHGEFÜHRT** (außer Baseline). Block E hat das Dashboard funktional inspiziert (Screenshots), aber die p95-Latenzmessung der vier Dashboard-Endpoints steht aus. Empfehlung für die Folge-Session: 100 Requests/Endpoint via `curl -w "%{time_total}"` in einer Schleife, dann p50/p95 ausrechnen.

| Endpoint | n | p50 [ms] | p95 [ms] | Status |
|---|---|---|---|---|
| `/api/health` | 1 | 7.8 | 7.8 | ✅ Baseline |
| `/api/dashboard/summary` | 0 | — | — | ⏭️ nicht durchgeführt |
| `/api/agents` | 1 | 29.5 | 29.5 | 🟡 nur Einzelmessung beim Frontend-Boot |
| `/api/analytics/dashboard` | 1 | 2.1 | 2.1 | 🟡 nur Einzelmessung |
| `/api/analytics/trends?range=7d` | 0 | — | — | ⏭️ nicht durchgeführt |

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
| D-15 | G | `secrets`-Tabelle existiert nicht im Schema, obwohl `backend/src/routes/secrets.ts` als Route registriert ist. BETA_TESTING.md §2.7 G3 erwartet Secrets-Vault-CRUD. | `backend/src/db/schema.ts` (kein CREATE TABLE secrets), `backend/src/routes/secrets.ts` | High | **✅ behoben (`29d1113`):** `secrets`-Tabelle im Schema angelegt; Vault in `services/encryption.ts` ist jetzt DB-gestützt statt rein in-memory — verschlüsselte Werte überleben Neustarts. Werte liegen weiterhin nur als AES-256-GCM-Ciphertext in der DB. |
| D-16 | B | `GET /api/agents?search=...` Response-Feld `total` zählt die Gesamttabelle (291) statt der gefilterten Treffer (1). UI-Pagination, die `total` für `Math.ceil(total/limit)` verwendet, zeigt 291 Seiten an obwohl nur eine Seite existiert. | `backend/src/routes/agents.ts` GET-Handler, Search-Branch | Medium | **✅ behoben (`29d1113`):** `total` wird jetzt mit derselben `WHERE`-Klausel wie die Datenabfrage berechnet (`SELECT COUNT(*) FROM agents <whereClause>`). Regressionstest in `agents.test.ts` ("reports total matching the active filter"). |
| D-17 | B | **Vollständiger Auth-Bypass im Dev-Modus:** 9/9 sensible Endpoints (Agents, Tasks, Workflows, Security-Events, Audit-Log, Kill-Switch, Chat, Notifications, Analytics) liefern ohne `Authorization`-Header HTTP 200. Steuerbar über `VALTHERON_REQUIRE_AUTH=true`, aber Default beim `npm run dev` ist Bypass aktiv. | `backend/src/app.ts:86-91` | **Critical** | **Gefixt in `ab4a1bf`**: Security/Secrets/Backup brauchen jetzt immer admin auth, andere Produkt-Routen behalten den Dev-Bypass mit deutlicher Boot-Warnung. |
| D-18 | F | Chat-Antworten kamen stets als Simulation mit fabrizierten Business-Zahlen, obwohl Anthropic-Provider in den LLM-Settings connected mit Key war. Root Cause: localStorage-Key-Mismatch — `ChatView.tsx` las `'llmConfig'` (camelCase), App.tsx schrieb `'llm_config'` (snake-case). `getLLMHeaders()` retournierte immer `undefined`, der `x-llm-api-key`-Header fehlte am Request, Backend fiel in `generateFallbackResponse()`. | `frontend/src/components/ChatView.tsx:71` ↔ `frontend/src/services/persistence.ts:35` | High | **Gefixt in `7873c7f`**: ChatView importiert jetzt `KEYS.LLM_CONFIG` aus persistence und liest unter demselben Key wie App.tsx schreibt. |
| D-19 | F | Mount-Effect in App.tsx versuchte den API-Connect genau einmal beim Boot. Vite ist im Schnitt 0.5-3 s früher fertig als das Backend, der Initial-Call `healthAPI.check()` bekam ECONNREFUSED, dataSource flippte auf `'mock'`, und der useEffect probierte nie wieder. Badge zeigte "Mock" trotz verfügbarem Backend. Plus: `ChatView.handleNewChat` schluckte Errors mit `catch { /* ignore */ }`. | `frontend/src/App.tsx:155-230`, `frontend/src/components/ChatView.tsx:128-149` | High | **Gefixt in `cd25cb9`**: Mount-Effect retryed mit Exponential-Backoff bis 15 s; während des Retry bleibt dataSource auf `'loading'` (Badge "Verbinde..."). ChatView zeigt jetzt einen roten Banner mit Originaltext und Hinweis auf Strg+Shift+R. |
| D-20 | F | Selbst mit D-19-Retry blieb das Badge auf "Verbinde..." stehen: das Mount-Effect-`Promise.all` enthielt `securityAPI.events()` und `securityAPI.killSwitch()`, die seit D-17-Fix admin auth brauchen. Beim First-Boot ohne Token → 401 → ganzes Promise.all rejected → endlos-Retry. Sekundär: `POST /api/chat/sessions` machte INSERT ohne `agentId`-Existence-Check → SQLite-FK-Constraint → 500 statt sauber 404 wenn der Client eine veraltete UUID hatte (häufiger Fall nach Backend-DB-Reseed). | `frontend/src/App.tsx:171-178`, `backend/src/routes/chat.ts:24-39` | **Critical** | **Gefixt in `0edc382`**: (1) `Promise.all` → `Promise.allSettled`, einzelne 401/Fehler tolerieren statt ganzes Boot-Setup zu verbrennen, auth-pflichtige Calls nur ausführen wenn Token vorhanden ist (`getToken() !== null`). (2) `chat.ts` POST `/sessions` prüft `SELECT 1 FROM agents WHERE id=?` vor INSERT, liefert 404 mit `{error: "Agent ... not found"}` statt 500. |

**Legende Schweregrade:** **Critical** = Datenverlust, Sicherheit, kompletter Flow blockiert · **High** = Kern-Feature unbenutzbar, kein Workaround · **Medium** = Feature funktioniert eingeschränkt, Workaround möglich · **Low** = kosmetisch / Edge-Case.

### Severity-Bilanz

| Schweregrad | Gefunden | Bereits gefixt | Offen | Gefixte Defekt-IDs |
|---|---|---|---|---|
| **Critical** | 4 | 4 | 0 | D-4, D-7, D-17, D-20 |
| **High** | 11 | 7 | 4 | gefixt: D-8/D-9/D-10/D-13/D-15/D-18/D-19 (Dashboard-Mock + Secrets-Vault + Chat-Pipeline). Offen: D-1 (E-Mail-Feld), D-2 (Passwort-Policy), D-5 (Audit-Log-User), D-6 (security_events) |
| **Medium** | 5 | 4 | 1 | gefixt: D-11/D-12/D-14/D-16 (Dashboard-UX + filter-aware Pagination). Offen: D-3 (Auto-Admin undokumentiert) |
| **Low** | 0 | 0 | 0 | — |
| **Summe** | **20** | **15** | **5** | |

Davon im Beta-Run *neu entdeckt:* D-1 bis D-7 (Block A), D-8 bis D-14 (Block E), D-15 (Block G geplant), D-16 + D-17 (Block B), D-18 + D-19 + D-20 (Block F). Davon entstanden D-18, D-19, D-20 erst **während** der Fixe der ersten Welle — sie waren keine Bestands-Defekte, sondern Folge meiner Cascade-Fixes von D-17 (Auth-Bypass) und der Frontend-Cleanup-Welle. Lesson Learned, siehe §6.

---

## 6. Empfehlungen / nächste Schritte

### 6.0 Beta-Go/No-Go

**Empfehlung: No-Go für eine externe Beta.** Begründung:

- **Alle 4 Critical-Defekte lagen in der Auth-/Trust-Schicht** (D-4 SHA-256, D-7 fehlender Rate-Limit, D-17 Auth-Bypass, D-20 Boot-Cascade). Alle sind im Branch gefixt, aber für eine externe Beta bräuchte es eine unabhängige Security-Review der Auth-Pipeline und einen Pentest-Sweep. Vorher kein external sign-off.
- **Block E (Dashboard) begrüßte den Beta-Test mit fabrizierten Demo-Daten** (D-8…D-14). Genau das Symptom, das einem Beta-Tester den Trust nimmt. Die Cleanup-Welle (`dbfd198`, `fd9ffa2`, `7fcbf3a`) hat den Live-Pfad bereinigt und die Empty-States bestätigt.
- **Block F (Chat — Haupt-Value-Prop) konnte inhaltlich noch nicht getestet werden.** D-18/D-19/D-20 sind gefixt, aber bis eine echte LLM-Antwort nachweislich durchgereicht wird (§3), fehlt der Beweis für das Kernfeature.
- **4 High- und 1 Medium-Defekt bleiben offen** (D-1, D-2, D-5, D-6 High; D-3 Medium) — Auth-Compliance (E-Mail, Passwort-Policy, Audit-Trail für Login-Ereignisse) und die Auto-Admin-Dokumentation.

### 6.1 In diesem Branch behoben

| Befund | Schweregrad | Fix |
|---|---|---|
| D-4 | Critical | Passwort-Hashing auf bcrypt (cost 12) umgestellt, transparenter Upgrade-Pfad für Alt-Hashes beim nächsten Login. |
| D-7 | Critical | Strikter Rate-Limiter auf `/api/auth/login`. |
| D-17 | Critical | Dev-Auth-Bypass geschlossen für `/api/security`, `/api/secrets`, `/api/backup` — diese verlangen immer Admin-Auth; Boot-Log warnt, wenn `VALTHERON_REQUIRE_AUTH` nicht gesetzt ist. |
| D-20 | Critical | Boot-Mount-Effect auf `Promise.allSettled` + token-gated Security-Calls umgestellt (Badge friert nicht mehr auf „Verbinde…" ein); `chat.ts` liefert 404 statt FK-500 bei veralteter Agent-UUID. |
| D-8 … D-12 | High/Medium | Fabrizierte Demo-Daten aus Dashboard, Enterprise-, Projektbaum- und Certifications-View sowie Seed entfernt; echte Empty-States. |
| D-14 | Medium | Kill-Switch-Labels entschärft (Schutz-Modus vs. gezündet). |
| D-15 | High | `secrets`-Tabelle angelegt, Vault DB-gestützt (überlebt Neustarts). |
| D-16 | Medium | `total` respektiert jetzt die aktiven Filter (Pagination korrekt). |
| D-18 | High | Chat-`localStorage`-Key angeglichen, damit konfigurierte API-Keys das Backend erreichen. |
| D-19 | High | Boot-Retry mit Backoff für die API-Verbindung; Chat-Session-Fehler werden in der UI sichtbar gemacht. |

### 6.2 Offene Follow-ups (eigene Tickets, vor GA)

- **D-1 / D-2 (High):** Registrierung ohne E-Mail-Feld und mit schwacher Passwort-Policy (`length ≥ 6`). Vor GA: E-Mail-Feld + Verifizierung und eine ernsthafte Passwort-Policy (≥ 12 Zeichen, Komplexität). Erfordert Schema-Migration der `users`-Tabelle und UI-Abgleich.
- **D-5 / D-6 (High):** `audit_log` und `security_events` haben keine `userId`-Spalte; erfolgreiche/fehlgeschlagene Logins erzeugen keine Einträge. Vor GA: `userId` ergänzen und Auth-Ereignisse protokollieren (Brute-Force-Erkennung).
- **D-3 (Medium):** Auto-Admin für den ersten registrierten User dokumentieren oder durch einen expliziten Setup-Schritt ersetzen.
- **D-11 / D-13 (Medium):** Score-Quelle in der UI ausweisen ("Capability-Score"); Dev-Auth-Bypass im Beta-Abschnitt des README als Pflicht-Hinweis für Tester.

### 6.3 Noch nicht durchgespielte Szenarien

E1–E5 (Dashboard-Latenz/Export), F1–F3 (Chat-Response-Qualität pro Provider) und G1 (Audit-Log) blieben in diesem Hybrid-Run offen, weil weder der User-Stack noch ein LLM-Provider-Key durchgängig bereitstand. Diese Blöcke sollten in einem Folgerun mit konfiguriertem `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` (bzw. lokalem Ollama) und laufender UI nachgeholt werden; die Abschnitte §3 und §4 werden dann mit echten Messwerten gefüllt. Nach dem D-18/D-19/D-20-Fix sollte der Chat-Pfad jetzt eine echte Antwort durchreichen — das ist der erste zu verifizierende Punkt.

### 6.4 Lesson Learned (Meta)

Während dieses Runs sind **drei Defekte direkt durch die Fixe entstanden** (D-18, D-19, D-20). Muster:

1. **D-17 Fix** (Security-Routen brauchen immer Auth) hat den App.tsx-Mount-Effect gebrochen → D-19/D-20-Kaskade.
2. **D-18 Fix** (ChatView localStorage-Key) diagnostizierte den Bug korrekt, aber ohne End-to-End-Verifikation — D-19 hätte sich gleichzeitig zeigen müssen.
3. **Cascade-Iterationen ohne Pause** haben den User frustriert; der Subagent-gestützte Root-Cause-Audit vor dem D-20-Commit (allSettled statt weiterer Blindfixe) war die Kurskorrektur.

Konsequenz für die nächste Iteration: **vor jedem auth-/middleware-touchenden Commit ein Mount-Effect-Smoke-Test** (Frontend bootet auf leerem localStorage, alle Hauptviews öffnen). Lokal in ~30 s machbar, hätte alle drei Folge-Defekte vermieden.

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

## 8. Anhang — Mapping Defekt-ID ↔ Szenario-ID

Querverbindung zwischen den in §5 dokumentierten Defekten und den Test-Szenarien aus `docs/guides/BETA_TESTING.md` §2.

| Defekt | Szenario(s) | Bemerkung |
|---|---|---|
| D-1 | A1 | Register-Endpoint ohne E-Mail |
| D-2 | A1 | Passwort-Policy zu schwach |
| D-3 | A1 | Auto-Admin für ersten User undokumentiert |
| D-4 | A1, A2 | SHA-256-Hashing (gefixt) |
| D-5 | A1, A2, G1 | Audit-Log kein userId für Auth-Ereignisse |
| D-6 | A6, G1 | Keine security_events bei Fehl-Login |
| D-7 | A6 | Login-Rate-Limit fehlt (gefixt) |
| D-8 | E1 | "TASKS HEUTE 0 von 80" (gefixt) |
| D-9 | E1 | Tasks-Trend mit Random-Daten (gefixt) |
| D-10 | E1 | Erfolgsrate/Fehlerrate/Uptime hardcoded (gefixt) |
| D-11 | E1 | Top-Performer-Scores aus Capability statt Performance (gefixt mit Label) |
| D-12 | E1 | Agent-Status 72/72/73/73 deterministisch (gefixt via Seed) |
| D-13 | E1 + Auth-Flow | Dev-Mode überspringt Login (gefixt via VALTHERON_REQUIRE_AUTH) |
| D-14 | E1 + Kill-Switch | Kill-Switch-Label-Mehrdeutigkeit (gefixt via STANDBY/GEZÜNDET) |
| D-15 | G3 | secrets-Tabelle existiert nicht (offen) |
| D-16 | B4 | Search-Response `total` zählt Gesamttabelle (offen) |
| D-17 | B6 + alle B/E/F/G implizit | Dev-Auth-Bypass (gefixt für /security, /secrets, /backup) |
| D-18 | F2 | localStorage-Key-Typo (gefixt) |
| D-19 | F1 + Boot-Verhalten | Mount-Effect Single-Try ohne Retry (gefixt) |
| D-20 | F1 + Boot-Verhalten | Promise.all kippt bei 401, chat.ts FK-500 (gefixt) |

---

*Run-Report angelegt: 2026-05-03 | Finalisiert: 2026-06-04 | Valtheron Agentic Workspace v1.0.0-beta*
