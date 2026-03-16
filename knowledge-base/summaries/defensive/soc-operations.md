# SOC Operations — Knowledge Base Summary

**Kategorie:** Defensive Security
**Subcategory:** SOC
**Dokumente:** 10
**Schwierigkeit:** Beginner → Intermediate
**Sprache:** EN

---

## Übersicht

Ein Security Operations Center (SOC) ist die zentrale Einheit für Sicherheitsüberwachung, Erkennung und Reaktion auf Sicherheitsvorfälle. SOC-Analysten überwachen rund um die Uhr Sicherheitsereignisse und koordinieren Incident Response.

## SOC-Tier-Struktur

| Tier | Rolle | Aufgaben |
|------|-------|---------|
| **Tier 1** | Alert Analyst | Triage, erste Einschätzung, Eskalation |
| **Tier 2** | Incident Responder | Tiefere Analyse, Containment |
| **Tier 3** | Threat Hunter / Expert | Proaktive Jagd, forensische Analyse |
| **Tier 4** | SOC Manager | Strategie, Reporting, KPIs |

## SIEM (Security Information & Event Management)

### Log-Quellen (Typisch)
- Endpoint-Logs (Windows Event Logs, Sysmon)
- Netzwerk-Logs (Firewall, IDS/IPS, Proxy)
- Authentifizierungs-Logs (Active Directory, VPN)
- Cloud-Logs (CloudTrail, Azure Monitor, GCP Logging)
- Application-Logs (Web Server, Datenbank)

### Wichtige SIEM-Plattformen
| SIEM | Hersteller | Besonderheiten |
|------|-----------|----------------|
| **Splunk** | Splunk Inc. | Marktführer, mächtige SPL-Abfragen |
| **Microsoft Sentinel** | Microsoft | Azure-native, KI-Integration |
| **Elastic SIEM** | Elastic | Open-Source Basis, Kibana UI |
| **QRadar** | IBM | Enterprise, UBA-Integration |
| **Wazuh** | Open Source | Free, SIEM + HIDS |

## Alert-Triage-Workflow

```
Alert → Classify (TP/FP/Benign) → Investigate → Escalate/Close
```

**Alert-Klassifizierung:**
- **True Positive (TP)** — Echter Angriff erkannt
- **False Positive (FP)** — Legitime Aktivität fälschlicherweise als Angriff gewertet
- **Benign True Positive** — Bekannte, akzeptierte Aktivität

## SOC-Metriken (KPIs)

- **MTTD** — Mean Time to Detect
- **MTTR** — Mean Time to Respond
- **Alert Volume** — Alerts pro Schicht
- **FP-Rate** — False Positive Rate (Ziel: < 5%)
- **SLA Compliance** — Ticket-Bearbeitungszeiten eingehalten

## SOAR (Security Orchestration, Automation, Response)

Automatisierung repetitiver SOC-Aufgaben:
- **Playbooks** — Automatisierte Reaktion auf häufige Alerts
- **Enrichment** — Automatisches Abfragen von Threat-Intel-Feeds
- **Ticket-Integration** — Automatische Ticket-Erstellung in ServiceNow/Jira
- **Plattformen:** Splunk SOAR, Microsoft Sentinel, Palo Alto XSOAR

## Verwandte Dokumente

- `defensive/soc/SOC Analyst Career Guide - Junior.pdf`
- `defensive/soc/Splunk for Security Operations.pdf`
- `defensive/soc/Microsoft Sentinel SIEM Guide.pdf`
- `defensive/soc/SOC Automation with SOAR.pdf`
