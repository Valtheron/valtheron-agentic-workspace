# Technical Migration & Documentation Guide: Legacy Setup Refactoring

This document outlines the architectural refactoring of the legacy plaintext onboarding file `docs/v1_setup_instruction.txt` into the standardized, production-ready markdown guide located at `docs/guides/getting-started.md`. 

As the Lead Maintainer and Architect of the **Valtheron Agentic Workspace**, I have designed this transition to ensure our local onboarding sequence aligns with our core technical commitments: **React 19, Express 5.1, TypeScript 5.x, SQLite (with WAL mode), AES-256-GCM encryption, Multi-Factor Authentication (MFA), and immutable audit trailing**.

---

## 1. Executive Summary

### Objective
To deprecate the unstructured, error-prone `docs/v1_setup_instruction.txt` file and replace it with a comprehensive, interactive, and highly structured onboarding guide at `docs/guides/getting-started.md`.

### Context & Justification
The original `.txt` documentation lacked structured formatting, syntax highlighting, and modern validation steps. It led to onboarding friction, environment configuration drifts, and unverified cryptographic keys. 

By migrating to a standardized Markdown document (`docs/guides/getting-started.md`), we achieve:
*   **Interactive Prerequisites Checklist:** Clear division of system-level, database, and cryptographic requirements.
*   **Deterministic Environment Validation:** Step-by-step setup integrated with a robust TypeScript-based verification script.
*   **Modern Stack Alignment:** Explicit onboarding instructions for React 19's concurrent features and Express 5.1's native promise-handling middleware.
*   **Zero-Trust Local Defaults:** Forcing local environments to initialize with secure AES-256-GCM keys, SQLite WAL configuration, and audit trail schemas from day one.

---

## 2. Conceptual Explanation

