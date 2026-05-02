# Benutzerhandbuch — Valtheron Agentic Workspace

**Version:** 1.0.0
**Datum:** Februar 2026

## Vision

Ein System, das nicht nur funktioniert — sondern das, was es tut, mit Würde tut.

Der Valtheron Agentic Workspace ist nicht gebaut worden, um zu beeindrucken. Er ist gebaut worden, um zu dienen: als verlässliches Fundament für autonome Operationen, bei denen jeder Fehler Konsequenzen hat und jede Entscheidung nachvollziehbar sein muss.



---

## Inhaltsverzeichnis

1. [Erste Schritte](#1-erste-schritte)
2. [Dashboard](#2-dashboard)
3. [Agent-Management](#3-agent-management)
4. [Task-Management (Kanban)](#4-task-management-kanban)
5. [Analytics & Monitoring](#5-analytics--monitoring)
6. [Kill-Switch](#6-kill-switch)
7. [Chat & Collaboration](#7-chat--collaboration)
8. [Sicherheit](#8-sicherheit)
9. [LLM-Einstellungen](#9-llm-einstellungen)
10. [Tastenkürzel](#10-tastenkuerzel)

---

## 1. Erste Schritte

### 1.1 Registrierung

1. Öffnen Sie die Anwendung im Browser unter `http://localhost:5173`
2. Klicken Sie auf **"Registrieren"**
3. Geben Sie Benutzername, E-Mail und Passwort ein (mind. 8 Zeichen)
4. Nach erfolgreicher Registrierung werden Sie automatisch eingeloggt

### 1.2 Anmeldung

1. Geben Sie Ihren Benutzernamen und Ihr Passwort ein
2. Klicken Sie auf **"Anmelden"**
3. Falls MFA aktiviert ist, geben Sie den 6-stelligen TOTP-Code ein
4. Sie werden zum Dashboard weitergeleitet

### 1.3 Navigation

Die Seitenleiste (Sidebar) enthält folgende Bereiche:

| Icon | Bereich | Beschreibung |
|------|---------|-------------|
| 📊 | Dashboard | Überblick über alle Metriken |
| 🤖 | Agents | Agent-Verzeichnis und -Details |
| 📋 | Kanban | Task-Board mit Drag & Drop |
| 📈 | Analytics | Performance-Trends und Berichte |
| 🛡️ | Kill-Switch | Notfall-Kontrolle für Agents |
| 💬 | Chat | Agent-Kommunikation |
| ⚙️ | Settings | LLM- und System-Einstellungen |

---

## 2. Dashboard

Das Dashboard bietet einen Echtzeit-Überblick über das gesamte System.

### KPI-Cards

- **Total Agents** — Anzahl aller registrierten Agents
- **Tasks Today** — Heute erstellte/abgeschlossene Tasks
- **Success Rate** — Durchschnittliche Erfolgsrate
- **Error Rate** — Aktuelle Fehlerrate
- **Uptime** — Systemverfügbarkeit

### Widgets

- **Agent-Status-Übersicht** — Verteilung nach Status (active, idle, working, error)
- **Top Performers** — Agents mit höchster Erfolgsrate
- **Security Events** — Letzte Sicherheitsereignisse
- **Kill-Switch-Status** — Aktueller Status (SAFE/ARMED)

---

## 3. Agent-Management

### 3.1 Agent-Verzeichnis

Zeigt alle registrierten Agents mit:
- Name, Kategorie, Status
- Suchfunktion (ab 2 Zeichen)
- Kategorie-Filter

### 3.2 Agent-Details

Klicken Sie auf einen Agent, um das Detail-Panel zu öffnen:

- **Subdimensionen** — Agent-Fähigkeiten und -Konfiguration
- **Übersicht** — Zusammenfassung der Agent-Metriken
- **Schichten** — Architektur-Ebenen des Agents
- **Modifier** — Test-Ergebnisse und Anpassungen

### 3.3 Agent erstellen

1. Klicken Sie auf **"Neuer Agent"**
2. Füllen Sie Name, Kategorie und Beschreibung aus
3. Optional: LLM-Provider und -Modell konfigurieren
4. Klicken Sie auf **"Erstellen"**

---

## 4. Task-Management (Kanban)

### 4.1 Kanban-Board

Das Board enthält 5 Spalten:

| Spalte | Beschreibung |
|--------|-------------|
| **Backlog** | Geplante Tasks |
| **To Do** | Bereit zur Bearbeitung |
| **In Progress** | Aktuell in Bearbeitung |
| **Review** | Zur Überprüfung bereit |
| **Done** | Abgeschlossene Tasks |

### 4.2 Task erstellen

1. Klicken Sie auf **"New Task"** im Kanban-Board
2. Geben Sie einen Titel ein
3. Wählen Sie Priorität und Kategorie
4. Drücken Sie Enter oder klicken Sie auf "Create"

### 4.3 Task verschieben

- Klicken Sie auf den Pfeil-Button rechts am Task
- Der Task wird in die nächste Spalte verschoben

### 4.4 Prioritäten

| Farbe | Priorität |
|-------|----------|
| 🔴 Rot | Critical |
| 🟠 Orange | High |
| 🟡 Gelb | Medium |
| 🔵 Blau | Low |

---

## 5. Analytics & Monitoring

### 5.1 Verfügbare Tabs

| Tab | Inhalt |
|-----|--------|
| **Performance Trends** | KPI-Karten, 7-Tage-Trend-Charts |
| **Durchsatz** | Tasks pro Agent, Durchsatz-Diagramme |
| **Fehlerrate** | Fehler-Verteilung und Trends |
| **Capacity Planning** | Ressourcenauslastung |
| **SLA Monitoring** | SLA-Compliance, Verfügbarkeit |
| **Erfolgsrate** | Top 20 Agents nach Erfolgsrate |

### 5.2 Export

- **JSON-Export**: Vollständige Daten als JSON
- **CSV-Export**: Tabellarische Daten als CSV

---

## 6. Kill-Switch

### 6.1 Zweck

Der Kill-Switch ist ein Notfall-Mechanismus, um alle Agents sofort zu suspendieren.

### 6.2 Tabs

| Tab | Funktion |
|-----|----------|
| **Panel** | ARM/DISARM-Button, Auto-Trigger-Regeln |
| **History** | Alle Kill-Switch-Ereignisse |
| **Risk** | Risiko-Analyse pro Agent |
| **Batch** | Massenoperationen für Agents |

### 6.3 ARM/DISARM

1. Klicken Sie auf den **ARM**-Button
2. Bestätigen Sie im Dialog mit **"Confirm"**
3. Alle aktiven Agents werden sofort suspendiert
4. Zum Deaktivieren klicken Sie auf **DISARM**

### 6.4 Auto-Trigger

Automatische Regeln, die den Kill-Switch auslösen:
- **Fehlerrate > 50%** — Zu viele fehlgeschlagene Tasks
- **Fehlgeschlagene Agents > 3** — Mehrere Agents im Error-Status
- **Failure-Rate > 40%** — Hohe Ausfallquote

---

## 7. Chat & Collaboration

### 7.1 Chat mit Agent

1. Wählen Sie einen Agent aus
2. Öffnen Sie den Chat-Bereich
3. Geben Sie eine Nachricht ein und senden Sie sie
4. Der Agent antwortet basierend auf seinem LLM-Provider

### 7.2 Collaboration-Sessions

- Erstellen Sie eine Session mit mehreren Agents
- Agents können Nachrichten austauschen
- Dateien können geteilt werden

---

## 8. Sicherheit

### 8.1 MFA (Multi-Faktor-Authentifizierung)

1. Gehen Sie zu **Settings → MFA**
2. Klicken Sie auf **"MFA aktivieren"**
3. Scannen Sie den QR-Code mit einer Authenticator-App
4. Geben Sie den 6-stelligen Code ein
5. Speichern Sie die Backup-Codes sicher

### 8.2 Audit-Log

Alle Aktionen werden im Audit-Log protokolliert:
- Benutzer-Aktionen (Login, Logout, CRUD)
- Agent-Aktionen (Start, Stop, Error)
- Sicherheits-Events

### 8.3 Secrets Vault

Sichere Speicherung sensitiver Daten:
- API-Schlüssel
- Zugangstoken
- Verschlüsselt mit AES-256-GCM

---

## 9. LLM-Einstellungen

### 9.1 Unterstützte Provider

| Provider | Status | Beschreibung |
|----------|--------|-------------|
| **Anthropic** | Standard | Claude-Modelle (Opus, Sonnet, Haiku) |
| **OpenAI** | Verfügbar | GPT-4.1, o3, o4-mini |
| **Google** | Optional | Gemini 2.5 Pro/Flash |
| **Mistral** | Optional | Mistral Large/Medium/Small |
| **Groq** | Optional | Llama, Mixtral (schnelle Inferenz) |
| **Ollama** | Lokal | Lokale Modelle ohne API-Key |
| **OpenRouter** | Optional | Multi-Provider-Proxy |
| **Custom** | Optional | Beliebiger OpenAI-kompatibler Endpunkt |

### 9.2 API-Key konfigurieren

1. Gehen Sie zu **Settings → LLM → Providers**
2. Aktivieren Sie den gewünschten Provider
3. Geben Sie Ihren API-Key ein
4. Wählen Sie ein Standard-Modell

### 9.3 Ollama (Lokale Modelle)

1. Installieren Sie [Ollama](https://ollama.ai) lokal
2. Starten Sie Ollama: `ollama serve`
3. Laden Sie ein Modell: `ollama pull llama3.2`
4. In den Settings → LLM → Ollama:
   - Endpunkt: `http://localhost:11434` (Standard)
   - Klicken Sie auf **"Verbindung testen"**
   - Verfügbare Modelle werden automatisch geladen

### 9.4 Custom Endpoint

Für selbstgehostete oder alternative LLM-APIs:
1. Settings → LLM → Providers → Custom aktivieren
2. Endpunkt-URL eingeben
3. API-Key (falls nötig) konfigurieren
4. Modell-ID angeben

---

## 10. Tastenkürzel

| Kürzel | Aktion |
|--------|--------|
| `Ctrl+K` / `⌘K` | Command Palette öffnen |
| `Escape` | Dialog/Panel schließen |
| `↑ / ↓` | Navigation in Listen |
| `Enter` | Auswahl bestätigen |

### Command Palette

Die Command Palette (`Ctrl+K`) bietet schnellen Zugang zu allen Bereichen:
- Tippen Sie den Namen einer View (z.B. "Dashboard", "Agents")
- Suchen Sie nach Agents (ab 2 Zeichen)
- Navigieren Sie mit Pfeiltasten und Enter

---

*Valtheron Agentic Workspace v1.0.0 — Benutzerhandbuch*
