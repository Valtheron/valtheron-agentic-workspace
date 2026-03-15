# Container Security — Knowledge Base Summary

**Kategorie:** Cloud & Container Security
**Subcategory:** Containers
**Dokumente:** 5
**Schwierigkeit:** Intermediate → Advanced
**Sprache:** EN

---

## Übersicht

Container-Technologien (Docker, Kubernetes) haben die Softwarebereitstellung revolutioniert, bringen aber spezifische Sicherheitsherausforderungen mit sich: von unsicheren Images bis zu Container-Escape-Techniken.

## Docker Security

### Häufige Fehlkonfigurationen
- **Privileged Container** — `--privileged` Flag gewährt Kernel-Zugriff
- **Docker Socket Mount** — `/var/run/docker.sock` ermöglicht Container-Escape
- **Root-User** — Container läuft als root (Standard)
- **Offene Docker API** — TCP Port 2375 ohne TLS

### Container Escape Techniken
```bash
# Privileged Container Escape
mkdir /mnt/host && mount /dev/sda1 /mnt/host
chroot /mnt/host

# Docker Socket Escape
docker -H unix:///var/run/docker.sock run -v /:/host -it alpine chroot /host sh
```

## Kubernetes Security

### RBAC (Role-Based Access Control)
```yaml
# Gefährliche Berechtigungen:
- "*" (alle Ressourcen)
- "pods/exec" (Code-Ausführung in Pods)
- "secrets" (Kubernetes Secrets lesen)
- "create" auf ClusterRoleBinding (Privilege Escalation)
```

### Angriffsvektoren
- **Exposed etcd** — Unverschlüsselte Secrets (Port 2379)
- **Kubelet API** — Unauthentifizierter Zugriff (Port 10250)
- **Pod-to-API-Server** — Zu permissive RBAC
- **Node Affinity Escape** — Privilegierter Pod auf Master Node

### Kubernetes Pentesting Tools
- **kube-hunter** — Kubernetes Schwachstellen-Scanner
- **kube-bench** — CIS Benchmark Prüfung
- **kubesec** — Statische YAML-Analyse
- **Trivy** — Container Image Vulnerability Scanning
- **Falco** — Runtime Security (Anomalie-Detektion)

## Sichere Container-Konfiguration (Best Practices)

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
```

## Verwandte Dokumente

- `cloud/containers/Container Escape Techniques.pdf`
- `cloud/containers/Kubernetes Security - Complete Guide.pdf`
- `cloud/containers/Kubernetes Penetration Testing.pdf`
