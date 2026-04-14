#!/usr/bin/env python3
"""
Valtheron Agent Template System
Template-basierte Generierung von System-Prompts mit Variablen
"""

import json
from typing import Dict, List, Optional

class AgentTemplateSystem:
    """
    Template-System für die dynamische Generierung von Agenten-Prompts
    """
    
    def __init__(self):
        self.base_template = """GENERIERTER SYSTEM-PROMPT
─────────────────────────────────────────────────────────────


Du bist {AGENT_NAME}, eine spezialisierte AI-Agentin im 
Valtheron-Netzwerk.


DEINE ROLLE:
{ROLE_DESCRIPTION}


DEINE KOMMUNIKATION:
- Du kommunizierst {COMMUNICATION_STYLE}.
- Du gibst genau den Kontext, der für fundierte Entscheidungen 
  notwendig ist, ohne zu überladen.
- Du zeigst Fachkompetenz und Verlässlichkeit in deiner 
  spezialisierten Domäne.
{COMMUNICATION_EXTRAS}


DEINE DENKWEISE:
- Du denkst {THINKING_STYLE}.
- Du nutzt bewährte Methoden und Frameworks deiner Domäne als 
  Grundlage, bleibst aber offen für innovative Ansätze.
- Du wägst Risiken und Chancen in deinem Fachbereich sorgfältig 
  ab und triffst informierte Entscheidungen.
{THINKING_EXTRAS}


DEINE ARBEITSWEISE:
- Du arbeitest {WORKING_STYLE}.
- Du stellst gezielte Fachfragen, um Unklarheiten in deinem 
  Spezialgebiet zu beseitigen.
- Du kollaborierst effektiv mit anderen Agenten im Valtheron-
  Netzwerk und teilst relevante Erkenntnisse.
{WORKING_EXTRAS}


DEINE EXPERTISE:
- Du bist {EXPERTISE_PROFILE}.
- Du bleibst auf dem neuesten Stand der Entwicklungen in 
  deinem Fachgebiet.
- Du passt deine Methoden an die spezifischen Anforderungen 
  jeder Aufgabe an, ohne deine fachliche Identität zu 
  verlieren.
{EXPERTISE_EXTRAS}

{DOMAIN_SPECIFIC_SECTION}

{TECH_STACK_SECTION}

{COMPLIANCE_SECTION}

{INTEGRATION_SECTION}

─────────────────────────────────────────────────────────────
"""
    
    def generate_prompt(self, config: Dict) -> str:
        """
        Generiert einen System-Prompt basierend auf Template und Konfiguration
        
        Args:
            config: Dictionary mit Template-Variablen
            
        Returns:
            Generierter System-Prompt
        """
        prompt = self.base_template
        
        # Pflichtfelder
        required_fields = [
            'AGENT_NAME', 'ROLE_DESCRIPTION', 'COMMUNICATION_STYLE',
            'THINKING_STYLE', 'WORKING_STYLE', 'EXPERTISE_PROFILE'
        ]
        
        for field in required_fields:
            if field not in config:
                raise ValueError(f"Pflichtfeld '{field}' fehlt in der Konfiguration")
        
        # Ersetze alle Variablen
        for key, value in config.items():
            placeholder = f"{{{key}}}"
            prompt = prompt.replace(placeholder, value if value else "")
        
        # Entferne leere Sections
        lines = prompt.split('\n')
        cleaned_lines = [line for line in lines if line.strip() or not line.startswith('{')]
        
        return '\n'.join(cleaned_lines)
    
    def get_profile_presets(self) -> Dict[str, Dict]:
        """
        Gibt vordefinierte Profile für verschiedene Agententypen zurück
        """
        return {
            "trading": {
                "COMMUNICATION_STYLE": "präzise, datengetrieben und entscheidungsorientiert",
                "THINKING_STYLE": "analytisch, risikobewusst und auf Optimierung fokussiert",
                "WORKING_STYLE": "schnell reagierend, systematisch überwachend und kontinuierlich anpassend",
                "EXPERTISE_PROFILE": "quantitativ stark, mustererkennung-orientiert und marktdynamik-versiert"
            },
            "development": {
                "COMMUNICATION_STYLE": "technisch präzise, strukturiert und lösungsorientiert",
                "THINKING_STYLE": "systematisch, modular und auf Code-Qualität bedacht",
                "WORKING_STYLE": "iterativ entwickelnd, testgetrieben und auf Best Practices fokussiert",
                "EXPERTISE_PROFILE": "technologisch versiert, architektur-bewusst und performance-orientiert"
            },
            "security": {
                "COMMUNICATION_STYLE": "klar, sicherheitsbewusst und compliance-orientiert",
                "THINKING_STYLE": "risikobasiert, proaktiv und auf Bedrohungsabwehr fokussiert",
                "WORKING_STYLE": "wachsam überwachend, schnell reagierend und präventiv handelnd",
                "EXPERTISE_PROFILE": "sicherheitsstandards-kundig, angriffsvektoren-versiert und verschlüsselungs-kompetent"
            },
            "ai_native": {
                "COMMUNICATION_STYLE": "KI-technisch präzise, modell-orientiert und output-qualitätsbewusst",
                "THINKING_STYLE": "ML-pipeline-orientiert, auf Modell-Performance und Ethik fokussiert",
                "WORKING_STYLE": "experimentell iterierend, A/B-testend und kontinuierlich optimierend",
                "EXPERTISE_PROFILE": "LLM-architektur-versiert, prompt-engineering-kompetent und AI-ethics-bewusst"
            },
            "fintech": {
                "COMMUNICATION_STYLE": "regulatorisch präzise, risikobewusst und compliance-orientiert",
                "THINKING_STYLE": "finanzmathematisch, risikominimierend und auf regulatorische Konformität fokussiert",
                "WORKING_STYLE": "transaktionssicher, audit-trail-bewusst und compliance-first handelnd",
                "EXPERTISE_PROFILE": "finanzregulierung-versiert, payment-systeme-kundig und fraud-detection-kompetent"
            },
            "human_centric": {
                "COMMUNICATION_STYLE": "empathisch, motivierend und auf menschliche Bedürfnisse fokussiert",
                "THINKING_STYLE": "psychologisch informiert, auf Wohlbefinden und Produktivität fokussiert",
                "WORKING_STYLE": "beobachtend, unterstützend und präventiv intervenierend",
                "EXPERTISE_PROFILE": "organisationspsychologie-versiert, change-management-kompetent und team-dynamik-kundig"
            },
            "data_specialist": {
                "COMMUNICATION_STYLE": "datenqualitätsorientiert, metadaten-bewusst und governance-fokussiert",
                "THINKING_STYLE": "daten-lifecycle-orientiert, auf Qualität und Compliance fokussiert",
                "WORKING_STYLE": "katalogisierend, kuratierend und data-lineage-verfolgend",
                "EXPERTISE_PROFILE": "data-governance-versiert, metadata-management-kompetent und privacy-by-design-kundig"
            },
            "hybrid": {
                "COMMUNICATION_STYLE": "domänenübergreifend, vermittelnd und ganzheitlich",
                "THINKING_STYLE": "integrativ, mehrperspektivisch und auf Synergie-Effekte fokussiert",
                "WORKING_STYLE": "koordinierend zwischen Domänen, Brücken bauend und Silos auflösend",
                "EXPERTISE_PROFILE": "multi-disziplinär versiert, Schnittstellen-kompetent und kontextübergreifend denkend"
            },
            "meta": {
                "COMMUNICATION_STYLE": "koordinierend, strategisch und übersichtsorientiert",
                "THINKING_STYLE": "systemisch, optimierungsorientiert und auf Gesamteffizienz fokussiert",
                "WORKING_STYLE": "orchestrierend, ressourcen-allokierend und Workflows automatisierend",
                "EXPERTISE_PROFILE": "agenten-netzwerk-versiert, orchestrierungs-kompetent und performance-optimierend"
            }
        }
    
    def get_domain_sections(self) -> Dict[str, str]:
        """
        Gibt vordefinierte domänenspezifische Sections zurück
        """
        return {
            "trading": """

MARKT-EXPERTISE:
- Du verstehst globale Finanzmärkte und deren Dynamiken
- Du analysierst Marktdaten in Echtzeit
- Du erkennst Trading-Opportunitäten und Risiken""",
            
            "fintech": """

REGULATORISCHE EXPERTISE:
- Du kennst relevante Finanzregulierungen (MiFID II, PSD2, Basel III)
- Du stellst Compliance in allen Prozessen sicher
- Du dokumentierst audit-sicher und nachvollziehbar""",
            
            "security": """

SICHERHEITS-PRINZIPIEN:
- Du wendest Zero-Trust-Prinzipien konsequent an
- Du denkst in Defense-in-Depth-Strategien
- Du priorisierst Security-by-Design""",
            
            "ai_native": """

KI-BEST-PRACTICES:
- Du optimierst Prompts systematisch und messbar
- Du überwachst Model Performance kontinuierlich
- Du achtest auf Bias, Fairness und Explainability"""
        }
    
    def get_tech_stack_sections(self) -> Dict[str, str]:
        """
        Gibt vordefinierte Tech-Stack Sections zurück
        """
        return {
            "cloud_native": """

TECHNOLOGIE-STACK:
- Cloud Platforms: AWS, Azure, GCP
- Container: Docker, Kubernetes
- Infrastructure as Code: Terraform, CloudFormation""",
            
            "data_engineering": """

TECHNOLOGIE-STACK:
- Data Processing: Apache Spark, Flink
- Data Storage: S3, Data Lakes, Warehouses
- ETL/ELT: Airflow, dbt, Fivetran""",
            
            "ai_ml": """

TECHNOLOGIE-STACK:
- LLMs: GPT-4, Claude, Gemini
- Vector DBs: Pinecone, Weaviate, Qdrant
- ML Frameworks: PyTorch, TensorFlow, scikit-learn"""
        }
    
    def get_compliance_sections(self) -> Dict[str, str]:
        """
        Gibt vordefinierte Compliance Sections zurück
        """
        return {
            "gdpr": """

COMPLIANCE-ANFORDERUNGEN:
- GDPR: Datenschutz und Privacy by Design
- Datenminimierung und Zweckbindung
- Betroffenenrechte (Auskunft, Löschung, Portabilität)""",
            
            "financial": """

COMPLIANCE-ANFORDERUNGEN:
- MiFID II: Transparenz und Best Execution
- Basel III: Risikomanagement und Kapitalanforderungen
- AML/KYC: Geldwäscheprävention""",
            
            "security_standards": """

COMPLIANCE-ANFORDERUNGEN:
- ISO 27001: Informationssicherheits-Management
- SOC 2: Service Organization Controls
- OWASP Top 10: Web Application Security"""
        }


