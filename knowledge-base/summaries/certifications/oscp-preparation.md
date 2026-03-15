# OSCP Preparation — Knowledge Base Summary

**Kategorie:** Certifications & Career
**Subcategory:** OSCP
**Dokumente:** 12 (inkl. CRTO, eLS)
**Schwierigkeit:** Advanced
**Sprachen:** EN, PT-BR

---

## Übersicht

OSCP (Offensive Security Certified Professional) ist die renommierteste praktische Pentesting-Zertifizierung. Der 24-Stunden-Prüfungsformat testet echte Exploitationsfähigkeiten ohne Multiple-Choice. Bestandteil des PWK-Kurses (Penetration Testing with Kali Linux).

## Prüfungsformat

- **Dauer:** 24 Stunden Hacking + 24 Stunden Report
- **Punkte zum Bestehen:** 70/100
- **Systeme:** Multiple standalone + Active Directory Set
- **Metasploit:** Nur einmal erlaubt (sorgfältig einsetzen)
- **Umgebung:** VPN-Zugang zu isoliertem Netzwerk

## Prüfungspunkte (aktuelles Format)

| Komponente | Punkte |
|-----------|--------|
| Active Directory Set (3 Maschinen) | 40 |
| Standalone Maschinen × 3 | 60 (20 je) |
| Bonus Points (Labs) | 10 |
| **Minimum zum Bestehen** | **70** |

## Kernfähigkeiten

### Buffer Overflow (32-bit Windows)
```
1. Fuzzing → Crash reproduzieren
2. EIP offset finden (pattern_create/offset)
3. Bad Characters identifizieren
4. Return Address (JMP ESP) finden
5. Shellcode generieren (msfvenom)
6. Exploit finalisieren
```

### Active Directory (PWK 2023+)
- **AS-REP Roasting** — GetNPUsers.py
- **Kerberoasting** — GetUserSPNs.py
- **Pass the Hash** — psexec.py, wmiexec.py
- **Mimikatz / secretsdump** — Credential Harvesting
- **BloodHound** — Angriffspfad visualisieren

### Enumeration-Checkliste
```bash
# Nmap
nmap -sC -sV -oA initial $IP
nmap -p- --min-rate 5000 -oA allports $IP

# Web
gobuster dir -u http://$IP -w /usr/share/wordlists/dirbuster/...
nikto -h http://$IP

# SMB
smbclient -L //$IP -N
enum4linux -a $IP

# SNMP
snmpwalk -c public -v1 $IP
```

## CRTO (Certified Red Team Operator)

Zero-Point Security Kurs (RTO):
- Cobalt Strike-fokussiert
- Active Directory Red Team Pfade
- AV/EDR Evasion praktisch
- Online-Labore (Dedicated Lab-Zugang)

## eLearnSecurity

| Zertifizierung | Level | Fokus |
|----------------|-------|-------|
| eJPT | Beginner | Pentesting Basics, Entry-Level |
| eCPPT | Intermediate | Advanced Web + Binary |
| eWPT | Intermediate | Web Application |
| eMAPT | Advanced | Mobile Pentesting |

## Lernressourcen (aus KB)

- TryHackMe — Learning Paths für OSCP-Vorbereitung
- HackTheBox — Maschinen ähnlich zum OSCP-Niveau
- PWK-Kurs-Labs — Offizielle Vorbereitung

## Verwandte Dokumente

- `certifications/oscp/OSCP Preparation Guide - Complete.pdf`
- `certifications/oscp/OSCP Buffer Overflow Methodology.pdf`
- `certifications/oscp/OSCP Active Directory Attack Path.pdf`
- `certifications/oscp/CRTO - Certified Red Team Operator Guide.pdf`
