# Valtheron Cybersec Knowledge Base

![Documents](https://img.shields.io/badge/Documents-218-blue)
![Categories](https://img.shields.io/badge/Categories-9-green)
![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20PT--BR-orange)
![Format](https://img.shields.io/badge/Format-PDF%20%7C%20PPTX%20%7C%20MD-lightgrey)

Kuratierte Sammlung von 218 Cybersecurity-Dokumenten, strukturiert nach Domain, Schwierigkeitsgrad und Sprache. Optimiert für manuelle Navigation und maschinelle Indizierung (RAG/Vektorsuche).

---

## Quick Navigation

| Domain | Docs | Schwierigkeit |
|--------|------|---------------|
| [Offensive Security](#offensive-security) | 73 | Beginner → Advanced |
| [Defensive Security](#defensive-security) | 32 | Beginner → Advanced |
| [Cloud & Container Security](#cloud--container-security) | 18 | Intermediate → Advanced |
| [Application Security](#application-security) | 22 | Beginner → Advanced |
| [OSINT](#osint) | 15 | Beginner → Intermediate |
| [IoT / OT Security](#iot--ot-security) | 10 | Intermediate → Advanced |
| [Certifications & Career](#certifications--career) | 32 | Beginner → Advanced |
| [Education & Awareness](#education--awareness) | 12 | Beginner |
| [Miscellaneous](#miscellaneous) | 4 | Mixed |

---

## Kategorien-Übersicht

### Offensive Security

Offensive Sicherheitstechniken, Penetrationstests und Red Team Operationen.

**73 Dokumente** · [Verzeichnis anzeigen](offensive/)

| Subcategory | Docs | Beschreibung |
|-------------|------|-------------|
| [Penetration Testing](offensive/penetration-testing/) | 30 | Web, Cloud, Mobile, IoT/OT, Netzwerk |
| [Red Team Operations](offensive/red-team/) | 18 | Adversary Emulation, AV/EDR Bypass, C2 |
| [Exploit Development](offensive/exploit-development/) | 15 | Buffer Overflow, Shellcode, ROP Chains |
| [Post-Exploitation](offensive/post-exploitation/) | 10 | Privilege Escalation, Lateral Movement, Persistence |

**Markdown Summaries:** [summaries/offensive/](summaries/offensive/)

---

### Defensive Security

Blue Team Operationen, SOC, Incident Response und Malware-Analyse.

**32 Dokumente** · [Verzeichnis anzeigen](defensive/)

| Subcategory | Docs | Beschreibung |
|-------------|------|-------------|
| [SOC Operations](defensive/soc/) | 10 | Security Operations, SIEM, Alerting |
| [Incident Response](defensive/incident-response/) | 8 | IR Playbooks, Containment, Recovery |
| [Malware Analysis](defensive/malware-analysis/) | 8 | Static/Dynamic Analysis, Reverse Engineering |
| [Threat Hunting](defensive/threat-hunting/) | 6 | MITRE ATT&CK, Hunting Workflows, Threat Intel |

**Markdown Summaries:** [summaries/defensive/](summaries/defensive/)

---

### Cloud & Container Security

Sicherheit in AWS, Azure, GCP, Kubernetes und Docker-Umgebungen.

**18 Dokumente** · [Verzeichnis anzeigen](cloud/)

| Subcategory | Docs | Beschreibung |
|-------------|------|-------------|
| [AWS Security](cloud/aws/) | 6 | IAM, S3, EC2, Cloud Pentesting |
| [Azure Security](cloud/azure/) | 4 | AD, AKS, Sentinel |
| [GCP Security](cloud/gcp/) | 3 | GKE, Cloud Attacks |
| [Containers](cloud/containers/) | 5 | Docker, Kubernetes, Escape Techniques |

**Markdown Summaries:** [summaries/cloud/](summaries/cloud/)

---

### Application Security

Web- und Mobile-Anwendungssicherheit, OWASP, Bug Bounty.

**22 Dokumente** · [Verzeichnis anzeigen](appsec/)

| Subcategory | Docs | Beschreibung |
|-------------|------|-------------|
| [Web Application Security](appsec/web/) | 16 | OWASP Top 10, XSS, SQLi, SSRF, Bug Bounty |
| [Mobile Security](appsec/mobile/) | 6 | Android/iOS Pentesting, OWASP Mobile |

**Markdown Summaries:** [summaries/appsec/](summaries/appsec/)

---

### OSINT

Open Source Intelligence — Techniken zur Informationsbeschaffung aus öffentlichen Quellen.

**15 Dokumente** · [Verzeichnis anzeigen](osint/)

| Subcategory | Docs | Beschreibung |
|-------------|------|-------------|
| [OSINT Techniques](osint/techniques/) | 15 | Recon, Social Media, Dark Web, Tools |

**Markdown Summaries:** [summaries/osint/](summaries/osint/)

---

### IoT / OT Security

Sicherheit von Embedded Systems, industriellen Steuerungssystemen und vernetzten Geräten.

**10 Dokumente** · [Verzeichnis anzeigen](iot-ot/)

| Subcategory | Docs | Beschreibung |
|-------------|------|-------------|
| [Industrial / OT](iot-ot/industrial/) | 10 | ICS/SCADA, Hardware Hacking, Firmware Analysis |

**Markdown Summaries:** [summaries/iot-ot/](summaries/iot-ot/)

---

### Certifications & Career

Zertifizierungsvorbereitungen und Karriereleitfäden.

**32 Dokumente** · [Verzeichnis anzeigen](certifications/)

| Subcategory | Docs | Beschreibung |
|-------------|------|-------------|
| [OSCP](certifications/oscp/) | 12 | Offensive Security Certified Professional |
| [CEH](certifications/ceh/) | 8 | Certified Ethical Hacker |
| [CompTIA](certifications/comptia/) | 12 | Security+, CySA+, CASP+ |

**Markdown Summaries:** [summaries/certifications/](summaries/certifications/)

---

### Education & Awareness

Cybersecurity-Sensibilisierungsmaterial für verschiedene Zielgruppen.

**12 Dokumente** · [Verzeichnis anzeigen](education/)

| Subcategory | Docs | Beschreibung |
|-------------|------|-------------|
| [Awareness](education/awareness/) | 12 | Kinder, Schüler, Eltern, allgemeine Bevölkerung |

**Markdown Summaries:** [summaries/education/](summaries/education/)

---

### Miscellaneous

Themendokumente, die mehrere Kategorien überqueren.

**4 Dokumente**

Enthält: ChatGPT in Cybersecurity, Metaverse Security, Zero Trust Architecture.

---

## Metadaten & Suche

### Maschinelles Format

- **[manifest.json](manifest.json)** — JSON-Index aller 218 Dokumente mit vollständigen Metadaten (Kategorie, Schwierigkeit, Sprache, Tags)
- **[index.yaml](index.yaml)** — YAML-Variante für konfigurationsbasierte Workflows
- **[summaries/](summaries/)** — Markdown-Zusammenfassungen pro Kategorie, optimiert für RAG/Vektorsuche

### Schwierigkeitsgrade

| Level | Kriterium |
|-------|-----------|
| `beginner` | Fundamentals, Junior, Introduction, Awareness |
| `intermediate` | Professional, praktische Labs ohne Vorkenntnisse |
| `advanced` | OSCP, CRTO, Specialist, Expert, Exploit Dev |

### Sprachen

| Code | Sprache |
|------|---------|
| `en` | English |
| `pt-br` | Português (Brasil) |

---

## Contribution Guidelines

Neue Dokumente hinzufügen → [CONTRIBUTING.md](CONTRIBUTING.md)

---

*Letzte Aktualisierung: 2026-03-15 · 218 Dokumente · 9 Kategorien*
