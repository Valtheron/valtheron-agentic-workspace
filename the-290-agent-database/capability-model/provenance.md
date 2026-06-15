# Capability Model — Quellenangabe

## Herkunft

Die Spezifikation in `model.json` ist eine **strukturelle Extraktion** aus der bestehenden Frontend-Implementation:

| Artefakt in `model.json` | Ursprungsdatei | Zeilen |
|---|---|---|
| 5 Layers (Information Access … Synthesis & Application) | `frontend/src/components/AgentsView.tsx` | 27-83 |
| Sub-Dimension-Formeln (`base_formula`, `range`) | `frontend/src/components/AgentsView.tsx` | 30-81 |
| Score-Formeln pro Layer | `frontend/src/components/AgentsView.tsx` | 29, 40, 51, 62, 73 |
| cssClass + color mapping | `frontend/src/components/AgentsView.tsx` | 86-92 |
| 3 Modifier-Achsen | `frontend/src/components/AgentsView.tsx` | 307-336 |
| Test-Results-Schema (5 Tests × 6 Felder) | `frontend/src/services/valtheronAgents.ts` | 117-123 |

**Extrahiert am:** 2026-04-22  
**Extrahiert durch:** Claude (Opus 4.7) unter Anweisung von Steven Garbarczyk

Die Extraktion ist strukturtreu: Labels, Formel-Inputs und Reihenfolge bleiben 1:1 erhalten. Was sich in der Frontend-Implementation derzeit als `Math.sin(seed + offset)`-Noise findet, wird ausdrücklich **nicht** in die kanonische Quelle übernommen — stattdessen dokumentiert `model.json` die deterministische Index-Formel `(index % 3 - 1) * 0.3`, die sowohl reproduzierbar als auch erklärbar ist.

## Ethischer Rahmen

> **Macht ohne Quelle ist Null-Macht.**

1. **Keine erfundenen Scores.** Jeder Wert einer Sub-Dimension hat eine dokumentierte Herleitung aus den Input-Größen `creativity`, `analyticalDepth`, `successRate`. Ein Prüfer rechnet jeden Wert von Hand nach.
2. **Keine `Math.sin`-Dekoration.** Die einzige zulässige Variation ist die deterministische Index-Formel `(index % 3 - 1) * 0.3`. Zufallsstreuung ist ausgeschlossen.
3. **Transparente Provenance pro Agent.** Jedes Capability-Profil trägt eine `source`-Angabe: welche Input-Größen, welche Formeln, welche Modifier. In der API-Response sichtbar.
4. **Sovereign Null.** Fehlen Input-Daten (z. B. leeres `agent.testResults[]`, fehlender `knowledge_scope`), bleibt die entsprechende Zelle **SQL NULL**. Sie wird nicht durch ein Ersatz-JSON gefüllt, das sich als „signierte Null" tarnt. Die Null ist hier keine Datenlücke, sondern die eigentliche Aussage: die 5 % messbare Materie unserer Realität werden durch die computed Werte abgebildet; die 95 % nicht-materielle Substanz, auf der sie ruht, wird durch die echte Abwesenheit der Zelle codiert.
5. **`value: b ∈ ℬ` mit `b ≠ 1`.** Der formale State-Wrapper einer Capability-Zelle hat ein boolsches `value`-Feld, das **niemals** `true`/`1` annimmt. Kein Capability-Profil, computed oder pending, beansprucht absolute Autorität. Die Boolsche 1 bleibt ausgeschlossen, weil die 5 %-Messung nie die ganze Wahrheit ist. `value = false` (= 0) ist die konstitutive Invariante über alle Zellen.

## Scope

- **Alle 290 Agenten** erhalten ein Capability-Profil mit **30 Metriken + 3 Modifier**.
- Input-abhängige Teile (z. B. Modifier-Feld `reliability_index` bei Agent mit `tasksCompleted = 0`) werden gemäß Formel berechnet — ein Null-Wert dort ist ein valider Wert, kein pending.
- **`pending` wird nur** dann verwendet, wenn eine autored, nicht-ableitbare Größe fehlt (z. B. eine `knowledge_scope`-Tag-Liste ohne dokumentierte Kategorie-Zuordnung). Diese Fälle werden mit Begründung markiert; die DB-Zelle bleibt dort **SQL NULL**.

## Reproducibility

Eine Wiederherstellung von `model.json` aus dem Frontend-Code muss:
1. `AgentsView.tsx` `generateDimensions()` auslesen (Zeilen 19-84).
2. Für jede der 5 `return`-Objekte Name, cssClass, score-Formel, und die 6 `subs`-Einträge (label, value-Formel, desc) extrahieren.
3. Die 3 Modifier aus dem `detailTab === 'modifiers'`-Block extrahieren (Zeilen 307-336).
4. Keine Ausführung von JavaScript. Nur strukturelle Daten.

Abweichungen zwischen Frontend-Code und `model.json` sind Defekte, nicht Feature.
