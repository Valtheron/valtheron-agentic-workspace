# Changelog — Valtheron Agentic Workspace

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/) und dieses Projekt verwendet [Semantic Versioning](https://semver.org/lang/de/).

---

## [Unreleased]

### Hinzugefügt

- **Evolution Foundation — Interaction Capture Layer (Branch 3, Phase 1):**
  Phase-1-Implementierung des Evolutionären Agenten-Systems gemäß
  `the-290-agent-database/.../evolutionary_agent_system.md` §74-101.
  Zwei neue Tabellen:
  `agent_versions` (id PK, agentId FK, version, systemPromptHash,
  parametersHash, deployedAt, retiredAt, evolutionTrigger, notes) und
  `agent_interactions` (id PK, agentId, agentVersionId, taskId, userId,
  requestPrompt, requestParams, requestContext, responseContent,
  responseReasoning, startedAt, finishedAt, durationMs, input/output/totalTokens,
  costUsd, outcome, errorClass, errorMessage, feedbackScore, feedbackText,
  feedbackAt, createdAt) plus 6 Indizes für die typischen Phase-2-Queries.
  Neuer Service `backend/src/services/interactionLogger.ts`:
  `startInteraction()` legt eine pending-Zeile an und ankert sie an die
  aktuelle Agenten-Version (`ensureCurrentVersion()` legt automatisch
  v1.0.0 an oder bumpt einen Patch, wenn `systemPrompt`/`parameters` sich
  geändert haben — Bumps tragen `evolutionTrigger`).
  `finishInteraction()` ist idempotent (zweiter Aufruf wird ignoriert).
  `recordFeedback()`, `listInteractions()`, `countInteractions()`,
  `aggregateInteractions()` (Success-Rate, Token-Mittel, Kosten,
  Feedback-Counts) und `getInteractionById()` runden die API ab.
  `executionEngine.ts` hängt sich vor und nach jedem `callLLM()`-Run
  ein — Logging-Fehler werden geschluckt, blockieren niemals die
  Task-Ausführung. Neue REST-Routen unter `/api/interactions`:
  `GET /` (mit agentId/taskId/outcome/since/until/limit/offset Filter),
  `GET /:id`, `POST /:id/feedback`, `GET /agent/:agentId/aggregates`.
  10 neue Backend-Tests (`interactionLogger.test.ts`) decken Start/Finish-
  Lifecycle, Idempotenz, Feedback, Filter, Pagination, Aggregates und die
  Versions-Registry (Bump bei Prompt-Drift). Backend-Suite 448/448 grün,
  E2E-Smoke gegen frische DB liefert korrekte Aggregates.

- **Forseti Power Framework (Branch 2, Inkremente 1-2):** Import der
  kanonischen Bewertungsmethodik aus dem Vorgänger-Repo
  `blackicesecure-space/Valtheron/agentic-workspace/forseti/` als
  strukturelle JSON unter `the-290-agent-database/forseti/`. Inhalt:
  5 Dimensionen × 6 Sub-Dimensionen = 30 Metrics auf einer 0-9-Skala,
  10 Labels pro Sub-Metric, 10 Forseti-Kategorie-Basis-Scores,
  Model-Modifiers (Opus/Sonnet/Haiku) und 21 Keyword-Modifiers.
  Autoritativ für die 200 Standard-Agenten — 8 Valtheron-Kategorien
  haben ein autored Mapping (160 Agenten erhalten ein computed Profil),
  8 Kategorien stehen auf `pending` mit Begründung (40 Standard +
  90 Extension). Neuer Sync-Befehl `npm run sync:forseti`;
  `sync:all` läuft jetzt Agents + KB + Forseti.
  Backend-TS-Port (`backend/src/services/forsetiScoring.ts`) berechnet
  Profile deterministisch — kein Math.random, kein Math.sin, jeder Score
  trägt einen `source`-Block mit Kategorie, Modell- und Keyword-Treffern
  zur Auditierbarkeit. Neue Tabelle `agent_forseti_profiles` speichert
  entweder `status='computed'` + Profile-Blob oder `status='pending'` +
  wörtliche Begründung. Ethische Invariante: Macht ohne Quelle ist
  Null-Macht — Agenten ohne Mapping bekommen **kein** Profil,
  sichtbar leerer Zustand im UI statt fingierter Werte
  (Details in `the-290-agent-database/forseti/provenance.md`).
  8 neue Backend-Tests (`forsetiScoring.test.ts`) — 407/407 grün.
- **Forseti State Wrapper mit `b ≠ 1`-Invariante (Branch 2, Inkrement 2b):**
  Neue Typ-Ebene und Laufzeit-Guard für `agent_forseti_profiles`-Zeilen
  gemäß autorisierter Spezifikation
  `State = {value: b ∈ ℬ, status: S, timestamp: t, pendingReason: r}`
  mit `b ≠ 1`. `ForsetiState.value` ist als Literal `false` typisiert —
  der `true`-Zweig ist vom TypeScript-Compiler ausgeschlossen. Kein
  Forseti-Datensatz, computed oder pending, beansprucht absolute
  Autorität (value = 1). `wrapAsForsetiState()` + `assertForsetiState()`
  in `backend/src/services/forsetiScoring.ts` setzen die Invariante an
  API-Grenzen durch. Keine DB-Schema-Änderung — `profile = NULL` bleibt
  NULL für pending Zeilen, der State-Wrapper wird beim Lesen
  rekonstruiert. 8 neue Tests decken `value=true`- und `value=1`-Manipulation
  sowie Computed↔Profile-, Pending↔Null- und Pending↔Reason-Konsistenz ab
  (415/415 grün).
- **Agent Capability Model — Backend-Persistenz und Scoring (Branch 2,
  Commit 3):** Neue Tabelle `agent_capabilities` (agentId PK, status,
  profile JSON, pendingReason, computedAt, ON DELETE CASCADE) + neuer
  Service `backend/src/services/capabilityScoring.ts`. Berechnet 5 Layers
  × 6 Sub-Dim = 30 Metriken plus 3 Modifier deterministisch aus den
  Inputs (creativity, analyticalDepth, successRate) — kein Math.random,
  kein Math.sin, jede Zelle hat ein `source.inputs`-Feld zur
  Auditierbarkeit. Formeln werden einmal beim Modul-Load aus der
  kanonischen `model.json` kompiliert (whitelisted Regex). Seed schreibt
  290/290 computed Profile bei jedem `seedAgentCatalog()`. Type-Level
  `b ≠ 1`-Invariante: `value: false` als Literal-Type;
  `assertCapabilityState` wirft bei Manipulation. 20 Backend-Tests
  decken Shape, Determinismus, Modifier-Formeln, Clamping, State-Wrapper
  und Formel-Sicherheit ab.
- **Agent Capability Model — API-Exposure (Branch 2, Commit 4):**
  `GET /api/agents/:id` liefert jetzt `capabilities` mit vollem
  `CapabilityState` (5 Layers / 30 Sub-Dim / 3 Modifier). `GET /api/agents`
  liefert eine `CapabilitySummary` ohne Profile-Blob — die `b ≠ 1`-Invariante
  bleibt auf der Liste sichtbar (`value: false`), das schwere Profil ist
  ausschließlich am Detail-Endpoint zu finden. Performance-Tests
  (100 concurrent, 5 burst cycles) bleiben unter ihrem 5 s-Budget.
  Manuell erstellte Agenten (`POST /api/agents`) starten in `pending`
  mit autorisierter Begründung — kein automatisches Compute am Create-Pfad.
  3 neue Integration-Tests; Backend-Suite 422/422 grün.
- **Agent Capability Model — Frontend-Konsum (Branch 2, Commit 5):**
  `frontend/src/types/index.ts` spiegelt das Backend mit `CapabilityState`,
  `CapabilitySummary`, `CapabilityProfile`, `CapabilityLayer`,
  `CapabilitySubDimension`, `CapabilityModifier` (Discriminated Union)
  und einer `isCapabilityState` Type-Guard. `AgentsView.tsx`:
  `generateDimensions()` mit Math.sin/Math.random **entfernt**; neue
  `dimensionsFromCapabilities()` adaptiert das Server-Profil — keine
  Wertumformung, kein Fallback. Pending-State zeigt eine
  Sovereign-Null-Karte mit der wörtlichen `pendingReason` aus dem Backend
  („Es werden hier nur authentische Werte gezeigt. Eine leere Anzeige ist
  die korrekte Darstellung — keine Platzhalterzahlen."). 3 neue
  Render-Tests; Frontend-Suite 218/218 grün, Production-Build clean.
- **End-to-End-Smoke (Branch 2, Verifikation):** Frische DB →
  `seedAgentCatalog` → `/api/health` zeigt 290 Agenten. Detail-Response
  liefert `value: false`, `status: computed`, 5 Layers, 30 Sub-Dim,
  Modifier-Trio. List-Response liefert Slim-Summary ohne `profile`-Blob.
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

- **Doku-Reorganisation:** `docs/`-Verzeichnis in `guides/` (ONBOARDING,
  USER, ADMIN, DEVELOPER, DEPLOYMENT, TROUBLESHOOTING, BETA_TESTING),
  `reference/` (API, ARCHITECTURE) und `archive/` (7 Konzeptdokumente
  aus der Januar-2026-Phase) gegliedert. Neuer Markdown-Index
  `docs/README.md` und Archiv-Hinweis `docs/archive/README.md`.
  `docs/index.html` (GitHub-Pages-Landing) bleibt unangetastet, Links
  darin auf neue `guides/`-Pfade aktualisiert. Drei neue Kapitel
  „Vision & Geschäftsziele", „Anforderungen (FR/NFR)", „Personas &
  Agent-Modell" aus den Konzeptdokumenten in `reference/ARCHITECTURE.md`
  übernommen. Cross-References in `README.md`, `CONTRIBUTING.md` und
  `RELEASE_NOTES.md` auf neue Pfade gezogen.
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

### Geändert

- **Frontend-Paket-Metadaten konsolidiert:** `frontend/package.json` trug noch
  die Vite-Scaffolding-Defaults `name: "frontend"` und `version: "0.0.0"`. Beide
  passen jetzt zu Backend und Root: `name: "valtheron-frontend"`,
  `version: "1.0.0"`. Reine Metadaten-Änderung — kein Code liest die Felder,
  Build und Tests laufen unverändert.
- **Dev-Server-Port von 5173 auf 3055 umgestellt:** `frontend/vite.config.ts`
  pinnt jetzt `server.port: 3055` mit `strictPort: true`, damit Vite bei
  Konflikten laut fehlschlägt statt stillschweigend auf einen anderen Port
  auszuweichen. Backend-CORS-Allowlist in `backend/src/app.ts` ergänzt um
  `http://localhost:3055` (5173/5174/3000 bleiben als Fallback für laufende
  Lokal-Setups). `STRIPE_FRONTEND_URL`-Default in
  `backend/src/routes/donations.ts` ebenfalls auf 3055; Produktion überschreibt
  den Wert weiterhin per Env-Var. README, USER_GUIDE, ONBOARDING,
  DEVELOPER_GUIDE und DEPLOYMENT_GUIDE überall mit der neuen URL.

### Behoben

- **Block F Defekt D-18 (Chat lieferte stets Simulation trotz konfiguriertem
  API-Key):** Jede Chat-Antwort kam mit dem Marker
  `*(Simulation — kein API-Key konfiguriert)*` und kategorie-spezifischen
  fabrizierten Business-Zahlen ("Retention Q4: 78%. Churn-Cluster bei Segment
  B identifiziert."), selbst wenn der User in `LLM Provider`-Settings Anthropic
  mit Key verbunden hatte. Ursache: `frontend/src/components/ChatView.tsx`
  griff per `localStorage.getItem('llmConfig')` (camelCase) auf einen
  Schlüssel zu, den App.tsx unter `KEYS.LLM_CONFIG = 'llm_config'`
  (snake_case) schreibt. `getLLMHeaders()` retournierte daher immer
  `undefined`, der `x-llm-api-key`-Header fehlte am Chat-Request und der
  Backend-Handler landete unkonditional in `generateFallbackResponse()`.
  ChatView importiert jetzt `KEYS` aus `services/persistence` und liest den
  LLM-Config unter demselben Schlüssel, den der Rest der App schreibt.
- **Block B Critical-Finding D-17 (Auth-Bypass auf Security-Routen):**
  Der Beta-Run hat dokumentiert, dass `/api/security/*`, `/api/secrets`,
  `/api/backup` sowie alle übrigen Produktrouten im Dev-Modus
  (`NODE_ENV !== 'production'` und `VALTHERON_REQUIRE_AUTH !== 'true'`) ohne
  `Authorization`-Header HTTP 200 lieferten — inklusive Audit-Log,
  Kill-Switch-Steuerung und Secrets-CRUD. `backend/src/app.ts` setzt jetzt
  `adminGuard` unkonditional auf `adminOnly` und mountet
  `/api/security`, `/api/secrets` und `/api/backup` immer hinter
  `authMiddleware` + `adminGuard`, egal in welchem Modus. Produktrouten
  (`/api/agents`, `/tasks`, `/workflows`, `/analytics`, `/chat`,
  `/collaboration`, `/project-tree`, `/notifications`, `/interactions`)
  behalten den optionalAuth-Fallback in Dev für lokales Klick-Testen, aber
  beim Boot wird jetzt eine deutliche Warnung geloggt, welche Routen offen
  sind und wie man (via `VALTHERON_REQUIRE_AUTH=true`) den
  Produktionspfad spiegelt. Live-Scope-Test nach dem Fix:
  Security-/Secrets-/Backup-Routen ⇒ 401, übrige Produktrouten ⇒ 200.
  Tests in `security.test.ts`, `secrets-api.test.ts`, `backup-api.test.ts`,
  `middleware.test.ts` und `integration.test.ts` registrieren jetzt einen
  Admin und hängen den Token an die geschützten Calls; ein neuer
  Negativ-Test stellt sicher, dass anonyme Aufrufe auf `/api/security/events`
  weiterhin mit 401 abgewiesen werden.
- **Block A Critical-Findings D-4 und D-7 (Auth-Sicherheit):**
  `backend/src/routes/auth.ts` hat Passwörter mit `crypto.createHash('sha256')`
  ohne Salt und ohne Work-Factor gehasht — Rainbow-Table-trivial,
  GPU-Brute-Force in Sekunden. Ersetzt durch **bcryptjs mit Cost 12** in
  Produktion (~250 ms pro Hash, exponentiell teurer für Angreifer); Test-Suite
  läuft mit Cost 4 damit `security-pentest.test.ts` interaktiv bleibt.
  `verifyPassword()` unterstützt beide Formate parallel: bcrypt-Strings
  (`$2a$/$2b$/$2y$`-Prefix) werden direkt verifiziert, alte
  SHA-256-Hex-Strings per `crypto.timingSafeEqual` (kein Timing-Leak) — und
  bei erfolgreichem Login transparent in bcrypt-Form überschrieben.
  Migrations-Script entfällt damit. Login führt den bcrypt-Compare auch bei
  unbekanntem Username gegen einen Referenz-Hash aus, damit Antwortzeiten
  nicht mehr Existenz oder Nicht-Existenz eines Accounts verraten.
  **Login-Rate-Limit von 20/Min auf 5/15Min verschärft:** der allgemeine
  `/api/auth`-Limiter (20 req/min) ließ 10 Fehl-Logins in 16 ms durch — beim
  Beta-Run nachgewiesen. Neuer dedizierter `loginRateLimiter` (5 Versuche /
  15 Min / IP, OWASP ASVS 2.2.1) hängt direkt am `/login`-Handler. Der
  `rateLimiter()` aus `backend/src/middleware/rateLimiter.ts` bekommt einen
  optionalen `keyScope`-Parameter, damit der strenge Login-Limiter nicht
  denselben IP-Bucket mit dem breiteren Auth-Limiter teilt.
  `backend/src/db/seed.ts` Demo-Seed nutzt ebenfalls bcrypt (Cost 10) für
  Konsistenz; der ungenutzte `crypto`-Import entfällt.
  Live-Verifikation: 5 Fehlversuche → 401 (~420 ms je bcrypt-Compare),
  6.–8. Versuch → 429 mit `Retry-After`-Header. Stored Hash: `$2b$12$…`,
  60 Zeichen. Tests: 219/219 frontend + 448/448 backend pass.
- **Beta-Test 2026-05-03 — Agent-Seed ohne fabricated Runtime-State + klare
  Kill-Switch-Labels:** `backend/src/db/seed.ts` hat pro Agent
  `status/successRate/tasksCompleted/failedTasks/avgTaskDuration` aus einem
  ID-keyed RNG vorbelegt — exakt deshalb tauchten auf einer frischen
  Installation "144 aktiv", "72 working", 88.5 % Erfolgsrate und eine
  Top-Performer-Liste mit 99/99/99/99/99 auf, obwohl noch kein Agent eine
  Task ausgeführt hatte. Neue Seeds setzen alle Runtime-Felder auf
  `status='idle'`, `successRate=0`, `tasksCompleted=0`, `failedTasks=0`,
  `avgTaskDuration=0`; ExecutionEngine/WorkflowEngine flippen sie sobald
  echte Tasks laufen. `backend/src/routes/analytics.ts` Top-Performers-Query
  filtert jetzt `WHERE tasksCompleted > 0`, damit die Dashboard-Karte den
  Empty-State trifft statt Seed-Defaults zu listen.
- **Kill-Switch-Labels semantisch korrigiert:** Header-Badge und
  Dashboard-Button rendern `aktiv=true` jetzt als **rotes "GEZÜNDET"** mit
  Untertitel "Alle Agenten suspendiert", `aktiv=false` als **grünes
  "STANDBY"** mit "Bereit — wird bei Auto-Trigger-Verletzung aktiviert".
  Vorher waren Farbe (grün bei `aktiv=true`) und Begriff ("AKTIV") für die
  Gefahrenstellung invers — ein gezündeter Kill-Switch sah aus wie ein
  gesundes System. Tooltips erläutern jeweils, was ein Klick auslöst.
  `KillSwitchView` zieht denselben Begriff. Pro-Regel-Toggle ("AKTIV/AUS")
  bleibt unverändert, weil semantisch anders (Regel aktiviert vs. deaktiviert).

  Bestehende Lokalinstallationen behalten den alten Seed solange
  `backend/data/valtheron.db` nicht gelöscht wird — `seedAgentCatalog`
  short-circuit bei vorhandenen Agenten.
- **Beta-Test 2026-05-03 — EnterpriseView, ProjektBaumView und Certifications
  entmockt (Phase 5/6/7):** Aufbauend auf dem Dashboard-Cleanup wurden alle
  übrigen Sidebar-Tabs auf echte Daten oder explizite Empty-States umgestellt.
  `ProjektBaumView.tsx` lädt den Baum jetzt aus `/api/project-tree` (mit
  Empty-State "Noch keine Projekt-Knoten angelegt"), der 2,5-Sekunden-
  `setInterval`, der zufällige „Live-Updates" wie „Build erfolgreich" oder
  „Test-Suite gestartet" fabriziert hat, ist ersatzlos gestrichen — Updates
  abonnieren stattdessen reale Backend-WebSocket-Events (`agent_status`,
  `task_progress`, `node_update`, `security_event`, `metric_change`). Die
  Agent-Präsenz wird deterministisch aus dem realen Agent-Status abgeleitet
  statt per `Math.random` zugewiesen. `EnterpriseView.tsx` hatte fünf
  Generator-Funktionen (Incidents, Policies, Agent-Versionen, Shared Files,
  Health-Metriken) die jeden Tab mit Random-Fixtures gefüllt haben — alle
  ersetzt durch leere Defaults und Empty-State-Cards, die jeweils den
  Backend-Endpoint nennen, der die Tab-Daten künftig liefern soll
  (`/api/interactions` für Versionen,
  `/api/collaboration/sessions/:id/files` für Shared Workspace,
  `/api/security/audit` für die Audit-Preview). Reports-Tab guardet
  Division-durch-Null in Erfolgsrate-/Avg-Duration-/Policy-Compliance-
  Aggregaten (vorher `NaN%`). `CertificationsView.tsx` zeigt einen
  Empty-State statt einer leeren Tabelle. Backend `seedDefaultTree` legt
  Projekt-Module mit `status='planned'` und `progress=0` an statt mit
  fabrizierten 45 %/70 %/60 %/55 %-Werten. `App.tsx` markiert die
  verbleibende `simulatedOutputs`-/`tickWorkflows`-Workflow-Simulation
  explizit als SIMULATED-Fallback samt Verweis auf den echten Backend-
  Workflow-Engine als nächsten Cleanup-Schritt.
  Frontend-Suite: 219/219 grün, Backend-Suite: 448/448 grün.
- **Beta-Test 2026-05-03 — Dashboard ohne fabricated Demo-Daten (D-8…D-14):**
  Das Dashboard rendert nicht mehr `mockData.ts` (Random `tasksTrend`,
  `Math.random()`-`avgResponseTime`, hardcoded `uptime: 99.97`, String-Literal
  `"von 80 total"`). `App.tsx` lädt `analytics` jetzt aus dem echten Endpoint
  `analyticsAPI.dashboard()` und reagiert auf `metric_change`-WebSocket-Events
  plus 30 s-Poll. `DashboardView.tsx` zeigt `tasksTotal` aus dem Backend,
  formatiert `uptimeSeconds` als „Xd Yh", und rendert Empty-States solange
  noch keine Tasks ausgeführt wurden. `AnalyticsView.tsx` zieht `trends` und
  `slas` aus `/api/analytics/performance` bzw. `/api/analytics/sla` (kein
  lokales `generateTrends`/`generateSLAs` mit Sin+Random mehr). Backend-Endpoint
  `/api/analytics/dashboard` liefert zwei neue Felder: `tasksTotal`
  (`SELECT COUNT(*) FROM tasks`) und `uptimeSeconds` (Prozess-Laufzeit seit
  Start). Initial-States für `tasks`, `securityEvents`, `auditLog`,
  `projektBaum`, `certifications` sind leer; der API-Mount-Effect befüllt sie.
  Neue Datei `frontend/src/services/defaults.ts` hält echte Konfig-Defaults
  (`defaultSecurityConfig` mit `rbac`/`encryption`, `defaultKillSwitch.aktiv:
  false` statt mock-`true`, leerer `defaultProjektBaum`, neutrale
  `defaultAnalytics`). `mockData.ts` wird nur noch von Tests importiert.
  Frontend-Suite: 219/219 grün, Backend-Suite: 448/448 grün.
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
