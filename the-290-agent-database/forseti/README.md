# Forseti Power Framework — kanonische Quelle

Dieses Verzeichnis enthält die **autoritativen Spezifikationen** für das Forseti-Bewertungsmodell der Valtheron-Agenten.

## Dateien

| Datei | Inhalt |
|---|---|
| `power_framework.json` | 5 Dimensionen × 6 Sub-Dimensionen = 30 Sub-Metrics. Skala 0-9. Enthält `SUBDIMENSION_LABELS` (10 Stufen je Sub-Metric), `CATEGORY_BASE_SCORES` (10 Forseti-Kategorien), `MODEL_MODIFIERS`, `KEYWORD_MODIFIERS` und die Variations-Formel. |
| `layer_taxonomy.json` | Orthogonale 5-Schichten-Taxonomie (TECHNICAL → LIMINAL) mit 32 Elementen, Measurability-Klassen und kategoriespezifischen Layer-Gewichten. Liefert die abgeleiteten Indizes Layer Depth Score, Measurability Index, Emergence Potential. |
| `category_mapping.json` | Autored Mapping von Valtheron-Agent-Kategorien (trading, security, …) auf Forseti-Kategorien (Analytiker, Entwickler, …). Kein Auto-Mapping — wo unsicher, explizit `null` mit Begründung. |
| `provenance.md` | Herkunftsangabe (externes Vorgänger-Repo), Import-Datum, ethischer Rahmen, Reproducibility-Anweisungen. |

## Die 5 Forseti-Dimensionen

1. **Information Access** — Zugang zu Informationsquellen, Umfang, zeitliche Reichweite, Verifizierbarkeit.
2. **Resource Control** — Kontrolle über Rechen-, Finanz-, Infrastruktur-, Personal-, Energie- und Zeit-Ressourcen.
3. **Authority & Permission** — Rechtliche, hierarchische, finanzielle und territoriale Autorität; ethische Legitimität.
4. **Network Position** — Vertrauensnetz, Abhängigkeiten, Gatekeeping-Macht, Reputation, Mobilisierungs-Kapazität.
5. **Synthesis & Application** — Informations-Synthese, Kreativität, strategische Planung, Entscheidungsqualität, Lernfähigkeit, Gedächtnis-Architektur.

Jede Dimension hat **genau 6 Sub-Dimensionen**, insgesamt **30 Sub-Metrics** auf einer Skala von **0-9**. Die Labels der 10 Stufen (0 = „No Knowledge / No Power / No Memory", 9 = „Approaching Universal / Approaching Unlimited / Divine Creation") stehen in `power_framework.json#sub_dimension_labels`.

## Das Unified Power Level

Aus den 5 Dimensions-Durchschnitten wird ein **Unified Level** (0.0-9.0) berechnet als einfaches Mittel. Dieses mappt auf einen Power-Level-Enum-Wert:

```
0  NOTHING
1  BASIC_UI
2  FILTERED_BRAND_SAFE
3  PERSONAL_COMMERCIAL
4  TACTICAL_OPERATIONAL
5  SPECIALIZED_IDEOLOGICAL
6  DOMAIN_PROFESSIONAL
7  MULTI_DOMAIN_ACADEMIC
8  CROSS_INSTITUTIONAL
9  APPROACHING_UNIVERSAL
```

## Ethischer Grundsatz

> **Macht ohne Quelle ist Null-Macht.**

Siehe `provenance.md` für die vollständige Ausformulierung. Kurzfassung:

- Kein Agent erhält Scores ohne dokumentierte Quelle (Kategorie-Basis + Model-Modifier + Keyword-Modifier).
- Kein Zufall, keine Visualisierungs-Dekoration.
- Agenten ohne Mapping → `profile = null`, Status = `pending`, UI zeigt sichtbare Leerstelle.

## Scope

| Zielgruppe | Anzahl | Status |
|---|---|---|
| Standard-Agenten 1-200, kanonische Mapping | 160 (8 Kategorien × 20) | Profil wird berechnet |
| Standard-Agenten security + support | 40 | `pending` — Mapping benötigt autored Entscheidung |
| Extension-Agenten 201-290 | 90 | `pending` — außerhalb Forseti-Scope, eigenes Framework nötig |

## Synchronisation

Die kanonischen JSONs werden per **`npm run sync:forseti`** (in Branch 2 noch hinzuzufügen) nach `frontend/src/data/forseti/` und `backend/src/data/forseti/` gespiegelt. Derivate sind byte-identische Kopien, nie direkt bearbeiten.

## Weiterentwicklung

Änderungen an der Spec erfolgen **nur** durch:

1. Aktualisierung der Ursprungs-Python-Dateien im externen Repo (falls sie weitergepflegt werden), oder
2. Autored Override in `category_mapping.json` für bisher `null`-gemappte Kategorien.

**Nicht** durch Anpassung im generierten Frontend/Backend — diese sind Build-Artefakte.
