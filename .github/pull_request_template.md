## Beschreibung

<!-- Kurze Beschreibung der Änderungen und warum sie vorgenommen wurden. -->
<!-- Verlinktes Issue: Closes #___ -->

---

## Art der Änderung

- [ ] Bug-Fix (behebt ein Problem ohne Breaking Change)
- [ ] Neues Feature (nicht-breaking Ergänzung)
- [ ] Breaking Change (bestehende Funktionalität ändert sich)
- [ ] Dokumentation
- [ ] Refactoring / Code-Qualität
- [ ] Performance-Verbesserung
- [ ] Sicherheits-Fix

---

## Tests

- [ ] Neue Unit-Tests hinzugefügt
- [ ] Bestehende Tests angepasst
- [ ] Alle Tests bestehen (`npm test` in backend/ und frontend/)
- [ ] Coverage bleibt über 85% (Backend)

---

## Checkliste

- [ ] Code wurde selbst gereviewed
- [ ] Keine Secrets, API-Keys oder `.env`-Dateien im Commit
- [ ] Kein `eval()` oder unsichere Patterns verwendet
- [ ] Alle neuen Endpunkte haben `authenticate`-Middleware
- [ ] Sensitive Operationen haben `authorize`-Middleware
- [ ] Linting fehlerfrei (`npm run lint`)
- [ ] Dokumentation aktualisiert (falls nötig)
- [ ] `CHANGELOG.md` aktualisiert (bei Features/Breaking Changes)

---

## Wie wurde getestet?

<!-- Beschreiben Sie, wie die Änderungen getestet wurden.
     z.B. "Unit Tests für Route X, manuelle Tests im Browser mit Docker Compose" -->

---

## Screenshots (bei UI-Änderungen)

<!-- Vorher / Nachher Screenshots, falls Frontend-Änderungen vorhanden. -->
