# Incident Response — Knowledge Base Summary

**Kategorie:** Defensive Security
**Subcategory:** Incident Response
**Dokumente:** 8
**Schwierigkeit:** Intermediate → Advanced
**Sprache:** EN

---

## Übersicht

Incident Response (IR) ist der strukturierte Prozess zur Reaktion auf Cybersecurity-Vorfälle — von der Erkennung über Eindämmung bis zur Wiederherstellung und Lessons Learned. Schnelle und methodische IR minimiert Schaden und Ausfallzeiten.

## IR-Lifecycle (PICERL)

```
P → I → C → E → R → L
Preparation → Identification → Containment → Eradication → Recovery → Lessons Learned
```

### Phase-Details

| Phase | Aktivitäten |
|-------|------------|
| **Preparation** | IR-Plan, Playbooks, Tools, Training, Kommunikationspläne |
| **Identification** | Alert-Analyse, Scope-Bestimmung, Eskalation |
| **Containment** | Isolierung betroffener Systeme (kurz- und langfristig) |
| **Eradication** | Malware-Entfernung, Patch-Anwendung, Account-Reset |
| **Recovery** | Systemwiederherstellung, Monitoring intensivieren |
| **Lessons Learned** | Post-Incident Review, Dokumentation, Prozessverbesserung |

## Digitale Forensik

### Beweissicherung (Chain of Custody)
1. **Isolierung** — System vom Netzwerk trennen (ohne Ausschalten)
2. **Imaging** — Forensische 1:1-Kopie (dd, FTK Imager)
3. **Hashing** — MD5/SHA256 zur Integritätsverifikation
4. **Dokumentation** — Zeitstempel, Beobachter, Handlungen

### Forensische Artefakte

**Windows:**
- Event Logs (`%SystemRoot%\System32\winevt\Logs\`)
- Prefetch-Dateien (Ausführungshistorie)
- Registry Hives (NTUSER.DAT, SYSTEM, SOFTWARE)
- $MFT (Master File Table, gelöschte Dateien)
- Shimcache / Amcache (Anwendungskompatibilität)

**Linux:**
- `/var/log/auth.log`, `/var/log/syslog`
- Bash History (`~/.bash_history`)
- Cron Jobs (`/etc/cron*`, `/var/spool/cron`)
- Proc Filesystem (`/proc/<pid>/`)

## Memory Forensics (Volatility)

```bash
# Prozessliste analysieren
vol.py -f memory.dump windows.pslist

# Netzwerkverbindungen
vol.py -f memory.dump windows.netstat

# Injizierten Code finden
vol.py -f memory.dump windows.malfind

# Extrahiertes DLL/Executable
vol.py -f memory.dump windows.dlllist --pid <PID>
```

## Ransomware Response

1. **Sofortmaßnahmen:** Netzwerksegmentierung, Backup-Verifikation
2. **Scope:** Ausmaß der Verschlüsselung bestimmen
3. **Strain-Identifikation:** ID Ransomware, Hybrid-Analysis
4. **Entscheidung:** Zahlen vs. Restore vs. Decryptor
5. **Recovery:** Saubere Wiederherstellung aus verifizierten Backups

## Verwandte Dokumente

- `defensive/incident-response/Incident Response Playbook - Complete.pdf`
- `defensive/incident-response/Memory Forensics with Volatility.pdf`
- `defensive/incident-response/Ransomware Incident Response Guide.pdf`
- `defensive/incident-response/Windows Forensics Investigation.pdf`
