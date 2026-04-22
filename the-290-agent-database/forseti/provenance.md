# Forseti — Quellenangabe

## Autoritative Herkunft

Die Dateien in diesem Verzeichnis sind **maschinenlesbare Übertragungen** folgender Python-Quellen aus einem **verwandten, vorangegangenen Valtheron-Repository**:

| Diese Datei | Ursprungsdatei | Herkunft |
|---|---|---|
| `power_framework.json` | `agentic-workspace/forseti/power_framework.py` | [blackicesecure-space/Valtheron](https://github.com/blackicesecure-space/Valtheron/blob/main/agentic-workspace/forseti/power_framework.py) |
| `layer_taxonomy.json` | `agentic-workspace/forseti/layer_analysis.py` | [blackicesecure-space/Valtheron](https://github.com/blackicesecure-space/Valtheron/blob/main/agentic-workspace/forseti/layer_analysis.py) |

**Importiert am:** 2026-04-22  
**Importiert durch:** Claude (Opus 4.7) unter Anweisung von Steven Garbarczyk (CEO, Valtheron)

Die JSONs sind **inhaltstreue Repräsentationen** der Python-Konstanten und Daten-Tabellen — keine Reimplementation, keine Paraphrase. Strukturelle Werte (`category_base_scores`, `sub_dimension_labels`, `model_modifiers`, `keyword_modifiers`, `layer_definitions`, `category_layer_weights`) wurden 1:1 übernommen. Die Scoring-Formeln aus den Methoden `evaluate_agent()` und `LayerAnalyzer._calculate_*()` werden in Branch 2 als TypeScript-Funktionen **neu implementiert**, nicht JSON-verpackt.

## Ethischer Rahmen

> **Macht ohne Quelle ist Null-Macht.**

Dieses Prinzip ist **normativ** für die gesamte Forseti-Integration:

1. **Keine erfundenen Scores.** Jeder Wert eines Agenten hat eine dokumentierte Herleitung: `category_base_scores[Kategorie] + model_modifiers[Modell] + keyword_modifiers[Keyword] + sub_dimension_variation_formula`. Wo keine kanonische Kategorien-Zuordnung existiert, bleibt das Profil `null` mit `status: 'pending'` — nicht gefälscht.
2. **Keine `Math.sin`-Dekoration.** Die im bisherigen UI vorhandene Zufallsstreuung (`Math.sin(seed + offset)`) wird entfernt. Die einzige zugelassene Index-Variation ist die deterministische Formel aus `power_framework.py`: `variation = (i % 3 - 1) * 0.3` — reproduzierbar und erklärbar.
3. **Transparente Provenance pro Agent.** Jedes Forseti-Profil trägt im persistierten Datensatz eine `source`-Angabe: welche Kategorie-Basis, welche Model-Modifier, welche Keyword-Treffer. Ein Prüfer soll jeden Score von Hand nachrechnen können.
4. **Sichtbare Leerstelle statt verfüllter Leerstelle.** Agenten ohne Mapping zeigen im UI „Profil ausstehend — Kategorie benötigt autored Forseti-Zuordnung" statt erfundener Zahlen.

## Scope-Abgrenzung

Forseti ist **autoritativ für die 200 Standard-Agenten** (IDs 1-200, 10 Basis-Kategorien der ersten Valtheron-Edition). Von diesen 200 erhalten bei aktueller Mapping-Tabelle **160 Agenten** ein berechnetes Profil; 40 (Security + Support) bleiben explizit `pending`, bis ein autored Mapping erfolgt.

Die **90 Extension-Agenten (IDs 201-290)** liegen **außerhalb des Forseti-Scopes**. Sie gehören zu Kategorien (Hybrid, Meta, FinTech, AI-Native, Human-Centric, Specialized Data), für die ein eigenes, domänenspezifisches Bewertungsframework erst noch spezifiziert werden muss. Ihre Profile bleiben `null` mit `status: 'pending'`.

## Datenfluss

```
the-290-agent-database/forseti/           (kanonisch)
  ├── power_framework.json
  ├── layer_taxonomy.json
  ├── category_mapping.json
  ├── provenance.md        (diese Datei)
  └── README.md
                │
                │  scripts/sync-forseti.mjs
                ▼
frontend/src/data/forseti/                 (Build-Artefakt)
backend/src/data/forseti/                  (Build-Artefakt, im Docker-Image gebündelt)
                │
                │  backend/src/services/forsetiScoring.ts  (Branch 2, nächstes Inkrement)
                ▼
Tabelle `agent_forseti_profiles`           (Persistenz)
                │
                │  GET /api/agents/:id  →  { ..., forseti: {...} | null }
                ▼
frontend/src/components/AgentsView.tsx     (konsumiert, rendert)
```

## Reproducibility

Jede Wiederherstellung der kanonischen JSONs aus den Python-Quellen muss:

1. `power_framework.py` verbatim auslesen, die Konstanten `PowerLevel`, `CATEGORY_BASE_SCORES`, `MODEL_MODIFIERS`, `KEYWORD_MODIFIERS`, `SUBDIMENSION_LABELS` extrahieren.
2. Die Sub-Dimension-Listen aus der Funktion `evaluate_agent()` (Zeilen mit `create_subdimensions(...)`) extrahieren — das ist die einzige Stelle, wo die 6er-Tupel pro Dimension explizit enumeriert sind.
3. `layer_analysis.py` verbatim auslesen, `LAYER_DEFINITIONS` und `CATEGORY_LAYER_WEIGHTS` extrahieren.
4. Keine Python-Logik ausführen. Nur strukturelle Daten übertragen.

Abweichungen zwischen Python und JSON sind Defekte, nicht Feature.
