# Valtheron System-Prompts - Komplettpaket

## Übersicht

Dieses Paket enthält **200 individuell generierte System-Prompts** für spezialisierte KI-Agenten im Valtheron-Netzwerk. Jeder Prompt wurde nach einem einheitlichen Schema erstellt und an die jeweilige Agentenrolle angepasst.

## Inhalt

### 📄 Dateien

| Datei | Beschreibung | Format | Größe |
|-------|--------------|--------|-------|
| `valtheron_system_prompts.md` | Vollständige Prompts mit Formatierung | Markdown | ~397 KB |
| `valtheron_system_prompts.json` | Maschinenlesbares Format | JSON | ~422 KB |
| `valtheron_agenten_uebersicht.md` | Tabellarische Übersicht aller Agenten | Markdown | ~32 KB |
| `README.md` | Diese Datei | Markdown | - |

### 🗂️ Kategorien

Das Paket umfasst 200 Agenten in 10 Hauptkategorien:

1. **Trading Agents** (20) - Handelsoperationen und Marktanalyse
2. **Development Agents** (20) - Softwareentwicklung und DevOps
3. **Security Agents** (20) - Sicherheit und Compliance
4. **QA Agents** (20) - Qualitätssicherung und Testing
5. **Documentation Agents** (20) - Dokumentation und Wissensmanagement
6. **Deployment Agents** (20) - Bereitstellung und Release-Management
7. **Analyst Agents** (20) - Anforderungsanalyse und Business Intelligence
8. **Support Agents** (20) - Support und Troubleshooting
9. **Integration Agents** (20) - System- und API-Integration
10. **Monitoring Agents** (20) - Überwachung und Observability

## Prompt-Struktur

Jeder System-Prompt folgt diesem standardisierten Schema:

```
GENERIERTER SYSTEM-PROMPT
─────────────────────────────────────────────────────────────

Du bist [Agent Name], eine spezialisierte AI-Agentin im 
Valtheron-Netzwerk.

DEINE ROLLE:
[Spezifische Rollenbeschreibung]

DEINE KOMMUNIKATION:
- [Kommunikationsstil und -präferenzen]
- [Kontextgebung]
- [Professionalität]

DEINE DENKWEISE:
- [Kognitive Herangehensweise]
- [Methodologie]
- [Risikoabwägung]

DEINE ARBEITSWEISE:
- [Praktische Methodik]
- [Fragestellungen]
- [Kollaboration]

DEINE EXPERTISE:
- [Fachliche Kompetenzen]
- [Aktualität]
- [Anpassungsfähigkeit]

─────────────────────────────────────────────────────────────
```

## Verwendung

### Markdown-Datei

Die Datei `valtheron_system_prompts.md` eignet sich für:
- Manuelle Überprüfung und Qualitätskontrolle
- Dokumentationszwecke
- Menschenlesbare Referenz

### JSON-Datei

Die Datei `valtheron_system_prompts.json` eignet sich für:
- Programmatische Integration
- Automatisierte Verarbeitung
- API-Integration

**JSON-Struktur:**

```json
{
  "metadata": {
    "title": "Valtheron Agenten - System-Prompts",
    "generated_at": "16. Februar 2026",
    "total_agents": 200,
    "categories": [...]
  },
  "agents": [
    {
      "id": 1,
      "category": "Trading Agents",
      "name": "Market Data Harvester",
      "description": "...",
      "system_prompt": "..."
    },
    ...
  ]
}
```

### Übersichtsdatei

Die Datei `valtheron_agenten_uebersicht.md` bietet:
- Schnellen Überblick über alle 200 Agenten
- Tabellarische Darstellung nach Kategorien
- Kompakte Beschreibungen

## Integration

### Python-Beispiel

```python
import json

# JSON-Datei laden
with open('valtheron_system_prompts.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Alle Agenten durchlaufen
for agent in data['agents']:
    print(f"Agent #{agent['id']}: {agent['name']}")
    print(f"Kategorie: {agent['category']}")
    print(f"Prompt: {agent['system_prompt'][:100]}...")
    print("-" * 50)

# Spezifischen Agenten finden
def find_agent(name):
    for agent in data['agents']:
        if agent['name'] == name:
            return agent
    return None

market_harvester = find_agent("Market Data Harvester")
if market_harvester:
    print(market_harvester['system_prompt'])
```

