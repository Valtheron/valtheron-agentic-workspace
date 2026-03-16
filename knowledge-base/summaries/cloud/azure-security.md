# Azure Security — Knowledge Base Summary

**Kategorie:** Cloud & Container Security
**Subcategory:** Azure
**Dokumente:** 4
**Schwierigkeit:** Intermediate → Advanced
**Sprache:** EN

---

## Übersicht

Microsoft Azure ist die Cloud-Plattform mit besonders starker Integration in Windows/Active Directory-Umgebungen. Azure Active Directory (Entra ID) ist das zentrale Identity-System und ein häufiges Angriffsziel.

## Azure Active Directory (Entra ID)

### Angriffsvektoren
- **Password Spray** — Brute Force gegen viele Accounts mit wenigen Passwörtern
- **Consent Grant** — Böswillige OAuth-App mit zu vielen Berechtigungen
- **Pass-the-PRT** — Primary Refresh Token Diebstahl für SSO-Missbrauch
- **AADInternals** — PowerShell-Modul für Azure AD Angriffe
- **Illicit Consent Grant** — OAuth App-Angriff auf Tenant

### Privilegierte Rollen
- **Global Administrator** — Vollzugriff auf Tenant
- **Privileged Role Administrator** — Rollenzuweisung
- **Application Administrator** — App-Registrierungen

## Azure Resource Manager (ARM)

- **Managed Identity Abuse** — IMDS Endpoint auf Azure VMs (`169.254.169.254`)
- **ARM Templates** — Fehlkonfigurierte Deployments
- **Storage Accounts** — Public Blob Container, SAS Token Exposure
- **Key Vault** — Zugriffsrichtlinien, Secret Exposure

## Azure Kubernetes Service (AKS)

- **Pod-to-Pod** — Netzwerk-Policies fehlend
- **RBAC Misconfiguration** — `cluster-admin` für Service Accounts
- **Node Metadata** — IMDS vom Pod erreichbar
- **etcd** — Unverschlüsselte Secrets

## Monitoring & Detection

- **Azure Monitor** — Metriken und Logs
- **Microsoft Sentinel** — Cloud-native SIEM/SOAR
- **Defender for Cloud** — Security Posture Management
- **Azure AD Sign-in Logs** — Authentifizierungshistorie
- **Unified Audit Log** — Microsoft 365 + Azure Aktivitäten

## Verwandte Dokumente

- `cloud/azure/Azure Active Directory Attack and Defense.pdf`
- `cloud/azure/Microsoft Azure Penetration Testing.pdf`
- `cloud/azure/Azure Kubernetes Service AKS Security.pdf`
