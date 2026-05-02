# Beta-Testing — Valtheron Agentic Workspace

**Version:** 1.0.0-beta
**Datum:** Februar 2026
**Status:** Bereit für interne Beta

---

## 1. Beta-Test-Plan

### 1.1 Phasen

| Phase | Teilnehmer | Dauer | Ziel |
|-------|-----------|-------|------|
| **Interne Alpha** | Entwicklungsteam (3-5) | 1 Woche | Grundfunktionen, Stabilität |
| **Interne Beta** | Erweitertes Team (10-15) | 2 Wochen | Feature-Vollständigkeit, Usability |
| **Geschlossene Beta** | Ausgewählte Benutzer (50-100) | 3 Wochen | Reale Nutzungsszenarien, Performance |
| **Offene Beta** | Öffentlich | 4 Wochen | Skalierung, Edge-Cases |

### 1.2 Entry-Kriterien

- [x] Alle Unit-Tests bestehen (378+ Tests, 0 Failures)
- [x] Code-Coverage > 85% (Backend: 87.8%)
- [x] SAST-Scanning ohne kritische Findings
- [x] API-Dokumentation vollständig
- [x] Performance-Tests bestanden
- [x] Security-Tests bestanden
- [ ] Deployment-Guide fertiggestellt
- [ ] Staging-Umgebung eingerichtet

### 1.3 Exit-Kriterien

- Bug-Fix-Rate > 90% (gemeldete Bugs behoben)
- Keine kritischen oder hohen offenen Bugs
- User-Satisfaction-Score > 4/5
- Performance-Ziele in Produktion erreicht (< 200ms p95)
- Kein Datenverlust oder Sicherheitsvorfall

---

## 2. Test-Szenarien

### 2.1 Authentifizierung & Autorisierung

| # | Szenario | Schritte | Erwartet | Status |
|---|----------|----------|----------|--------|
| A1 | Benutzer-Registrierung | 1. `/register` aufrufen 2. Formular ausfüllen 3. Absenden | Account erstellt, Token erhalten | ⬜ |
| A2 | Login mit Credentials | 1. Username/Passwort eingeben 2. Login klicken | JWT-Token, Dashboard geladen | ⬜ |
| A3 | MFA-Setup | 1. Settings → MFA 2. QR-Code scannen 3. TOTP bestätigen | MFA aktiviert, Backup-Codes erhalten | ⬜ |
| A4 | Login mit MFA | 1. Login 2. MFA-Code eingeben | Zugang gewährt | ⬜ |
| A5 | Token-Refresh | 1. 23h warten 2. Aktion ausführen | Token automatisch erneuert | ⬜ |
| A6 | Fehlerhafter Login | 1. Falsche Credentials | Fehlermeldung, kein Zugang | ⬜ |

### 2.2 Agent-Management

| # | Szenario | Schritte | Erwartet | Status |
|---|----------|----------|----------|--------|
| B1 | Agent erstellen | 1. Agents → Neu 2. Daten eingeben 3. Speichern | Agent in Liste sichtbar | ⬜ |
| B2 | Agent bearbeiten | 1. Agent auswählen 2. Daten ändern 3. Speichern | Änderungen übernommen | ⬜ |
| B3 | Agent löschen | 1. Agent auswählen 2. Löschen bestätigen | Agent entfernt | ⬜ |
| B4 | Agent suchen | 1. Suchfeld nutzen 2. Begriff eingeben | Gefilterte Ergebnisse | ⬜ |
| B5 | Agent suspendieren | 1. Agent → Suspend | Status = suspended | ⬜ |
| B6 | Agent-Details | 1. Agent in Liste klicken | Detail-Panel mit Dimensionen, Tests | ⬜ |

### 2.3 Task-Management (Kanban)

| # | Szenario | Schritte | Erwartet | Status |
|---|----------|----------|----------|--------|
| C1 | Task erstellen | 1. Kanban → New Task 2. Titel/Details 3. Erstellen | Task in Backlog-Spalte | ⬜ |
| C2 | Task verschieben | 1. Task auswählen 2. In nächste Spalte verschieben | Status aktualisiert | ⬜ |
| C3 | Task-Priorität | 1. Task → Priorität ändern | Badge-Farbe ändert sich | ⬜ |
| C4 | Task löschen | 1. Task → Löschen | Task entfernt | ⬜ |

### 2.4 Kill-Switch

