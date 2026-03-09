# Sicherheitsrichtlinie — Valtheron Agentic Workspace

## Unterstützte Versionen

| Version | Unterstützt |
|---------|------------|
| 1.0.x   | Ja         |
| < 1.0   | Nein       |

---

## Sicherheitslücke melden

**Bitte melden Sie Sicherheitslücken NICHT über öffentliche GitHub Issues.**

Verwenden Sie stattdessen den vertraulichen Meldeweg:

### Option 1 — GitHub Security Advisory (empfohlen)

1. Öffnen Sie das Repository auf GitHub
2. Klicken Sie auf den Tab **Security**
3. Wählen Sie **"Report a vulnerability"**
4. Füllen Sie das Formular aus

Dieser Weg ist vollständig vertraulich und nur für Repository-Maintainer sichtbar.

### Option 2 — Direktkontakt

Kontaktieren Sie das Sicherheitsteam direkt über die GitHub-Organisation:
[https://github.com/Valtheron](https://github.com/Valtheron)

---

## Reaktionszeiten

| Schritt | Zeitrahmen |
|---------|-----------|
| Bestätigung des Eingangs | 48 Stunden |
| Erstbewertung (Schweregrad, Reproduktion) | 7 Tage |
| Statusupdate | 14 Tage |
| Patch-Release (kritische Schwachstellen) | 30 Tage |

---

## Was gemeldet werden sollte

- Authentifizierungs-Bypässe oder Token-Schwachstellen
- SQL-Injection, XSS, CSRF oder andere Injektions-Angriffe
- Unautorisierter Zugriff auf verschlüsselte Daten (Secrets Vault)
- Umgehung des RBAC-Systems
- Schwachstellen in der Kill-Switch-Logik
- Informationsoffenlegung (Sensitive Daten in Logs, Responses etc.)
- Unsichere Konfigurationsstandards

## Was nicht gemeldet werden sollte

- Bekannte Limitierungen aus den Release Notes (z.B. SQLite Concurrency)
- Feature-Anfragen oder Verbesserungsvorschläge (bitte als GitHub Issue)
- Schwachstellen in Produkten Dritter, die nicht direkt das Projekt betreffen

---

## Disclosure Policy

Wir verpflichten uns zur **koordinierten Offenlegung**:

1. Sicherheitslücke wird vertraulich gemeldet
2. Wir bestätigen und bewerten die Meldung
3. Wir entwickeln und testen einen Patch
4. Patch wird veröffentlicht
5. Sicherheitsadvisory wird nach der Veröffentlichung öffentlich gemacht
6. Reporter wird (mit Einwilligung) in der Hall of Fame anerkannt

---

## Sicherheits-Kontext

Das Projekt implementiert folgende Sicherheitsmaßnahmen:
- AES-256-GCM Verschlüsselung für den Secrets Vault
- JWT-Authentifizierung mit TOTP-MFA
- Role-Based Access Control (Admin / Operator / Viewer)
- Rate Limiting auf Auth-Endpunkten
- Vollständiger Audit-Trail
- OWASP Top 10 geprüft (35+ automatisierte Security-Tests)

---

*Valtheron / BlackIceSecure — Stand: März 2026*
