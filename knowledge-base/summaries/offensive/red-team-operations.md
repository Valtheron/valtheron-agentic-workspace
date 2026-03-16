# Red Team Operations — Knowledge Base Summary

**Kategorie:** Offensive Security
**Subcategory:** Red Team
**Dokumente:** 18
**Schwierigkeit:** Intermediate → Advanced
**Sprache:** EN

---

## Übersicht

Red Team Operations simulieren realistische, zielgerichtete Angriffe (APT-Emulation) gegen Organisationen, um die Effektivität von Verteidigungsmaßnahmen zu testen. Im Gegensatz zu Penetrationstests ist das Ziel nicht die Enumeration aller Schwachstellen, sondern das Erreichen definierter Objectives (z. B. Datenzugriff, Domänen-Kompromittierung) bei maximaler Stealth.

## Kernkonzepte

### Red Team vs. Pentest
| Aspekt | Pentest | Red Team |
|--------|---------|----------|
| Ziel | Schwachstellen finden | Objectives erreichen |
| Scope | Vollständig | Begrenzt (Objectives) |
| Dauer | Tage–Wochen | Wochen–Monate |
| Detection-Fokus | Nicht primär | Kritisch (Stealth) |
| Report | Vulnerability-Liste | Narrative + ATT&CK |

### Red Team Phasen
1. **Planning** — Rules of Engagement, Objectives, Threat Profile
2. **Reconnaissance** — OSINT, Infrastructure Mapping, Target Profiling
3. **Initial Access** — Phishing, Exploits, Physical Access
4. **Persistence** — Backdoors, Scheduled Tasks, Registry Keys
5. **Lateral Movement** — Pass-the-Hash, Kerberoasting, RDP
6. **Objective Completion** — Data Exfiltration, Domain Takeover
7. **Reporting** — ATT&CK Mapping, Detektionslücken, Empfehlungen

## Schlüsseltechnologien

| Tool | Zweck |
|------|-------|
| **Cobalt Strike** | Full-featured C2 Framework |
| **Metasploit** | Exploitation + Meterpreter C2 |
| **CALDERA** | MITRE ATT&CK basiertes Emulations-Framework |
| **Atomic Red Team** | Unit Tests für ATT&CK Techniken |
| **Havoc / Sliver** | Open-Source C2 Alternativen |
| **PowerShell Empire** | Post-Exploitation Framework |
| **BloodHound** | AD Attack Path Analyse |

## AV/EDR Evasion Techniken

- **AMSI Bypass** — Deaktivierung des Antimalware Scan Interface
- **LOLBins** — Living off the Land Binaries (certutil, mshta, regsvr32)
- **Shellcode Obfuscation** — XOR, AES-Verschlüsselung, Custom Loaders
- **Process Injection** — DLL Injection, Process Hollowing, Thread Hijacking
- **Fileless Execution** — Memory-only Payloads ohne Festplatten-Schreibzugriff

## Command & Control (C2)

- **C2 Profiles** — Malleable C2 für Traffic-Camouflage
- **Redirectors** — Apache/Nginx als Front-End für C2-Server
- **Domain Fronting** — Nutzung legitimer CDN-Domains
- **HTTPS C2** — TLS-verschlüsselte Kommunikation

## Social Engineering

- **Spear Phishing** — Zielgerichtete E-Mail-Angriffe mit OSINT
- **Pretexting** — Erstellung glaubwürdiger Szenarien
- **Vishing** — Voice Phishing (Telefon)
- **Smishing** — SMS-basiertes Phishing

## MITRE ATT&CK Mapping

Alle Red Team Aktivitäten werden auf MITRE ATT&CK Enterprise Matrix gemappt:
- **TA0001–TA0011** vollständig abgedeckt
- Wichtige Techniken: T1566 (Phishing), T1055 (Process Injection), T1003 (OS Credential Dumping)

## Verwandte Dokumente

- `offensive/red-team/Red Team Operations - Complete Handbook.pdf`
- `offensive/red-team/Cobalt Strike - Threat Emulation Guide.pdf`
- `offensive/red-team/MITRE ATT&CK Red Team Mapping.pdf`
- `offensive/red-team/AV and EDR Bypass Techniques.pdf`