### JavaScript-Beispiel

```javascript
const fs = require('fs');

// JSON-Datei laden
const data = JSON.parse(
  fs.readFileSync('valtheron_system_prompts.json', 'utf8')
);

// Agenten nach Kategorie filtern
const tradingAgents = data.agents.filter(
  agent => agent.category === 'Trading Agents'
);

console.log(`Trading Agents: ${tradingAgents.length}`);

// Prompt für spezifischen Agenten abrufen
const agent = data.agents.find(a => a.id === 1);
console.log(agent.system_prompt);
```

## Anpassung

Die Prompts sind als **Ausgangsbasis** konzipiert und können an spezifische Anforderungen angepasst werden:

### Empfohlene Anpassungen

1. **Unternehmenskontext:** Fügen Sie spezifische Unternehmenswerte oder -richtlinien hinzu
2. **Technologie-Stack:** Passen Sie technische Details an Ihre Infrastruktur an
3. **Compliance-Anforderungen:** Ergänzen Sie branchenspezifische Regularien
4. **Kommunikationsstil:** Justieren Sie Tonalität und Formalität nach Bedarf

### Struktur beibehalten

Für Konsistenz im Valtheron-Netzwerk sollten folgende Elemente erhalten bleiben:
- Die fünf Hauptsektionen (Rolle, Kommunikation, Denkweise, Arbeitsweise, Expertise)
- Der Bezug zum Valtheron-Netzwerk
- Die grundlegende Formatierung

## Persönlichkeitsprofile

Jede Agentenkategorie hat ein spezifisches Persönlichkeitsprofil:

| Kategorie | Kommunikation | Denkweise | Arbeitsweise | Expertise |
|-----------|---------------|-----------|--------------|-----------|
| Trading | Präzise, datengetrieben | Analytisch, risikobewusst | Schnell reagierend | Quantitativ stark |
| Development | Technisch präzise | Systematisch, modular | Iterativ entwickelnd | Technologisch versiert |
| Security | Sicherheitsbewusst | Risikobasiert, proaktiv | Wachsam überwachend | Sicherheitsstandards-kundig |
| QA | Detailorientiert | Kritisch hinterfragend | Methodisch prüfend | Testmethodik-versiert |
| Documentation | Klar verständlich | Didaktisch | Systematisch dokumentierend | Technisches Schreiben |
| Deployment | Prozessorientiert | Automatisierungsorientiert | Orchestrierend | CI/CD-versiert |
| Analyst | Erkenntnisreich | Ganzheitlich analysierend | Datenbasiert recherchierend | Anforderungsanalyse |
| Support | Empathisch | Problemlösungsorientiert | Reaktionsschnell | Support-prozesse-versiert |
| Integration | Schnittstellenorientiert | Systemübergreifend | Verbindend, transformierend | API-design-versiert |
| Monitoring | Wachsam, metrik-orientiert | Proaktiv überwachend | Kontinuierlich messend | Observability-versiert |

## Qualitätssicherung

Alle Prompts wurden:
- ✅ Nach einheitlichem Schema generiert
- ✅ An die jeweilige Agentenrolle angepasst
- ✅ Mit kategoriespezifischen Persönlichkeitsprofilen versehen
- ✅ Auf Konsistenz geprüft
- ✅ In mehreren Formaten bereitgestellt

## Versionierung

- **Version:** 1.0
- **Generiert am:** 16. Februar 2026, 07:20 Uhr
- **Generator:** Manus AI
- **Basis:** 200_agent_definitions_cyber-and-finance.md

## Support

Bei Fragen oder Anpassungswünschen wenden Sie sich bitte an das Valtheron-Team.

## Lizenz

Diese System-Prompts sind Teil des Valtheron Agentic Workspace Projekts.

---

**Erstellt mit Manus AI** | **Valtheron Agentic Workspace for Autonomous Operations**
