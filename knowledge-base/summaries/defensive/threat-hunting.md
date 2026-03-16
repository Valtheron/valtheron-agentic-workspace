# Threat Hunting — Knowledge Base Summary

**Kategorie:** Defensive Security
**Subcategory:** Threat Hunting
**Dokumente:** 6
**Schwierigkeit:** Intermediate → Advanced
**Sprache:** EN

---

## Übersicht

Threat Hunting ist die proaktive Suche nach Bedrohungen, die vorhandene Sicherheitskontrollen umgangen haben. Im Gegensatz zu reaktiver IR basiert Threat Hunting auf Hypothesen und datengetriebener Analyse statt auf Alerts.

## Hunting-Methodiken

### Intelligence-Driven Hunting
- Ausgangspunkt: Threat Intelligence (IOCs, TTPs von bekannten APTs)
- MITRE ATT&CK: Welche Techniken nutzt Gruppe X? → Suche danach

### Hypothesis-Driven Hunting
- Ausgangspunkt: "Angreifer könnte Technik T verwenden"
- Ableitung von Hunting-Queries aus ATT&CK-Techniken

### Analytics-Driven Hunting
- Ausgangspunkt: Baseline normales Verhalten
- Anomalie-Detektion durch statistische Abweichungen

## MITRE ATT&CK für Threat Hunting

ATT&CK bietet strukturierte TTPs als Hunting-Grundlage:

```
Technik: T1059.001 - PowerShell
Hunt: Alle PowerShell-Prozesse mit Base64-Encoding oder DownloadString
Query (Splunk):
  index=wineventlog EventCode=4688 NewProcessName="*powershell.exe"
  CommandLine="*-enc*" OR CommandLine="*DownloadString*"
```

## Hunting-Datenquellen

| Quelle | Inhalte |
|--------|---------|
| **Sysmon** | Prozess-Erstellung, Netzwerkverbindungen, Registry |
| **Windows Event Logs** | Authentifizierung, Prozesse, Richtlinienänderungen |
| **EDR-Telemetrie** | Prozessbaumstamm, Memory-Operationen, Hashes |
| **Netzwerk-Flow** | Verbindungshistorie, Volumen-Anomalien |
| **DNS-Logs** | DGA-Domains, lange DNS-Queries (DNS Tunneling) |
| **Proxy-Logs** | HTTP-Muster, User-Agent-Anomalien, Exfiltration |

## YARA-Regeln

YARA ermöglicht Pattern-Matching gegen Dateien und Speicher:

```yara
rule Ransomware_Generic {
    meta:
        description = "Detects common ransomware patterns"
        author = "Valtheron"
    strings:
        $encrypt1 = "CryptEncrypt" ascii
        $ransom1 = "bitcoin" nocase
        $ransom2 = "YOUR FILES ARE ENCRYPTED" nocase
    condition:
        $encrypt1 and any of ($ransom*)
}
```

## Hunting-Werkzeuge

- **Velociraptor** — Endpoint Forensics und Hunting
- **HELK** — Hunting ELK Stack (Elasticsearch + Kibana + Hunt Tools)
- **OSQuery** — SQL-basierte Endpoint-Abfragen
- **Sigma** — SIEM-agnostische Erkennungsregeln
- **KQL (Sentinel)** — Kusto Query Language für Azure Sentinel

## Verwandte Dokumente

- `defensive/threat-hunting/Threat Hunting with MITRE ATT&CK.pdf`
- `defensive/threat-hunting/YARA Rules Writing and Threat Detection.pdf`
- `defensive/threat-hunting/Endpoint Detection and Response EDR.pdf`
