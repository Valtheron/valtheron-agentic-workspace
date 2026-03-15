# Penetration Testing — Knowledge Base Summary

**Kategorie:** Offensive Security
**Subcategory:** Penetration Testing
**Dokumente:** 30
**Schwierigkeit:** Beginner → Advanced
**Sprache:** EN

---

## Übersicht

Penetration Testing (Pentest) ist die autorisierte, simulierte Durchführung von Cyberangriffen gegen Systeme, Netzwerke oder Anwendungen, um Schwachstellen vor echten Angreifern zu identifizieren. Diese Kategorie umfasst Methodik, Tools und domänenspezifische Techniken für Web, Cloud, Mobile, IoT/OT und Netzwerkinfrastruktur.

## Kernkonzepte

### Pentest-Phasen (Universelle Methodik)
1. **Reconnaissance** — Passive und aktive Informationsbeschaffung (OSINT, DNS, Port-Scanning)
2. **Scanning & Enumeration** — Dienste, Versionen, Benutzer, Shares identifizieren
3. **Exploitation** — Ausnutzung identifizierter Schwachstellen
4. **Post-Exploitation** — Privilege Escalation, Lateral Movement, Persistence
5. **Reporting** — Dokumentation von Findings, Risikobewertung, Empfehlungen

### Pentest-Typen
- **Black Box** — Kein Vorwissen; simuliert externen Angreifer
- **White Box** — Vollständiger Zugang zu Quellcode/Dokumentation
- **Grey Box** — Teilweise Informationen (typisch in Unternehmenstests)

## Schlüsseltechnologien & Tools

| Tool | Zweck |
|------|-------|
| **Nmap** | Port-Scanning, Service-Enumeration |
| **Metasploit Framework** | Exploitation, Post-Exploitation |
| **Burp Suite Professional** | Web Application Interception Proxy |
| **Nikto** | Web Server Vulnerability Scanner |
| **SQLMap** | Automatisierte SQL Injection |
| **Hydra / Medusa** | Brute-Force Authentication |
| **Gobuster / ffuf** | Directory und Subdomain Fuzzing |
| **BloodHound** | Active Directory Attack Path Mapping |
| **Impacket** | Windows/AD Protocol Exploitation |

## Web Application Pentesting

Schwerpunkte auf OWASP Top 10:
- **A01 Broken Access Control** — IDOR, BOLA, Privilege Escalation
- **A02 Cryptographic Failures** — Unsichere Übertragung, schwache Verschlüsselung
- **A03 Injection** — SQL, Command, LDAP, XML Injection
- **A04 Insecure Design** — Fehlende Sicherheitskontrollen auf Architekturebene
- **A05 Security Misconfiguration** — Default Credentials, offene Ports, Directories
- **A07 XSS** — Reflected, Stored, DOM-based Cross-Site Scripting
- **A08 Software Integrity Failures** — Unsichere Deserialisierung
- **A09 Security Logging Failures** — Fehlende Audit-Trails
- **A10 SSRF** — Server-Side Request Forgery zu internen Diensten

## Cloud Pentesting

- **AWS:** IAM Privilege Escalation, S3 Bucket Enumeration, EC2 Metadata Service
- **Azure:** Azure AD Misconfiguration, AKS Security, Managed Identity Abuse
- **GCP:** GKE Exploitation, Service Account Token Theft

## Bug Bounty Hunting

- **Recon-Phase:** Subdomain Enumeration, JS-File-Analysis, Parameter Discovery
- **Plattformen:** HackerOne, Bugcrowd, Intigriti, YesWeHack
- **Häufige Findings:** XSS, IDOR, SSRF, Information Disclosure, Auth Bypass

## OSCP-Relevanz

OSCP (Offensive Security Certified Professional) testet praktische Pentest-Fähigkeiten in einer isolierten Lab-Umgebung. Relevante Techniken:
- Buffer Overflow (Windows/Linux)
- Active Directory Exploitation
- Web Application Attacks
- Manual Exploitation ohne Metasploit

## Verwandte Dokumente (Direkte Links)

- `offensive/penetration-testing/Penetration Testing Web Application - Complete Guide.pdf`
- `offensive/penetration-testing/OWASP Testing Guide v4.2.pdf`
- `offensive/penetration-testing/Active Directory Penetration Testing.pdf`
- `offensive/penetration-testing/Burp Suite Professional - Complete Reference.pdf`
- `certifications/oscp/OSCP Preparation Guide - Complete.pdf`
