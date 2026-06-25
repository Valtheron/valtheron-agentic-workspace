# Guide: Getting Started with Valtheron

## Executive Summary
This guide outlines the standardized procedure for initializing a local development environment for the Valtheron Agentic Workspace. We have transitioned from legacy unstructured documentation to this modular format to ensure consistency across our React 19 and Express 5.1 architecture. Follow these steps to ensure a secure, type-safe, and functional local build.

---

## Conceptual Explanation
Valtheron leverages a decoupled architecture requiring specific environment synchronization. Because we utilize **AES-256-GCM** for data integrity and **SQLite** for local persistence, the initialization process is strictly sequential. 

- **Environment Layer:** Manages sensitive keys and port configurations.
- **Persistence Layer:** Uses Sequelize/Better-SQLite3 to handle state.
- **Runtime Layer:** Powered by Express 5.1, utilizing native `AsyncLocalStorage` for audit tracing.

---

## Step-by-Step Setup

### 1. Environment Configuration
Create a `.env` file in the root directory. **Do not commit this file to version control.**

```bash
# .env
PORT=3000
# Ensure this is a 32-byte hex string for AES-256-GCM
SECRET_KEY=your_secure_random_key_here
NODE_ENV=development
```

### 2. Dependency Management
Ensure you are running **Node.js v20+** (LTS recommended) to support React 19 features and Express 5.1 middleware.

```bash
# Verify version
node -v

# Install dependencies
npm install
```

### 3. Database Initialization
We use a deterministic seed script. Ensure your `package.json` reflects the following entry point to maintain compatibility with our TypeScript build pipeline:

```json
// package.json
"scripts": {
  "seed": "tsx scripts/seed.ts"
}
```

Run the seed command:
```bash
npm run seed
```

### 4. Running the Workspace
Start the development server with hot-reloading:

```bash
npm run dev
```

---

## Best Practices & Error Recovery

### Security Checklist
*   **Database Isolation:** Ensure `database.sqlite` (or your local `.json` store) is included in your `.gitignore`.
*   **Key Rotation:** If `SECRET_KEY` is compromised, all encrypted audit logs must be considered tainted.
*   **MFA Simulation:** During local development, MFA tokens are bypassed if `NODE_ENV` is set to `development`. Ensure you do not deploy with this setting.

### Common Troubleshooting
| Issue | Cause | Recovery |
| :--- | :--- | :--- |
| `ERR_INVALID_KEY` | `SECRET_KEY` length < 32 chars | Regenerate key via `openssl rand -hex 32` |
| `SQLITE_BUSY` | Lock contention | `rm database.sqlite && npm run seed` |
| `React 19 Hooks Error` | Mismatched dependency versions | `rm -rf node_modules package-lock.json && npm install` |

### Code Quality Standards
When contributing to the workspace, adhere to these TypeScript patterns:
- **Strict Typing:** Avoid `any`. Use interfaces for all request bodies in Express 5.1 routes.
- **Audit Trailing:** Every write operation to the database must trigger the `AuditLogger` service.
- **Encryption:** All PII must pass through the `EncryptionService` using the GCM tag for integrity verification.

---

*For further assistance, please open an issue on [GitHub](https://github.com/Valtheron/valtheron-agentic-workspace) or contact the maintainers via the internal contributor slack channel.*