| # | Szenario | Schritte | Erwartet | Status |
|---|----------|----------|----------|--------|
| D1 | Kill-Switch armen | 1. Kill-Switch → ARM 2. Bestätigen | Status = ARMED, Agents suspendiert | ⬜ |
| D2 | Kill-Switch disarmen | 1. Kill-Switch → DISARM | Status = SAFE | ⬜ |
| D3 | Auto-Trigger | 1. Fehlerrate > Schwellwert simulieren | Automatisch ARMED | ⬜ |
| D4 | Batch-Operationen | 1. Mehrere Agents auswählen 2. Aktion ausführen | Alle selektierten Agents betroffen | ⬜ |

### 2.5 Analytics & Monitoring

| # | Szenario | Schritte | Erwartet | Status |
|---|----------|----------|----------|--------|
| E1 | Dashboard laden | 1. Dashboard aufrufen | KPI-Cards, Charts sichtbar | ⬜ |
| E2 | Performance Trends | 1. Analytics → Trends | Diagramme mit 7-Tage-Daten | ⬜ |
| E3 | SLA-Monitoring | 1. Analytics → SLA | SLA-Metriken sichtbar | ⬜ |
| E4 | Export JSON | 1. Analytics → Export JSON | JSON-Datei heruntergeladen | ⬜ |
| E5 | Export CSV | 1. Analytics → Export CSV | CSV-Datei heruntergeladen | ⬜ |

### 2.6 Collaboration & Chat

| # | Szenario | Schritte | Erwartet | Status |
|---|----------|----------|----------|--------|
| F1 | Chat-Session starten | 1. Agent auswählen 2. Chat öffnen | Chat-UI sichtbar | ⬜ |
| F2 | Nachricht senden | 1. Text eingeben 2. Senden | Nachricht angezeigt, Antwort erhalten | ⬜ |
| F3 | Collaboration-Session | 1. Mehrere Agents einladen | Shared Workspace aktiv | ⬜ |

### 2.7 Security

| # | Szenario | Schritte | Erwartet | Status |
|---|----------|----------|----------|--------|
| G1 | Audit-Log prüfen | 1. Security → Audit | Alle Aktionen geloggt | ⬜ |
| G2 | Security-Events | 1. Security → Events | Events sichtbar, filterbar | ⬜ |
| G3 | Secrets Vault | 1. Secret erstellen 2. Abrufen 3. Löschen | CRUD funktioniert, verschlüsselt | ⬜ |

---

## 3. Feedback-Formular

### Bug-Report-Template

```markdown
**Titel:** [Kurzbeschreibung]
**Schweregrad:** Critical / High / Medium / Low
**Browser:** [Name + Version]
**Schritte zur Reproduktion:**
1. ...
2. ...
3. ...
**Erwartetes Verhalten:** ...
**Tatsächliches Verhalten:** ...
**Screenshots:** [falls verfügbar]
**Konsolen-Errors:** [falls vorhanden]
```

### Feature-Request-Template

```markdown
**Titel:** [Feature-Name]
**Beschreibung:** [Was soll das Feature tun?]
**Nutzen:** [Warum ist dieses Feature wichtig?]
**Priorität:** Must-have / Should-have / Nice-to-have
```

---

## 4. Beta-Test-Report (Template)

### Zusammenfassung

| Metrik | Wert |
|--------|------|
| **Test-Zeitraum** | TBD |
| **Teilnehmer** | TBD |
| **Gemeldete Bugs** | TBD |
| **Behobene Bugs** | TBD |
| **Feature-Requests** | TBD |
| **Durchschnittliche Zufriedenheit** | TBD /5 |

### Bug-Statistik

| Schweregrad | Gemeldet | Behoben | Offen |
|------------|----------|---------|-------|
| Critical | 0 | 0 | 0 |
| High | 0 | 0 | 0 |
| Medium | 0 | 0 | 0 |
| Low | 0 | 0 | 0 |

### Top-Feedback-Themen

1. TBD
2. TBD
3. TBD

### Empfehlungen

- TBD

---

## 5. Known Issues (Pre-Beta)

| # | Issue | Schweregrad | Workaround |
|---|-------|------------|------------|
| 1 | SMS-MFA nicht implementiert (nur TOTP) | Low | TOTP-App verwenden |
| 2 | PostgreSQL/MongoDB nicht unterstützt | Info | SQLite deckt alle Anforderungen |
| 3 | Redis-Caching nicht unterstützt | Info | In-Memory-Cache mit TTL aktiv |

---

*Erstellt: Februar 2026 | Valtheron Agentic Workspace v1.0.0-beta*