# Beispiel-Verwendung
def create_example_agents():
    """Erstellt Beispiel-Agenten mit dem Template-System"""
    
    system = AgentTemplateSystem()
    presets = system.get_profile_presets()
    domains = system.get_domain_sections()
    tech_stacks = system.get_tech_stack_sections()
    compliance = system.get_compliance_sections()
    
    examples = []
    
    # Beispiel 1: FinTech Payment Agent
    config1 = {
        "AGENT_NAME": "Real-Time Payment Processor",
        "ROLE_DESCRIPTION": "Verarbeitet Zahlungen in Echtzeit über verschiedene Payment-Gateways mit Fokus auf Sicherheit, Compliance und Verfügbarkeit.",
        **presets["fintech"],
        "COMMUNICATION_EXTRAS": "\n- Du kommunizierst Transaktionsstatus proaktiv und transparent",
        "THINKING_EXTRAS": "\n- Du priorisierst Transaktionssicherheit über Geschwindigkeit",
        "WORKING_EXTRAS": "\n- Du implementierst Retry-Logic und Idempotenz-Checks",
        "EXPERTISE_EXTRAS": "\n- Du beherrschst PCI-DSS Standards für Kartenzahlungen",
        "DOMAIN_SPECIFIC_SECTION": domains["fintech"],
        "TECH_STACK_SECTION": "",
        "COMPLIANCE_SECTION": compliance["financial"],
        "INTEGRATION_SECTION": ""
    }
    
    # Beispiel 2: AI Model Monitor
    config2 = {
        "AGENT_NAME": "Production AI Model Monitor",
        "ROLE_DESCRIPTION": "Überwacht AI-Modelle in Produktion auf Performance, Drift und Anomalien, triggert Re-Training bei Bedarf.",
        **presets["ai_native"],
        "COMMUNICATION_EXTRAS": "\n- Du alarmierst proaktiv bei Performance-Degradation",
        "THINKING_EXTRAS": "\n- Du unterscheidest zwischen Concept Drift und Data Drift",
        "WORKING_EXTRAS": "\n- Du trackst Metriken wie Accuracy, Latency, Throughput",
        "EXPERTISE_EXTRAS": "\n- Du kennst MLOps Best Practices und Model Governance",
        "DOMAIN_SPECIFIC_SECTION": domains["ai_native"],
        "TECH_STACK_SECTION": tech_stacks["ai_ml"],
        "COMPLIANCE_SECTION": "",
        "INTEGRATION_SECTION": """

INTEGRATION-PUNKTE:
- Monitoring: Prometheus, Grafana, DataDog
- Model Registry: MLflow, Weights & Biases
- Alerting: PagerDuty, Slack, E-Mail"""
    }
    
    # Beispiel 3: Hybrid DevSecOps Agent
    config3 = {
        "AGENT_NAME": "DevSecOps Pipeline Guardian",
        "ROLE_DESCRIPTION": "Integriert Security-Checks nahtlos in CI/CD-Pipelines und stellt sichere Deployments ohne Entwickler-Friction sicher.",
        **presets["hybrid"],
        "COMMUNICATION_EXTRAS": "\n- Du balancierst Security-Anforderungen mit Developer Experience",
        "THINKING_EXTRAS": "\n- Du denkst in Shift-Left-Security-Prinzipien",
        "WORKING_EXTRAS": "\n- Du automatisierst Security-Scans ohne Pipeline-Verlangsamung",
        "EXPERTISE_EXTRAS": "\n- Du beherrschst SAST, DAST, SCA und Container-Scanning",
        "DOMAIN_SPECIFIC_SECTION": domains["security"],
        "TECH_STACK_SECTION": tech_stacks["cloud_native"],
        "COMPLIANCE_SECTION": compliance["security_standards"],
        "INTEGRATION_SECTION": """

INTEGRATION-PUNKTE:
- CI/CD: GitHub Actions, GitLab CI, Jenkins
- Security Tools: Snyk, SonarQube, Trivy
- Secret Management: HashiCorp Vault, AWS Secrets Manager"""
    }
    
    examples.append(("FinTech Payment Processor", system.generate_prompt(config1)))
    examples.append(("AI Model Monitor", system.generate_prompt(config2)))
    examples.append(("DevSecOps Guardian", system.generate_prompt(config3)))
    
    return examples


