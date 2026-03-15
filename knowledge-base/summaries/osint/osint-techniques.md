# OSINT Techniques — Knowledge Base Summary

**Kategorie:** OSINT
**Subcategory:** Techniques
**Dokumente:** 15
**Schwierigkeit:** Beginner → Intermediate
**Sprache:** EN

---

## Übersicht

Open Source Intelligence (OSINT) ist die systematische Beschaffung und Analyse von Informationen aus öffentlich zugänglichen Quellen. Anwendungsgebiete: Penetration Testing Reconnaissance, Fraud Investigation, Competitive Intelligence, Threat Actor Profiling.

## OSINT-Zyklus

```
Requirement → Collection → Processing → Analysis → Dissemination
```

1. **Requirement** — Was soll herausgefunden werden?
2. **Collection** — Passive/aktive Datensammlung
3. **Processing** — Strukturierung, Filterung
4. **Analysis** — Korrelation, Schlussfolgerung
5. **Dissemination** — Report, Visualisierung

## Quellkategorien

### Menschen / Personen
- **Social Media** — LinkedIn, Twitter/X, Facebook, Instagram
- **Breach Databases** — HaveIBeenPwned, DeHashed
- **Public Records** — Handelsregister, Grundbuch, Gerichtsurteile
- **Photo EXIF** — GPS-Koordinaten in Bildern

### Technische Infrastruktur
- **Shodan** — Geräte, offene Ports, Banner (`ssl.cert.subject.CN:target.com`)
- **Censys** — Zertifikate, ASN, IP-Ranges
- **WHOIS** — Domain-Registrierung (historisch: viewdns.info)
- **Certificate Transparency** — crt.sh für Subdomain-Enumeration
- **DNS History** — SecurityTrails, DNSDB

### Organisationen
- **LinkedIn** — Mitarbeiterstruktur, Technologien
- **GitHub** — Leaked Credentials, interne Tools
- **Job Postings** — Technologie-Stack aus Stellenanzeigen ableiten
- **Wayback Machine** — Historische Webseiten-Snapshots

## Google Dorking

```
site:target.com filetype:pdf
site:target.com inurl:admin
"@target.com" "password" filetype:xls
intext:"Index of /" site:target.com
intitle:"Apache Status" site:target.com
```

## Maltego

Visuelles Analyse-Tool für Verbindungsmapping:
- **Entities** — Person, Email, Domain, IP, Organisation
- **Transforms** — Automatische Datenabfragen (Shodan, VirusTotal, etc.)
- **Graphs** — Netzwerk von Beziehungen visualisieren

## Dark Web OSINT

- **Tor Browser** — .onion-Zugang
- **Ahmia / DuckDuckGo onion** — Dark Web Suchmaschinen
- **Paste Sites** — Pastebin, ZeroX für Leaks
- **Darkus / Recon-ng Dark** — Automatisierte Dark Web Suche

**Wichtig:** Nur passive Beobachtung, keine Interaktion mit illegalen Inhalten.

## Geolokation & Bildanalyse

- **EXIF-Daten** — GPS in Fotos (exiftool)
- **Google Maps Street View** — Umgebungsmatch
- **Reverse Image Search** — Google Lens, TinEye, Yandex
- **Shadow Analysis** — Tageszeit aus Schattenwinkel ableiten
- **Vegetation/Architektur** — Regionale Identifikation

## Automatisierung

```python
# theHarvester
theHarvester -d target.com -b all -l 500

# SpiderFoot
spiderfoot -s target.com -m sfp_shodan,sfp_linkedin

# Recon-ng
recon-ng
> marketplace install all
> modules load recon/domains-hosts/brute_hosts
```

## Ethik & Legalität

- Nur öffentlich zugängliche Informationen
- Keine Authentifizierung umgehen
- DSGVO bei personenbezogenen EU-Daten beachten
- US CFAA: Computer-Zugriff nur mit Erlaubnis
- Ergebnisse vertraulich behandeln

## Verwandte Dokumente

- `osint/techniques/OSINT Fundamentals and Methodology.pdf`
- `osint/techniques/Maltego for OSINT Investigations.pdf`
- `osint/techniques/Google Dorking and Advanced Search.pdf`
- `osint/techniques/Dark Web OSINT Investigation.pdf`
