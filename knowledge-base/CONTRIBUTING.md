# Contributing to the Valtheron Cybersec Knowledge Base

## Neue Dokumente hinzufügen

### 1. Datei ablegen

Lege das Dokument in das korrekte Kategorieverzeichnis:

```
offensive/penetration-testing/    → Pentesting-Guides
offensive/red-team/               → Red Team Operationen
offensive/exploit-development/    → Exploit Dev, Buffer Overflow
offensive/post-exploitation/      → Priv Esc, Lateral Movement
defensive/soc/                    → SOC Operations
defensive/incident-response/      → IR Playbooks
defensive/malware-analysis/       → Malware Analysis
defensive/threat-hunting/         → Threat Hunting, YARA
cloud/aws/                        → AWS Security
cloud/azure/                      → Azure Security
cloud/gcp/                        → GCP Security
cloud/containers/                 → Docker, Kubernetes
appsec/web/                       → Web AppSec, OWASP
appsec/mobile/                    → Mobile AppSec
osint/techniques/                 → OSINT Methodik
iot-ot/industrial/                → IoT, ICS/SCADA
certifications/oscp/              → OSCP, CRTO, eLS
certifications/ceh/               → CEH
certifications/comptia/           → Security+, CySA+, CASP+
education/awareness/              → Awareness-Material
```

### 2. manifest.json aktualisieren

Füge einen neuen Eintrag in `manifest.json` unter `documents` hinzu:

```json
{
  "id": "doc-219",
  "filename": "Dein Dokument Titel.pdf",
  "path": "offensive/penetration-testing/",
  "title": "Dein Dokument Titel",
  "category": "offensive",
  "subcategory": "penetration-testing",
  "difficulty": "intermediate",
  "language": "en",
  "format": "pdf",
  "tags": ["pentesting", "web", "owasp"],
  "summary_path": "summaries/offensive/penetration-testing.md"
}
```

**ID-Schema:** `doc-XXX` (fortlaufend, dreistellig mit führenden Nullen bis 999, dann vierstellig)

### 3. index.yaml aktualisieren

Füge das Dokument in `index.yaml` unter dem entsprechenden Kategorieeintrag hinzu und aktualisiere `document_count` und `total_documents`.

### 4. Schwierigkeitsgrad bestimmen

| Level | Wann verwenden |
|-------|----------------|
| `beginner` | Junior, Beginner, Fundamentals, Introduction, Awareness, Kids |
| `intermediate` | Professional, praktische Labs ohne explizites Level |
| `advanced` | Advanced, Expert, Specialist, OSCP, CRTO, Exploit, Bypass, Shellcode |

### 5. Sprache angeben

| Code | Wann verwenden |
|------|----------------|
| `en` | Englischsprachige Dokumente (Standard) |
| `pt-br` | Portugiesische Dokumente (brasilianisches PT) |

### 6. Tags vergeben

Vergib 2–6 aussagekräftige Tags aus dieser empfohlenen Liste:

**Techniken:** `pentesting`, `red-team`, `exploit-dev`, `post-exploitation`, `osint`, `malware-analysis`, `forensics`, `threat-hunting`, `incident-response`

**Technologien:** `web`, `mobile`, `cloud`, `aws`, `azure`, `gcp`, `kubernetes`, `docker`, `active-directory`, `windows`, `linux`, `iot`, `scada`

**Werkzeuge:** `metasploit`, `burp-suite`, `cobalt-strike`, `nmap`, `wireshark`, `volatility`, `ghidra`, `ida-pro`, `maltego`, `shodan`

**Schwierigkeit/Typ:** `beginner`, `intermediate`, `advanced`, `certification`, `lab`, `ctf`, `awareness`

**Standards:** `owasp`, `mitre-attack`, `nist`, `pci-dss`, `gdpr`

---

## Dateibenennungskonventionen

- Beschreibender Titel in englischer Sprache
- Leerzeichen erlaubt (keine Unterstriche oder Bindestriche erzwingen)
- Großschreibung: Titel Case bevorzugt
- Sprache am Ende für nicht-englische Dokumente: `...Guide PT-BR.pdf`
- Format: `pdf`, `pptx`, `md`

**Gut:**
```
Penetration Testing Web Application - Advanced.pdf
SOC Analyst Career Guide - Junior.pdf
Guia de Segurança Digital PT-BR.pdf
```

**Vermeiden:**
```
pentest_guide_v2_final_FINAL.pdf
doc123.pdf
Untitled.pdf
```

---

## Pull Request Checkliste

- [ ] Dokument liegt im richtigen Unterverzeichnis
- [ ] Eintrag in `manifest.json` mit korrekten Metadaten
- [ ] `document_count` der Kategorie in `manifest.json` aktualisiert
- [ ] `total_documents` in `manifest.json` aktualisiert
- [ ] Eintrag in `index.yaml` aktualisiert
- [ ] Kein Duplikat vorhanden (Dateiname prüfen)
- [ ] Keine proprietären oder urheberrechtlich geschützten Inhalte

---

## Fragen?

Öffne ein Issue im Repository oder kontaktiere das Valtheron-Team.