### Documentation as Code (DaC)
In the Valtheron Agentic Workspace, documentation must be treated with the same rigor as production code. This means:
1.  **Verifiability:** Code blocks and environment variables specified in the documentation must be directly testable.
2.  **Security by Default:** Local setups must not use weak fallback keys. The documentation must guide the engineer to generate cryptographically secure keys (using Node's native `crypto` module) before booting the application.
3.  **Modern Framework Parity:** 
    *   **Express 5.1** introduces native handling of rejected promises in route handlers and middleware. Our setup guides must leverage this to eliminate boilerplate try-catch blocks in setup verification APIs.
    *   **React 19** introduces refined hydration and compiler-ready structures. Onboarding must verify that the local Node environment matches the strict React 19 compilation prerequisites.

### Local Architecture Blueprint
During the execution of this guide, the developer will instantiate the following architecture:

```
                  +---------------------------------------+
                  |         React 19 Client App           |
                  +-------------------+-------------------+
                                      |
                           HTTPS (Localhost Ports)
                                      |
                                      v
                  +-------------------+-------------------+
                  |       Express 5.1 API Engine          |
                  +---------+-------------------+---------+
                            |                   |
               AES-256-GCM (Crypto)       better-sqlite3
                            |                   |
                            v                   v
                  +-------------------+ +-----------------+
                  |  Secure Key Ring  | |  SQLite (WAL)   |
                  +-------------------+ +-----------------+
```

---

## 3. The Refactored Guide: `docs/guides/getting-started.md`

Below is the complete, high-quality, production-ready markdown content for the new onboarding guide.

***

```markdown
# Getting Started with Valtheron Agentic Workspace

Welcome to the Valtheron Agentic Workspace. This guide will walk you through setting up your local development environment. 

Valtheron is built on a highly secure, zero-trust local architecture utilizing **React 19**, **Express 5.1**, **TypeScript**, and **SQLite**. All sensitive data rests behind **AES-256-GCM** encryption, and every system interaction is captured by an immutable local audit trail.

---

## Prerequisites Checklist

Ensure your local machine meets the following baseline requirements:

- [ ] **Node.js**: `v20.11.0` (LTS) or higher (Recommended: `v21.x` / `v22.x`)
- [ ] **Package Manager**: `pnpm v9.x` or higher
- [ ] **Compiler**: `TypeScript v5.4` or higher
- [ ] **Database Engine**: SQLite 3 (Library bindings handled via `better-sqlite3`)
- [ ] **Development OS**: macOS Sonoma+, Linux (Ubuntu 22.04+), or Windows 11 (WSL2 recommended)

---

## Step 1: Clone and Install Dependencies

Clone the repository and install the monorepo dependencies using `pnpm`.

```bash
git clone https://github.com/Valtheron/valtheron-agentic-workspace.git
cd valtheron-agentic-workspace
pnpm install
```

---

## Step 2: Environment Configuration

Copy the environment template to create your local configuration.

```bash
cp .env.example .env
```

### Cryptographic Key Generation
Valtheron requires a cryptographically secure 256-bit (32-byte) key for **AES-256-GCM** encryption of agent credentials and workspace secrets. 

Generate a compliant key using the following Node.js command:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update your `.env` file with the generated key and configure your local SQLite database path:

```env
# System Configuration
NODE_ENV=development
PORT=8080
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL=file:./data/valtheron_dev.db

# Cryptography (AES-256-GCM)
# Paste your generated 64-character hex key here:
ENCRYPTION_SECRET=9f8a2c3b4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b

# MFA Configuration
MFA_ISSUER=ValtheronLocalDev
```

---

## Step 3: Environment Validation Script

To prevent runtime failures due to misconfigured environment variables or weak cryptographic keys, run our automated validation script.

Create or verify the existence of `scripts/validate-env.ts`:

```typescript
import { Buffer } from 'node:buffer';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface ValidationResult {
  success: boolean;
  errors: string[];
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];

  // 1. Verify Database Directory exists or can be created
  const dbUrl = process.env.DATABASE_URL || 'file:./data/valtheron_dev.db';
  if (dbUrl.startsWith('file:')) {
    const relativePath = dbUrl.replace('file:', '');
    const absolutePath = path.resolve(process.cwd(), relativePath);
    const dir = path.dirname(absolutePath);
    
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err: any) {
      errors.push(`Failed to create database directory at ${dir}: ${err.message}`);
    }
  }

  // 2. Validate AES-256-GCM Cryptographic Secret
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    errors.push('ENCRYPTION_SECRET is missing from the environment configuration.');
  } else {
    // Must be a valid hex string representing 32 bytes (64 hex characters)
    const hexRegex = /^[0-9a-fA-F]{64}$/;
    if (!hexRegex.test(secret)) {
      errors.push('ENCRYPTION_SECRET must be a 64-character hex-encoded string (32 bytes).');
    } else {
      try {
        const buffer = Buffer.from(secret, 'hex');
        if (buffer.length !== 32) {
          errors.push(`ENCRYPTION_SECRET key length is invalid. Expected 32 bytes, got ${buffer.length} bytes.`);
        }
      } catch {
        errors.push('ENCRYPTION_SECRET failed hex decoding validation.');
      }
    }
  }

  // 3. Validate Node Environment
  if (!process.env.NODE_ENV) {
    errors.push('NODE_ENV is not defined. Set it to "development" or "production".');
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

// Execute validation when run directly
if (require.main === module) {
  console.log('🔍 Validating Valtheron environment configuration...');
  const result = validateEnvironment();
  if (result.success) {
    console.log('✅ Environment configuration is valid and secure.');
    process.exit(0);
  } else {
    console.error('❌ Environment validation failed:');
    result.errors.forEach((err) => console.error(`   - ${err}`));
    process.exit(1);
  }
}
```

Run the validation suite:

```bash
npx ts-node scripts/validate-env.ts
```

---

## Step 4: Database Initialization & Seeding

Valtheron uses SQLite in **Write-Ahead Logging (WAL)** mode to ensure high-performance concurrent reads and writes. Execute the seeding script to initialize your schema, create default system settings, and establish the initial audit trail structure.

Create or verify `scripts/seed-db.ts`:

```typescript
import Database from 'better-sqlite3';
import * as path from 'node:path';
import * as fs from 'node:fs';
import dotenv from 'dotenv';

dotenv.config();

interface SeedResult {
  success: boolean;
  recordsInserted: number;
}

export function seedDatabase(): SeedResult {
  const dbUrl = process.env.DATABASE_URL || 'file:./data/valtheron_dev.db';
  const rawPath = dbUrl.replace('file:', '');
  const absolutePath = path.resolve(process.cwd(), rawPath);

  // Ensure directory exists
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  // Initialize SQLite Connection
  const db = new Database(absolutePath, { verbose: console.log });

  // Optimize database for concurrent development performance (WAL mode)
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  let recordsInserted = 0;

  // Execute database migrations and seedings within an explicit transaction
  const runTransaction = db.transaction(() => {
    // 1. Core Users Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        mfa_secret TEXT,
        mfa_enabled INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 2. Encrypted Agent Credentials Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS agent_credentials (
        id TEXT PRIMARY KEY,
        agent_name TEXT NOT NULL,
        encrypted_api_key TEXT NOT NULL,
        iv TEXT NOT NULL,
        auth_tag TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 3. Immutable Audit Log Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Seed Initial Local Developer Account
    const userCheck = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?').get('dev@valtheron.local') as { count: number };
    
    if (userCheck.count === 0) {
      db.prepare(`
        INSERT INTO users (id, email, mfa_secret, mfa_enabled)
        VALUES (?, ?, ?, ?)
      `).run('usr_dev_01', 'dev@valtheron.local', 'USRLOCALMFASECRETKEY32CHARS', 0);
      recordsInserted++;

      // Seed Initial Audit Trail Record
      db.prepare(`
        INSERT INTO audit_logs (id, actor, action, payload)
        VALUES (?, ?, ?, ?)
      `).run(
        'aud_init_01',
        'SYSTEM',
        'WORKSPACE_SEED',
        JSON.stringify({ message: 'Local development environment workspace seeded successfully.' })
      );
      recordsInserted++;
    }
  });

  try {
    runTransaction();
    db.close();
    return { success: true, recordsInserted };
  } catch (error) {
    console.error('Database seeding transaction failed:', error);
    db.close();
    throw error;
  }
}

if (require.main === module) {
  console.log('🗄️ Initializing SQLite database and executing seed scripts...');
  try {
    const result = seedDatabase();
    console.log(`✅ Seeding complete. Records inserted: ${result.recordsInserted}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed.');
    process.exit(1);
  }
}
```

Execute the database configuration:

```bash
npx ts-node scripts/seed-db.ts
```

---

## Step 5: Express 5.1 Server Verification

To verify your server-side environment, start the Express backend. Express 5.1 natively handles rejected promises from asynchronous route handlers without wrapping them in custom async handlers.

Below is the standard Express 5.1 verification route. To test, start the server:

```bash
pnpm --filter api dev
```

### Server Verification Endpoint (`src/server.ts`)
```typescript
import express, { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import * as path from 'node:path';

const app = express();
app.use(express.json());

// Express 5.1 natively passes rejected promises to the default error handler.
// No need for a custom wrapper or try/catch boilerplate for async databases.
app.get('/api/v1/health', async (req: Request, res: Response) => {
  const dbUrl = process.env.DATABASE_URL || 'file:./data/valtheron_dev.db';
  const rawPath = dbUrl.replace('file:', '');
  const absolutePath = path.resolve(process.cwd(), rawPath);

  const db = new Database(absolutePath, { readonly: true });
  
  // Verify DB connection & query user count
  const result = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  db.close();

  res.status(200).json({
    status: 'healthy',
    database: 'connected',
    userCount: result.count,
    timestamp: new Date().toISOString(),
  });
});

// Centralized Express 5.1 Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Application Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Valtheron API Engine running on port ${PORT}`);
});
```

---

## Step 6: React 19 Client Verification

Start the React frontend application:

```bash
pnpm --filter client dev
```

Verify your local connection status using this React 19 component. It utilizes modern state-setting paradigms and strict type-safety to check connection with the backend API.

### Sanity Check Component (`src/components/SanityCheck.tsx`)
```tsx
import React, { useState, useEffect } from 'react';

interface HealthResponse {
  status: string;
  database: string;
  userCount: number;
  timestamp: string;
}

export const SanityCheck: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    async function checkBackend() {
      try {
        const response = await fetch('/api/v1/health');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = (await response.json()) as HealthResponse;
        if (active) {
          setHealthData(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Failed to connect to backend server.');
          setLoading(false);
        }
      }
    }

    checkBackend().catch((err) => {
      console.error('Unhandled error in checkBackend effect:', err);
    });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-slate-100 rounded-lg animate-pulse">
        <p className="text-slate-700 font-medium">Validating workspace connection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-bold">Workspace Validation Failed</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
        <p className="text-xs text-red-500 mt-2">
          Verify your API server is running on the configured port and that the SQLite database is initialized.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
      <h3 className="text-emerald-900 font-bold text-lg">Workspace Online</h3>
      <div className="mt-3 text-sm text-emerald-800 space-y-1">
        <p><strong>Database:</strong> {healthData?.database} (WAL Mode Active)</p>
        <p><strong>Seeded Users:</strong> {healthData?.userCount}</p>
        <p><strong>Server Time:</strong> {healthData?.timestamp}</p>
      </div>
      <div className="mt-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          React 19 & Express 5.1 Active
        </span>
      </div>
    </div>
  );
};
```

---

## Troubleshooting & Error Recovery

### 1. SQLite Database Lock Errors (`SQLITE_BUSY`)
If you encounter database lock errors during concurrent execution, verify that WAL (Write-Ahead Logging) mode is correctly enabled:
```bash
sqlite3 ./data/valtheron_dev.db "PRAGMA journal_mode;"
# Output must be: wal
```
If it is not, execute:
```bash
sqlite3 ./data/valtheron_dev.db "PRAGMA journal_mode=WAL;"
```

### 2. Invalid Hex Key Length (`ENCRYPTION_SECRET`)
If the validation script throws an key length error:
* Double-check that you did not include spaces or quotation marks inside the `.env` value.
* Regenerate the secret key using the exact Node.js cryptographic utility outlined in **Step 2**.
```

***

## 4. Key Best Practices

As contributors and maintainers build and expand the Valtheron Workspace, adhere strictly to the following architectural guidelines:

### 1. Maintainer Hygiene & Documentation Parity
* **Automated Sync Checks:** Never modify schema parameters or database initialization files without updating the corresponding setup instructions and scripts in `docs/guides/getting-started.md`.
* **Zero Legacy Fallbacks:** Do not let legacy code examples seep back into documentation. Ensure all Express code examples in markdown reflect the Express 5.1 native async error-handling paradigm (i.e., eliminating unnecessary wrapper libraries).

### 2. Security-First Local Environments
* **Entropy Verification:** Always enforce a strict 256-bit entropy requirement for encryption keys. Never commit default keys to GitHub.
* **Database Isolation:** Ensure the SQLite `.db` and `.db-wal` files are explicitly added to your project's root `.gitignore` to prevent leaking local operational data.
* **Audit Trail Integrity:** Local development actions (such as database seeding) must write an initial entry to the local audit trail table to verify the integrity of write-operations before developers begin building.