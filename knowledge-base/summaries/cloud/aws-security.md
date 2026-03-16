# AWS Security — Knowledge Base Summary

**Kategorie:** Cloud & Container Security
**Subcategory:** AWS
**Dokumente:** 6
**Schwierigkeit:** Intermediate → Advanced
**Sprache:** EN

---

## Übersicht

Amazon Web Services (AWS) ist die führende Cloud-Plattform mit über 200 Services. AWS-Sicherheit umfasst Identity and Access Management, Netzwerksicherheit, Datenverschlüsselung, Monitoring und spezifische Angriffsvektoren in der Cloud.

## AWS-Sicherheitsmodell

### Shared Responsibility Model
- **AWS verantwortlich für:** Physische Infrastruktur, Hypervisor, Netzwerk
- **Kunde verantwortlich für:** OS, Applikationen, Daten, IAM, Konfiguration

## IAM (Identity & Access Management)

### Häufige Schwachstellen
- **Overprivileged Roles** — AdministratorAccess für Nicht-Admin
- **Long-lived Access Keys** — Kein Key Rotation
- **Missing MFA** — Root Account ohne MFA
- **Wildcard Permissions** — `"Action": "*"` oder `"Resource": "*"`

### Privilege Escalation in AWS
```
iam:CreateLoginProfile    → Neues Passwort für bestehenden User
iam:AttachUserPolicy      → Admin-Policy an eigenen User anhängen
iam:CreateAccessKey       → Neuen Access Key für anderen User
sts:AssumeRole            → Übernahme privilegierter Rollen
ec2:RunInstances + PassRole → EC2 mit IAM-Role starten
```

## Häufige Angriffsvektoren

| Dienst | Angriffsvektor |
|--------|---------------|
| **S3** | Public Buckets, ACL Misconfiguration, Bucket Takeover |
| **EC2** | IMDS v1 SSRF (169.254.169.254), SG Misconfiguration |
| **Lambda** | Environment Variable Exposure, Over-Permissions |
| **RDS** | Öffentlich zugängliche Datenbanken, Default Credentials |
| **ECS/EKS** | Container Escape, Pod Privilege |

## EC2 Metadata Service (IMDS)

SSRF-Angriffe gegen den Metadata-Endpunkt:
```
http://169.254.169.254/latest/meta-data/iam/security-credentials/
```
**Abhilfe:** IMDSv2 erzwingen (Session-Token erforderlich)

## CloudGoat (Vulnerable Lab)

Rhino Security Labs' intentionally vulnerable AWS environment für praktisches Lernen:
- `iam_privesc_by_rollback` — IAM Privilege Escalation
- `cloud_breach_s3` — S3 Bucket Breach
- `ecs_efs_attack` — Container zu EFS-Zugriff

## Monitoring & Detection

- **CloudTrail** — API-Call-Logging (Pflicht für Security)
- **CloudWatch** — Metriken, Logs, Alarme
- **AWS Security Hub** — Zentrale Sicherheitsbefunde
- **GuardDuty** — ML-basierte Threat Detection
- **AWS Config** — Compliance- und Konfigurationsmonitoring

## Verwandte Dokumente

- `cloud/aws/AWS Penetration Testing Guide.pdf`
- `cloud/aws/AWS IAM Security Best Practices.pdf`
- `cloud/aws/CloudGoat AWS Vulnerable Lab Guide.pdf`
