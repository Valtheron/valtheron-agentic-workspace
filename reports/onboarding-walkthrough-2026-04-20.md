# Onboarding-Walkthrough — Befundbericht

**Datum:** 2026-04-20
**Branch:** `claude/test-user-onboarding-flow-Ug5IU`
**Durchläufer:** Claude (Sonnet-Profil) im Auftrag des Benutzers
**Ziel:** Erst-Installation des Valtheron Agentic Workspace wie von einem neuen Nutzer durchgeführt, anhand der README durchspielen und Abweichungen zwischen Dokumentation und Realität als Defekte festhalten.

---

## 1. Durchlauf-Profil

| Phase | Pfad | Ergebnis |
|---|---|---|
| 0 Reset | — | Clean: `git status` sauber, kein `node_modules`, keine DB |
| 1 Voraussetzungen | — | Node 22.22.2 ✓, Docker-CLI 29.3.1 ✓, `git` 2.43 ✓, Docker-Daemon nur mit Sandbox-Workaround |
| 2 Struktur | — | Alle 25 aus README verlinkten Dateien existieren |
| 3 `.env` | — | `backend/.env` + `frontend/.env` erstellt, JWT_SECRET gesetzt, API-Key hinterlegt |
| 4A Docker | — | **Statisch geprüft** (Dockerfiles, compose, Ports konsistent). E2E-Build in gVisor-Sandbox nicht durchführbar (overlay mount + bridge networking fehlen). Kein Valtheron-Defekt. |
| 4B Dev | `npm run install:all` → `npm run dev` | Beide Server starten, Backend auf :3001 gesund, Frontend auf :5173 erreichbar (mit Redirect auf Base-Path) |
| 5 Login | API | Register #1 → `admin` ✓, Register #2 → `operator` ✓, Login + `/me` ✓ |
| 6 Smoke-Test | 10 GET-Endpoints + Chat-POST | Alle GET 200, aber **agents: 0** auf frischer DB (Chat bricht mit FK-Fehler) |

---

## 2. Defekt-Journal

| # | Phase | Befund | Datei(en) | Schweregrad | Fix-Vorschlag |
|---|---|---|---|---|---|
| D-1 | 6 | `GET /api/agents` liefert `{total: 0}` bei frischer Installation. Die README wirbt mit „290 KI-Agenten". Ohne undokumentierten `SEED_DEMO=true` beim Start bleibt das gesamte Dashboard leer; `/api/chat/sessions` quittiert dann mit `SQLITE_CONSTRAINT_FOREIGNKEY` (kein Agent existiert). Erster Kontakt wirkt defekt. | `backend/src/app.ts:118-120`, `backend/src/db/seed.ts:375`, `README.md` | **blocker** (Onboarding-UX) | Entweder (a) Agent-Katalog standardmäßig aus `the-290-agent-database/` in leerer DB laden; oder (b) README-Abschnitt „Erste Schritte" um `SEED_DEMO=true npm run dev` bzw. `-e SEED_DEMO=true` in compose ergänzen. |
| D-2 | 5 | `npm run dev` im Dev-Modus zeigt **kein Login** — `import.meta.env.PROD`-Check in `frontend/src/App.tsx:465` umgeht LoginView. README unterscheidet nirgends zwischen Dev und Prod. Ein Tester, der lokal entwickelt, glaubt, die Auth sei komplett unimplementiert (genau der Eindruck im ursprünglichen Ticket). | `frontend/src/App.tsx:465`, `backend/src/app.ts:86-88`, `README.md:157-179` | **major** | README um Abschnitt „Dev vs. Produktions-Login" ergänzen; optional ENV-Flag `VITE_VALTHERON_REQUIRE_AUTH` / `VALTHERON_REQUIRE_AUTH`, um Auth auch im Dev-Modus erzwingbar zu machen. |
| D-3 | 4B/5 | README sagt Dev-URL sei `http://localhost:5173`. Tatsächlich serviert Vite unter `/valtheron-agentic-workspace/` (GitHub-Pages-Base). Root-URL erzwingt 302 — funktioniert, ist aber verwirrend bei direkten Asset-/Bookmark-Zugriffen. | `frontend/vite.config.ts:6` (`base: '/valtheron-agentic-workspace/'`), `README.md:174` | **minor** | Entweder Base-Path nur für Production-Build (via `base: command === 'build' ? '/valtheron-agentic-workspace/' : '/'`) oder README-Zeile 174 korrigieren. |
| D-4 | 3 | `frontend/.env.example` existiert, wird aber in der README nicht erwähnt. Ein vorsichtiger Nutzer übersieht sie und konfiguriert `VITE_API_URL` nie. | `README.md:146-148`, `frontend/.env.example` | **minor** | README-Snippet erweitern: `cp frontend/.env.example frontend/.env` analog. |
| D-5 | 4B | `package.json:6` verwendet `npm run dev:backend & npm run dev:frontend`. Der nackte `&`-Operator ist **nicht cross-platform**: unter Windows PowerShell wird er als Pipeline-Operator interpretiert und scheitert. Auch auf POSIX: Wenn der erste Prozess crasht, bleibt der zweite verwaist. | `package.json:6` | **major** | `concurrently "npm:dev:backend" "npm:dev:frontend"` (bereits als reguläres Tooling etabliert), oder `npm-run-all --parallel dev:backend dev:frontend`. Inklusive Kill-Signal-Propagation. |
| D-6 | 2 | README nennt `docker-compose up -d` mit Bindestrich (Legacy-Befehl). Moderne Docker-Installationen liefern nur `docker compose`. Außerdem enthält `docker-compose.yml` `version: "3.9"`, was Compose v2 als obsolet warnt. | `README.md:151`, `docker-compose.yml:1` | **minor** | README auf `docker compose up -d` umstellen; `version:`-Zeile aus `docker-compose.yml` entfernen. |
| D-7 | 1 | Docker-CLI-Aufrufe ohne Daemon-Rechte liefern `permission denied on /var/run/docker.sock`. Neuer Linux-Nutzer (nicht in Gruppe `docker`) scheitert an Phase 4. README erwähnt das nicht. | `README.md:133-155` | **major** | README „Voraussetzungen" um Hinweis `sudo usermod -aG docker $USER && newgrp docker` ergänzen, oder auf `docs/TROUBLESHOOTING_GUIDE.md` verweisen. |
| D-8 | 3 | `backend/.env.example` enthält `JWT_SECRET=valtheron-dev-secret-change-in-production` als Default. Tester kopiert die Datei und vergisst, ihn zu tauschen. Kein Warn-Log beim Start. | `backend/.env.example:8`, `backend/src/middleware/auth.ts` | **major** | Beim Boot prüfen: wenn `NODE_ENV=production` und `JWT_SECRET` auf Default steht → `throw` oder `console.error` + Prozess-Exit. Im Dev-Modus nur Warnung. |
| D-9 | 4B | `npm install` liefert 5 High-/Moderate-Vulnerabilities (Backend) + 4 (Frontend). Wird ignoriert, steht aber im Startlog. | `backend/package-lock.json`, `frontend/package-lock.json` | **minor** | `npm audit fix` regelmäßig durchlaufen lassen; optional in CI als Blocker. |
| D-10 | 2 | Nutzer hat berichtet: zweiter `cp backend/.env.example backend/.env` aus dem Unterordner führte zu Fehler, weil der Pfad doppelt war. Das ist ein Nutzerfehler, aber die README begünstigt ihn, weil der Kontext nicht explizit auf Repo-Root pinnt. | `README.md:146-147` | **minor** | Vor dem Snippet einen eindeutigen Hinweis: `# Im Repo-Root ausführen:`. |

