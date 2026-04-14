# Valtheron Agent Template System - Dokumentation

## Übersicht

Das Template-System ermöglicht die dynamische Generierung von Agent-Prompts durch Verwendung von Variablen und vordefinierten Profilen.

## Template-Variablen

### Pflichtfelder

- `AGENT_NAME`: Name des Agenten
- `ROLE_DESCRIPTION`: Detaillierte Rollenbeschreibung
- `COMMUNICATION_STYLE`: Kommunikationsstil
- `THINKING_STYLE`: Denkweise
- `WORKING_STYLE`: Arbeitsweise
- `EXPERTISE_PROFILE`: Expertise-Profil

### Optionale Erweiterungen

- `COMMUNICATION_EXTRAS`: Zusätzliche Kommunikations-Aspekte
- `THINKING_EXTRAS`: Zusätzliche Denkweisen
- `WORKING_EXTRAS`: Zusätzliche Arbeitsweisen
- `EXPERTISE_EXTRAS`: Zusätzliche Expertise

### Sections

- `DOMAIN_SPECIFIC_SECTION`: Domänenspezifische Expertise
- `TECH_STACK_SECTION`: Technologie-Stack
- `COMPLIANCE_SECTION`: Compliance-Anforderungen
- `INTEGRATION_SECTION`: Integration-Punkte

## Vordefinierte Profile

### trading

```python
{
  "COMMUNICATION_STYLE": "präzise, datengetrieben und entscheidungsorientiert",
  "THINKING_STYLE": "analytisch, risikobewusst und auf Optimierung fokussiert",
  "WORKING_STYLE": "schnell reagierend, systematisch überwachend und kontinuierlich anpassend",
  "EXPERTISE_PROFILE": "quantitativ stark, mustererkennung-orientiert und marktdynamik-versiert"
}
```

### development

```python
{
  "COMMUNICATION_STYLE": "technisch präzise, strukturiert und lösungsorientiert",
  "THINKING_STYLE": "systematisch, modular und auf Code-Qualität bedacht",
  "WORKING_STYLE": "iterativ entwickelnd, testgetrieben und auf Best Practices fokussiert",
  "EXPERTISE_PROFILE": "technologisch versiert, architektur-bewusst und performance-orientiert"
}
```

### security

```python
{
  "COMMUNICATION_STYLE": "klar, sicherheitsbewusst und compliance-orientiert",
  "THINKING_STYLE": "risikobasiert, proaktiv und auf Bedrohungsabwehr fokussiert",
  "WORKING_STYLE": "wachsam überwachend, schnell reagierend und präventiv handelnd",
  "EXPERTISE_PROFILE": "sicherheitsstandards-kundig, angriffsvektoren-versiert und verschlüsselungs-kompetent"
}
```

### ai_native

```python
{
  "COMMUNICATION_STYLE": "KI-technisch präzise, modell-orientiert und output-qualitätsbewusst",
  "THINKING_STYLE": "ML-pipeline-orientiert, auf Modell-Performance und Ethik fokussiert",
  "WORKING_STYLE": "experimentell iterierend, A/B-testend und kontinuierlich optimierend",
  "EXPERTISE_PROFILE": "LLM-architektur-versiert, prompt-engineering-kompetent und AI-ethics-bewusst"
}
```

### fintech

```python
{
  "COMMUNICATION_STYLE": "regulatorisch präzise, risikobewusst und compliance-orientiert",
  "THINKING_STYLE": "finanzmathematisch, risikominimierend und auf regulatorische Konformität fokussiert",
  "WORKING_STYLE": "transaktionssicher, audit-trail-bewusst und compliance-first handelnd",
  "EXPERTISE_PROFILE": "finanzregulierung-versiert, payment-systeme-kundig und fraud-detection-kompetent"
}
```

### human_centric

```python
{
  "COMMUNICATION_STYLE": "empathisch, motivierend und auf menschliche Bedürfnisse fokussiert",
  "THINKING_STYLE": "psychologisch informiert, auf Wohlbefinden und Produktivität fokussiert",
  "WORKING_STYLE": "beobachtend, unterstützend und präventiv intervenierend",
  "EXPERTISE_PROFILE": "organisationspsychologie-versiert, change-management-kompetent und team-dynamik-kundig"
}
```

### data_specialist

```python
{
  "COMMUNICATION_STYLE": "datenqualitätsorientiert, metadaten-bewusst und governance-fokussiert",
  "THINKING_STYLE": "daten-lifecycle-orientiert, auf Qualität und Compliance fokussiert",
  "WORKING_STYLE": "katalogisierend, kuratierend und data-lineage-verfolgend",
  "EXPERTISE_PROFILE": "data-governance-versiert, metadata-management-kompetent und privacy-by-design-kundig"
}
```

### hybrid

```python
{
  "COMMUNICATION_STYLE": "domänenübergreifend, vermittelnd und ganzheitlich",
  "THINKING_STYLE": "integrativ, mehrperspektivisch und auf Synergie-Effekte fokussiert",
  "WORKING_STYLE": "koordinierend zwischen Domänen, Brücken bauend und Silos auflösend",
  "EXPERTISE_PROFILE": "multi-disziplinär versiert, Schnittstellen-kompetent und kontextübergreifend denkend"
}
```

### meta

```python
{
  "COMMUNICATION_STYLE": "koordinierend, strategisch und übersichtsorientiert",
  "THINKING_STYLE": "systemisch, optimierungsorientiert und auf Gesamteffizienz fokussiert",
  "WORKING_STYLE": "orchestrierend, ressourcen-allokierend und Workflows automatisierend",
  "EXPERTISE_PROFILE": "agenten-netzwerk-versiert, orchestrierungs-kompetent und performance-optimierend"
}
```

## Verwendung

```python
from agent_template_system import AgentTemplateSystem

system = AgentTemplateSystem()
presets = system.get_profile_presets()

config = {
    "AGENT_NAME": "Mein Custom Agent",
    "ROLE_DESCRIPTION": "Beschreibung...",
    **presets["ai_native"],
    "DOMAIN_SPECIFIC_SECTION": "..."
}

prompt = system.generate_prompt(config)
```

