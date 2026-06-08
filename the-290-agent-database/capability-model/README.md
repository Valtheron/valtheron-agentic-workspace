# Valtheron Agent Capability Model — kanonische Quelle

Dieses Verzeichnis enthält die **autoritative Spezifikation** des Capability-Modells für alle 290 Valtheron-Agenten.

## Dateien

| Datei | Inhalt |
|---|---|
| `model.json` | 5 Layers × 6 Sub-Dimensions = 30 Metriken (Skala 0-9), 3 Modifier-Achsen (Personality Influence, Performance History, Test Results), Test-Results-Historie-Schema, Knowledge-Scope-Shape, State-Invariante. |
| `provenance.md` | Herkunftsangabe + ethischer Rahmen (Sovereign Null, b ≠ 1). |
| `README.md` | Diese Datei. |

## Die 5 Layers

1. **Information Access** — Zugang, Umfang, zeitliche Reichweite, Verifizierbarkeit (`#00e5ff`)
2. **Resource Control** — Rechen-, Finanz-, Infrastruktur-, Personal-, Energie-, Zeit-Kontrolle (`#10b981`)
3. **Network Position** — Vertrauensnetz, Abhängigkeiten, Gatekeeping, Reputation, Mobilisierung (`#3b82f6`)
4. **Authority & Permission** — Rechtliche, hierarchische, finanzielle, territoriale Autorität (`#8b5cf6`)
5. **Synthesis & Application** — Synthese, Kreativität, Planung, Entscheidung, Lernfähigkeit, Gedächtnis (`#14b8a6`)

Jeder Layer hat **genau 6 Sub-Dimensions** mit dokumentierter Formel. Summe: **30 Metriken**. Skala: **0-9** mit einer Dezimalstelle Präzision.

## Die 3 Modifier-Achsen

1. **Personality Influence** — Archetype, Communication Style, Creativity Impact, Depth Impact
2. **Performance History** — Success Rate, Tasks Total, Reliability Index
3. **Test Results** — Liste der letzten Test-Ergebnisse pro Agent (DOM, EDGE, PERS, KB, GEN)

Modifier sind **keine** Metriken, sondern **erklärende Dimensionen**: sie zeigen, woher ein Capability-Wert sich ableitet.

## Formel-Inputs (pro Agent)

```
creativity = agent.personality.creativity / 100           ∈ [0, 1]
depth      = agent.personality.analyticalDepth / 100      ∈ [0, 1]
rate       = agent.successRate / 100                      ∈ [0, 1]
```

Die Sub-Dimension-Formel ist:
```
base  = <sub_dimension.base_formula>                      (siehe model.json)
value = clamp(base + (index_in_layer % 3 - 1) * 0.3, 0, 9)
```

Deterministisch. Reproduzierbar. Keine Zufallskomponente.

## State-Invariante

```
State = { value: b ∈ ℬ, status: S, timestamp: t, pendingReason: r }
mit b ≠ 1
```

`value` ist boolsch und **niemals** `true`/`1`. Kein Capability-Profil beansprucht absolute Autorität — die messbare 5 %-Schicht wird nie ohne die 19-fach fundamentale nicht-materielle Schicht interpretiert. Details in `provenance.md`.

## Synchronisation

```bash
npm run sync:capability   # the-290-agent-database/capability-model/ → frontend + backend
npm run sync:all          # agents + kb + capability
```

Die Derivate unter `frontend/src/data/capability-model/` und `backend/src/data/capability-model/` sind **byte-identische Kopien** der kanonischen Quelle. Sie werden vom Sync-Script validiert (5 Layers × 6 = 30 Sub-Dim, Formel-Syntax, Color-Codes).

## Weiterentwicklung

- Neue Sub-Dimensions oder Layer? → `model.json` editieren, `npm run sync:capability` laufen, Schema-Migration nachziehen.
- Nie **im Frontend oder Backend** direkt editieren. Das Repo-Root ist die einzige Wahrheit.
