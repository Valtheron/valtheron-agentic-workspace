# Web Application Security — Knowledge Base Summary

**Kategorie:** Application Security
**Subcategory:** Web
**Dokumente:** 16
**Schwierigkeit:** Beginner → Advanced
**Sprache:** EN

---

## Übersicht

Web Application Security umfasst das Testen, Absichern und Auditieren von Webanwendungen gegen OWASP Top 10, API-Schwachstellen, Business-Logic-Fehler und Smart Contracts.

## OWASP Top 10 (2021)

| # | Kategorie | Beispiele |
|---|-----------|-----------|
| A01 | Broken Access Control | IDOR, BOLA, Directory Traversal |
| A02 | Cryptographic Failures | Klartextspeicherung, schwache Algo |
| A03 | Injection | SQLi, Command Injection, LDAP |
| A04 | Insecure Design | Missing Rate Limiting, Business Logic |
| A05 | Security Misconfiguration | Default Creds, CORS, Error Pages |
| A06 | Vulnerable Components | Outdated Libraries, Known CVEs |
| A07 | Authentication Failures | Brute Force, Session Fixation |
| A08 | Software Integrity Failures | Insecure Deserialization, CI/CD |
| A09 | Security Logging Failures | Keine Audit Logs, Log Injection |
| A10 | SSRF | Interne Service Discovery |

## SQL Injection

```sql
-- Classic In-Band
' OR '1'='1
' UNION SELECT username,password FROM users--

-- Blind Boolean-based
' AND SUBSTRING(username,1,1)='a'--

-- Time-based Blind
'; WAITFOR DELAY '0:0:5'--   (MSSQL)
'; SELECT SLEEP(5)--          (MySQL)
```

**Tools:** SQLMap, manual testing

## Cross-Site Scripting (XSS)

- **Reflected XSS** — Input direkt in Response ohne Sanitization
- **Stored XSS** — Persistenter Payload in Datenbank
- **DOM-based XSS** — Client-seitige JavaScript-Schwachstelle

## Server-Side Request Forgery (SSRF)

Angreifer zwingt Server zu Anfragen gegen interne Dienste:
```
http://target.com/fetch?url=http://169.254.169.254/latest/meta-data/
http://target.com/fetch?url=http://internal-service:8080/admin
```

## API Security

- **BOLA (IDOR)** — Broken Object Level Authorization
- **BFLA** — Broken Function Level Authorization
- **Mass Assignment** — Unintended Parameter-Akzeptanz
- **Excessive Data Exposure** — Zu viele Felder in Response
- **Rate Limiting** — Kein Schutz gegen Brute Force

## JWT (JSON Web Tokens)

Häufige Angriffe:
```
alg: none        → Signatur-Bypass
RS256 → HS256    → Key Confusion mit Public Key
jwk header       → Eigenen Key einspeisen
kid Injection    → SQL/Command Injection im kid-Parameter
```

## Smart Contract Security

- **Reentrancy** — Rekursiver ETH-Withdraw (DAO-Hack)
- **Integer Overflow** — Solidity < 0.8 ohne SafeMath
- **Access Control** — Fehlende `onlyOwner` Checks
- **Frontrunning** — Mempool-Manipulation
- **Audit-Tools:** Slither, MythX, Echidna

## Bug Bounty Methodik

1. **Recon:** Subdomains, JS-Dateien, Parameter-Discovery
2. **Mapping:** Alle Endpunkte, Auth-Flows, API-Routen
3. **Testing:** OWASP Checks, Business-Logic-Tests
4. **PoC:** Harmloser, klarer Reproduktionsschritt
5. **Report:** Impact, Severity, CVSS Score

## Verwandte Dokumente

- `appsec/web/OWASP Top 10 - Complete Reference.pdf`
- `appsec/web/Smart Contract Security Audit Guide.pdf`
- `appsec/web/JWT Security - Attacks and Defenses.pdf`
- `appsec/web/Bug Bounty Hunting Methodology.pdf`
