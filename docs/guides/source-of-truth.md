# Valtheron Architecture: Core Reference Manual (v2.0)

**Status:** Official Source-of-Truth  
**Maintainer:** Valtheron Core Team  
**Scope:** Orchestration Logic, Security Protocols, and SQLite Schema

---

## 1. Executive Summary
This document serves as the architectural foundation for the Valtheron Agentic Workspace. It outlines the transition from legacy monolithic structures to the v2 modular framework. The primary objective is to codify the orchestration of 290+ concurrent agents within a sandboxed environment, backed by AES-256-GCM encrypted persistence and comprehensive audit-trailing.

---

## 2. Conceptual Explanation
Valtheron v2 operates on a **decoupled orchestration model**. 
*   **Agentic Framework:** Uses a directed acyclic graph (DAG) for task delegation.
*   **Persistence:** SQLite is utilized as the primary state store, strictly enforced via TypeScript interfaces to ensure schema integrity.
*   **Security:** Cryptographic operations are handled via `node:crypto`, requiring GCM (Galois/Counter Mode) for authenticated encryption, ensuring both confidentiality and data integrity.

---

## 3. Step-by-Step Implementation

### A. SQLite Schema Definition (TypeScript)
To maintain the integrity of audit logs and system coordinates, we enforce strict typing for our SQLite operations.

```typescript
// src/db/schema.ts
import { z } from 'zod';

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string(),
  action: z.string(),
  timestamp: z.date(),
  metadata: z.string().transform((val) => JSON.parse(val))
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
```

### B. AES-256-GCM Encryption Utility
Using Express 5.1 conventions, ensure all sensitive configuration data is encrypted at rest using the following pattern:

```typescript
// src/lib/crypto.ts
import { createCipheriv, randomBytes, createDecipheriv } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

export const encrypt = (text: string, secretKey: Buffer) => {
  const iv = randomBytes(12); // GCM standard IV length
  const cipher = createCipheriv(ALGORITHM, secretKey, iv);
  
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
};
```

---

## 4. Best Practices Checklist

To ensure production-ready code, every contributor must adhere to the following standards:

### Orchestration & Sandboxing
- [ ] **Isolation:** All agent execution must occur within a `node:vm` context or a dedicated containerized worker.
- [ ] **Resource Limits:** Implement hard limits on memory and CPU usage per agent instance to prevent resource starvation.

### Security
- [ ] **Key Rotation:** Never hardcode keys; utilize `process.env.VALTHERON_MASTER_KEY` with a rotation policy (minimum every 90 days).
- [ ] **Audit Trailing:** Every write operation to the database must be accompanied by an entry in the `audit_logs` table.
- [ ] **MFA Enforcement:** Ensure all administrative workspace access requires a TOTP-based MFA challenge via the Express 5.1 middleware layer.

### Frontend (React 19)
- [ ] **Server Components:** Utilize React 19 Server Components for data-fetching logic to keep sensitive API orchestration off the client side.
- [ ] **Type Safety:** Use `useActionState` and `useFormStatus` to handle agent interactions, ensuring strict type-checking against the backend schema.

---

**Note to Contributors:** This document is the source-of-truth. When submitting PRs, ensure your documentation updates align with the technical specifications defined here. If you are modifying the encryption schedule, you must update the `docs/guides/crypto_standards.md` file in tandem.