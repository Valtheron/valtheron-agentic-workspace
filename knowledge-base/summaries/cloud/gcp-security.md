# GCP Security — Knowledge Base Summary

**Kategorie:** Cloud & Container Security
**Subcategory:** GCP
**Dokumente:** 3
**Schwierigkeit:** Intermediate → Advanced
**Sprache:** EN

---

## Übersicht

Google Cloud Platform (GCP) bietet starke Kubernetes-Integration (GKE) und nutzt Service Accounts für maschinelle Identitäten. Wie bei AWS ist die IAM-Konfiguration der häufigste Schwachstellenvektor.

## GCP IAM

- **Service Accounts** — Maschinelle Identitäten (analog zu AWS Roles)
- **Workload Identity** — Service Account Token im GKE Pod
- **Organization Policies** — Übergreifende Zugriffskontrollen
- **Primitive Roles** — Owner/Editor/Viewer (zu weit gefasst)

### Privilege Escalation
```
roles/iam.serviceAccountTokenCreator → Token erstellen für andere SA
roles/iam.serviceAccountUser          → Als SA ausführen
roles/storage.admin                   → Cloud Storage vollständig
```

## GKE (Google Kubernetes Engine)

- **Workload Identity Missbrauch** — SA-Token aus Pod
- **Cluster-Admin Binding** — Überprivilegierte Bindings
- **Metadata API** — Zugriff auf GKE-Metadaten vom Pod

## Cloud-Dienste

| Dienst | Sicherheitsaspekt |
|--------|------------------|
| **Cloud Storage** | Public Buckets, IAM Bindings |
| **Cloud Functions** | Environment Variables, Trigger-Sicherheit |
| **BigQuery** | Dataset-Permissions, Public Access |
| **Cloud SQL** | Authorized Networks, SSL |

## Monitoring

- **Cloud Audit Logs** — Admin Activity, Data Access, System Event
- **Security Command Center** — Zentrale Sicherheitsbefunde
- **Cloud Armor** — WAF und DDoS-Schutz

## Verwandte Dokumente

- `cloud/gcp/GCP Attack Techniques and Defenses.pdf`
- `cloud/gcp/Google Kubernetes Engine GKE Exploitation.pdf`