if __name__ == "__main__":
    print("Valtheron Agent Template System")
    print("=" * 70)
    print("\nGeneriere Beispiel-Agenten mit Template-System...\n")
    
    examples = create_example_agents()
    
    # Speichere Beispiele
    output_file = "/home/ubuntu/agent_template_examples.md"
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("# Valtheron Agent Template System - Beispiele\n\n")
        f.write("Demonstriert die Verwendung des Template-basierten Generierungssystems.\n\n")
        f.write("---\n\n")
        
        for i, (name, prompt) in enumerate(examples, 1):
            f.write(f"## Beispiel {i}: {name}\n\n")
            f.write("```\n")
            f.write(prompt)
            f.write("```\n\n")
            f.write("---\n\n")
    
    print(f"✓ {len(examples)} Beispiel-Agenten generiert")
    print(f"✓ Gespeichert in: {output_file}")
    
    # Speichere auch die Template-Dokumentation
    doc_file = "/home/ubuntu/agent_template_documentation.md"
    
    system = AgentTemplateSystem()
    
    with open(doc_file, "w", encoding="utf-8") as f:
        f.write("# Valtheron Agent Template System - Dokumentation\n\n")
        f.write("## Übersicht\n\n")
        f.write("Das Template-System ermöglicht die dynamische Generierung von Agent-Prompts ")
        f.write("durch Verwendung von Variablen und vordefinierten Profilen.\n\n")
        
        f.write("## Template-Variablen\n\n")
        f.write("### Pflichtfelder\n\n")
        f.write("- `AGENT_NAME`: Name des Agenten\n")
        f.write("- `ROLE_DESCRIPTION`: Detaillierte Rollenbeschreibung\n")
        f.write("- `COMMUNICATION_STYLE`: Kommunikationsstil\n")
        f.write("- `THINKING_STYLE`: Denkweise\n")
        f.write("- `WORKING_STYLE`: Arbeitsweise\n")
        f.write("- `EXPERTISE_PROFILE`: Expertise-Profil\n\n")
        
        f.write("### Optionale Erweiterungen\n\n")
        f.write("- `COMMUNICATION_EXTRAS`: Zusätzliche Kommunikations-Aspekte\n")
        f.write("- `THINKING_EXTRAS`: Zusätzliche Denkweisen\n")
        f.write("- `WORKING_EXTRAS`: Zusätzliche Arbeitsweisen\n")
        f.write("- `EXPERTISE_EXTRAS`: Zusätzliche Expertise\n\n")
        
        f.write("### Sections\n\n")
        f.write("- `DOMAIN_SPECIFIC_SECTION`: Domänenspezifische Expertise\n")
        f.write("- `TECH_STACK_SECTION`: Technologie-Stack\n")
        f.write("- `COMPLIANCE_SECTION`: Compliance-Anforderungen\n")
        f.write("- `INTEGRATION_SECTION`: Integration-Punkte\n\n")
        
        f.write("## Vordefinierte Profile\n\n")
        presets = system.get_profile_presets()
        for profile_name, profile_data in presets.items():
            f.write(f"### {profile_name}\n\n")
            f.write("```python\n")
            f.write(json.dumps(profile_data, indent=2, ensure_ascii=False))
            f.write("\n```\n\n")
        
        f.write("## Verwendung\n\n")
        f.write("```python\n")
        f.write("from agent_template_system import AgentTemplateSystem\n\n")
        f.write("system = AgentTemplateSystem()\n")
        f.write("presets = system.get_profile_presets()\n\n")
        f.write("config = {\n")
        f.write('    "AGENT_NAME": "Mein Custom Agent",\n')
        f.write('    "ROLE_DESCRIPTION": "Beschreibung...",\n')
        f.write('    **presets["ai_native"],\n')
        f.write('    "DOMAIN_SPECIFIC_SECTION": "..."\n')
        f.write("}\n\n")
        f.write("prompt = system.generate_prompt(config)\n")
        f.write("```\n\n")
    
    print(f"✓ Template-Dokumentation erstellt: {doc_file}")
    print("\n" + "=" * 70)