**Legende Schweregrade:** **blocker** = verhindert funktionalen Ersteindruck · **major** = verwirrt oder blockiert Teil-Flows · **minor** = kosmetisch/Doku/Nebeneffekt.

---

## 3. Sandbox-Randbedingungen (kein Valtheron-Defekt)

Diese Beobachtungen betreffen die Test-Umgebung (gVisor/runsc) und nicht das Produkt. Werden **nicht** als Defekte geführt:

- **S-1:** `dockerd` startet nur mit `--iptables=false --ip-forward=false --bridge=none`.
- **S-2:** `docker compose build` scheitert an Overlay-Mount (selbst mit `--storage-driver=vfs`) und am fehlenden Bridge-Netzwerk beim `apk add`-Schritt.
- **S-3:** Background-Prozesse werden zwischen Tool-Calls teilweise beendet; Neustarts via `run_in_background` waren nötig.

Auf einem normalen Linux-Host mit Standard-Docker-Installation tritt keiner dieser Effekte auf.

---

## 4. Empfohlene Fix-Reihenfolge für Phase 8

1. **D-1 (Agents-Seed)** — blockiert den UX-Ersteindruck komplett.
2. **D-5 (`npm run dev` Cross-Platform)** — trivial, schützt alle Nicht-Linux-Nutzer.
3. **D-2 (Dev vs. Prod Login-Doku)** — unverzichtbar, hat bereits zu Missverständnis geführt.
4. **D-7 (Docker-Permission-Hinweis)**, **D-8 (JWT_SECRET-Guard)**.
5. **D-3, D-4, D-6, D-9, D-10** — Doku-Touch-ups in einem Rutsch.

---

## 5. Offene Punkte

- **Chat mit echtem LLM-Call** wurde wegen D-1 (leere Agents-Tabelle) nicht end-to-end gegen Anthropic gefahren. Nach D-1-Fix einmal manuell nachziehen.
- **Docker-E2E-Build** bleibt in dieser Sandbox unprüfbar. Vor einem Release sollte ein Maintainer `docker compose up -d --build` auf einem echten Host durchspielen.
