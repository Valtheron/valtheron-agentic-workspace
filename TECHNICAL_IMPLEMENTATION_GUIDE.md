# Technical Implementation Guide - Agentic Workspace for Autonomous Operations

**Version:** 1.0  
**Datum:** Januar 2026  
**Zielgruppe:** Autonome KI-Agenten, Entwickler  
**Zweck:** Vollständige technische Anleitung zur Programmierung der Agentic Workspace

---

## Inhaltsverzeichnis

1. [System-Architektur](#system-architektur)
2. [Datenstrukturen & Schemas](#datenstrukturen--schemas)
3. [API-Spezifikation](#api-spezifikation)
4. [Datenbank-Schema](#datenbank-schema)
5. [Authentifizierung & Sicherheit](#authentifizierung--sicherheit)
6. [Implementierungs-Schritte](#implementierungs-schritte)
7. [Code-Beispiele](#code-beispiele)
8. [Testing & Validierung](#testing--validierung)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## System-Architektur

### 1.1 High-Level Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend Layer                             │
│  (Web UI, Mobile Apps, Agent Interfaces)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                          │
│  (Authentication, Rate Limiting, Routing)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Identity Service  │ Access Control │ Audit Service      │  │
│  │ Persona Manager   │ Policy Engine  │ Compliance Manager │  │
│  │ Credential Store  │ Delegation Mgr │ Incident Manager   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PostgreSQL │ MongoDB │ Redis │ Blockchain │ Elasticsearch│  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Microservices

| Service | Port | Verantwortung |
|---------|------|---------------|
| Identity Service | 3001 | DID, VC, SSI Management |
| Access Control Service | 3002 | RBAC, ABAC, CBS |
| Audit Service | 3003 | Logging, Compliance, Forensics |
| Persona Manager | 3004 | Persona CRUD, Specialization |
| Policy Engine | 3005 | Policy Definition, Evaluation |
| Credential Service | 3006 | VC Issuance, Verification |
| Incident Manager | 3007 | Threat Detection, Response |
| API Gateway | 3000 | Routing, Auth, Rate Limiting |

---

## Datenstrukturen & Schemas

### 2.1 Persona Schema

```typescript
interface Persona {
  // Identität
  id: string;                    // UUID v5
  did: string;                   // Decentralized Identifier
  name: string;                  // Persona-Name
  category: string;              // Kategorie (10 Kategorien)
  
  // Spezialisierung
  specialization_level: number;  // 1-19 (A-S Spektrum)
  capabilities: string[];        // Liste von Fähigkeiten
  
  // Kontext
  background: string;            // Beruf/Rolle Beschreibung
  response_format: string;       // Antwort-Präferenzen
  communication_style: string;   // Kommunikationsstil
  
  // Sicherheit
  public_key: string;            // RSA-4096 Public Key
  trust_level: number;           // 0.0 - 1.0
  security_clearance: string;    // level-1 bis level-5
  
  // Credentials
  credentials: VerifiableCredential[];
  capabilities_granted: Capability[];
  
  // Audit
  created_at: timestamp;
  created_by: string;
  updated_at: timestamp;
  updated_by: string;
  version: number;
  
  // Status
  status: 'active' | 'inactive' | 'suspended' | 'revoked';
  last_activity: timestamp;
}
```

### 2.2 Verifiable Credential Schema

```typescript
interface VerifiableCredential {
  // Kontext
  "@context": string[];
  type: string[];
  
  // Issuer & Subject
  issuer: string;                // DID des Issuers
  issuanceDate: timestamp;
  expirationDate?: timestamp;
  
  // Credential Subject
  credentialSubject: {
    id: string;                  // DID der Persona
    name: string;
    capabilities: string[];
    specialization: string;
    trust_level: number;
    security_clearance: string;
  };
  
  // Proof (Digitale Signatur)
  proof: {
    type: string;                // "RsaSignature2018"
    created: timestamp;
    verificationMethod: string;  // DID#key-id
    signatureValue: string;      // Base64-encoded signature
  };
  
  // Revocation
  credentialStatus?: {
    id: string;
    type: string;
    statusListIndex: number;
  };
}
```

### 2.3 Capability Schema

```typescript
interface Capability {
  id: string;                    // UUID
  persona_id: string;            // Persona DID
  resource: string;              // z.B. "api:personas:read"
  action: string;                // "read" | "write" | "delete" | "execute"
  scope: string;                 // z.B. "own" | "team" | "all"
  
  // Delegation
  delegated_by: string;          // DID des Delegators
  delegated_to: string;          // DID des Delegatees
  delegation_depth: number;      // Wie viele Ebenen delegiert
  
  // Gültigkeitsdauer
  granted_at: timestamp;
  expires_at?: timestamp;
  
  // Bedingungen
  conditions?: {
    time_window?: {start: string, end: string};
    ip_whitelist?: string[];
    rate_limit?: number;
    require_mfa?: boolean;
  };
  
  // Status
  status: 'active' | 'revoked' | 'expired';
  
  // Audit
  created_at: timestamp;
  revoked_at?: timestamp;
  revoked_by?: string;
}
```

### 2.4 Audit Log Schema

```typescript
interface AuditLog {
  id: string;                    // UUID
  timestamp: timestamp;
  
  // Actor & Action
  actor_id: string;              // DID der Persona
  action: string;                // z.B. "CREATE_PERSONA"
  resource_type: string;         // z.B. "persona" | "credential"
  resource_id: string;           // ID der Ressource
  
  // Result
  status: 'success' | 'failure' | 'partial';
  result_code: string;           // z.B. "AUTH_FAILED"
  error_message?: string;
  
  // Context
  context: {
    ip_address: string;
    user_agent: string;
    request_id: string;
    session_id: string;
  };
  
  // Details
  changes?: {
    before: object;
    after: object;
  };
  
  // Blockchain
  blockchain_hash?: string;      // Hash im Blockchain
  blockchain_tx?: string;        // Blockchain Transaction ID
}
```

---

## API-Spezifikation

### 3.1 Authentication API

#### Endpoint: POST /api/v1/auth/login

**Request:**
```json
{
  "did": "did:example:persona:001",
  "password": "secure_password",
  "mfa_code": "123456"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "invalid_credentials",
  "message": "DID or password incorrect"
}
```

### 3.2 Persona Management API

#### Endpoint: POST /api/v1/personas

**Request:**
```json
{
  "name": "Fitness-App-Entwickler",
  "category": "Gesundheitsexperten",
  "specialization_level": 15,
  "background": "Ich bin ein Fitness-App-Entwickler...",
  "response_format": "Antwortformat: Bitte geben Sie klare Antworten...",
  "communication_style": "Direkt und praktisch",
  "capabilities": [
    "mobile-development",
    "ux-design",
    "fitness-domain"
  ],
  "security_clearance": "level-3"
}
```

**Response (201 Created):**
```json
{
  "id": "persona_001",
  "did": "did:example:persona:001",
  "name": "Fitness-App-Entwickler",
  "category": "Gesundheitsexperten",
  "status": "active",
  "created_at": "2026-01-06T10:30:00Z"
}
```

#### Endpoint: GET /api/v1/personas/{persona_id}

**Response (200 OK):**
```json
{
  "id": "persona_001",
  "did": "did:example:persona:001",
  "name": "Fitness-App-Entwickler",
  "category": "Gesundheitsexperten",
  "specialization_level": 15,
  "capabilities": [
    "mobile-development",
    "ux-design",
    "fitness-domain"
  ],
  "trust_level": 0.95,
  "security_clearance": "level-3",
  "status": "active",
  "last_activity": "2026-01-06T10:45:00Z"
}
```

#### Endpoint: PUT /api/v1/personas/{persona_id}

**Request:**
```json
{
  "specialization_level": 16,
  "capabilities": [
    "mobile-development",
    "ux-design",
    "fitness-domain",
    "backend-development"
  ]
}
```

**Response (200 OK):**
```json
{
  "id": "persona_001",
  "version": 2,
  "updated_at": "2026-01-06T10:50:00Z"
}
```

#### Endpoint: DELETE /api/v1/personas/{persona_id}

**Response (204 No Content)**

### 3.3 Capability Management API

#### Endpoint: POST /api/v1/capabilities

**Request:**
```json
{
  "persona_id": "did:example:persona:001",
  "resource": "api:personas:read",
  "action": "read",
  "scope": "all",
  "expires_at": "2026-12-31T23:59:59Z",
  "conditions": {
    "require_mfa": true,
    "rate_limit": 1000
  }
}
```

**Response (201 Created):**
```json
{
  "id": "cap_001",
  "persona_id": "did:example:persona:001",
  "resource": "api:personas:read",
  "status": "active",
  "granted_at": "2026-01-06T10:30:00Z"
}
```

#### Endpoint: POST /api/v1/capabilities/{capability_id}/revoke

**Request:**
```json
{
  "reason": "Security policy change"
}
```

**Response (200 OK):**
```json
{
  "id": "cap_001",
  "status": "revoked",
  "revoked_at": "2026-01-06T10:35:00Z"
}
```

### 3.4 Access Control API

#### Endpoint: POST /api/v1/access/check

**Request:**
```json
{
  "persona_id": "did:example:persona:001",
  "resource": "api:personas:read",
  "action": "read",
  "context": {
    "ip_address": "192.168.1.100",
    "require_mfa": true
  }
}
```

**Response (200 OK - Access Granted):**
```json
{
  "allowed": true,
  "reason": "Capability found and valid",
  "decision_id": "dec_001"
}
```

**Response (403 Forbidden - Access Denied):**
```json
{
  "allowed": false,
  "reason": "Capability expired",
  "decision_id": "dec_002"
}
```

### 3.5 Audit API

#### Endpoint: GET /api/v1/audit/logs

**Query Parameters:**
```
?persona_id=did:example:persona:001
&action=CREATE_PERSONA
&start_date=2026-01-01T00:00:00Z
&end_date=2026-01-06T23:59:59Z
&limit=100
&offset=0
```

**Response (200 OK):**
```json
{
  "total": 250,
  "limit": 100,
  "offset": 0,
  "logs": [
    {
      "id": "log_001",
      "timestamp": "2026-01-06T10:30:00Z",
      "actor_id": "did:example:persona:admin",
      "action": "CREATE_PERSONA",
      "resource_type": "persona",
      "resource_id": "persona_001",
      "status": "success",
      "context": {
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0..."
      }
    }
  ]
}
```

---

## Datenbank-Schema

### 4.1 PostgreSQL Schema

```sql
-- Personas Table
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  did VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  specialization_level INT CHECK (specialization_level >= 1 AND specialization_level <= 19),
  background TEXT,
  response_format TEXT,
  communication_style TEXT,
  public_key TEXT NOT NULL,
  trust_level DECIMAL(3,2) DEFAULT 0.50,
  security_clearance VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255),
  version INT DEFAULT 1,
  last_activity TIMESTAMP,
  CONSTRAINT valid_trust_level CHECK (trust_level >= 0.0 AND trust_level <= 1.0)
);

-- Capabilities Table
CREATE TABLE capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id VARCHAR(255) NOT NULL REFERENCES personas(did),
  resource VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  scope VARCHAR(50) NOT NULL,
  delegated_by VARCHAR(255),
  delegated_to VARCHAR(255),
  delegation_depth INT DEFAULT 0,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  revoked_at TIMESTAMP,
  revoked_by VARCHAR(255),
  conditions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_delegation_depth CHECK (delegation_depth >= 0 AND delegation_depth <= 5)
);

-- Audit Logs Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actor_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  result_code VARCHAR(50),
  error_message TEXT,
  context JSONB,
  changes JSONB,
  blockchain_hash VARCHAR(255),
  blockchain_tx VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verifiable Credentials Table
CREATE TABLE verifiable_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id VARCHAR(255) NOT NULL REFERENCES personas(did),
  issuer VARCHAR(255) NOT NULL,
  issuance_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiration_date TIMESTAMP,
  credential_subject JSONB NOT NULL,
  proof JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX idx_personas_did ON personas(did);
CREATE INDEX idx_personas_category ON personas(category);
CREATE INDEX idx_personas_status ON personas(status);
CREATE INDEX idx_capabilities_persona_id ON capabilities(persona_id);
CREATE INDEX idx_capabilities_status ON capabilities(status);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_vc_persona_id ON verifiable_credentials(persona_id);
```

### 4.2 MongoDB Collections

```javascript
// Personas Collection
db.createCollection("personas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["did", "name", "category"],
      properties: {
        _id: { bsonType: "objectId" },
        did: { bsonType: "string" },
        name: { bsonType: "string" },
        category: { bsonType: "string" },
        specialization_level: { bsonType: "int" },
        capabilities: { bsonType: "array" },
        metadata: { bsonType: "object" },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  }
});

// Create Indexes
db.personas.createIndex({ "did": 1 }, { unique: true });
db.personas.createIndex({ "category": 1 });
db.personas.createIndex({ "created_at": 1 });
```

---

## Authentifizierung & Sicherheit

### 5.1 JWT Token Generation

```python
import jwt
import datetime
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

class TokenManager:
    def __init__(self, private_key_path: str, public_key_path: str):
        with open(private_key_path, 'rb') as f:
            self.private_key = serialization.load_pem_private_key(
                f.read(),
                password=None,
                backend=default_backend()
            )
        with open(public_key_path, 'rb') as f:
            self.public_key = serialization.load_pem_public_key(
                f.read(),
                backend=default_backend()
            )
    
    def generate_token(self, persona_id: str, expires_in: int = 3600) -> str:
        payload = {
            'persona_id': persona_id,
            'iat': datetime.datetime.utcnow(),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=expires_in),
            'type': 'access'
        }
        return jwt.encode(payload, self.private_key, algorithm='RS256')
    
    def verify_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, self.public_key, algorithms=['RS256'])
            return payload
        except jwt.ExpiredSignatureError:
            raise Exception("Token expired")
        except jwt.InvalidTokenError:
            raise Exception("Invalid token")
```

### 5.2 Encryption/Decryption

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
import os
import base64

class EncryptionManager:
    def __init__(self, master_key: bytes):
        self.master_key = master_key
    
    def encrypt_data(self, data: str, associated_data: str = None) -> str:
        # Generate random nonce
        nonce = os.urandom(12)
        
        # Create cipher
        cipher = AESGCM(self.master_key)
        
        # Encrypt
        ciphertext = cipher.encrypt(
            nonce,
            data.encode(),
            associated_data.encode() if associated_data else None
        )
        
        # Return nonce + ciphertext as base64
        return base64.b64encode(nonce + ciphertext).decode()
    
    def decrypt_data(self, encrypted_data: str, associated_data: str = None) -> str:
        # Decode from base64
        data = base64.b64decode(encrypted_data)
        
        # Extract nonce and ciphertext
        nonce = data[:12]
        ciphertext = data[12:]
        
        # Create cipher
        cipher = AESGCM(self.master_key)
        
        # Decrypt
        plaintext = cipher.decrypt(
            nonce,
            ciphertext,
            associated_data.encode() if associated_data else None
        )
        
        return plaintext.decode()
```

### 5.3 Digital Signatures

```python
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
import base64

class SignatureManager:
    def __init__(self, private_key, public_key):
        self.private_key = private_key
        self.public_key = public_key
    
    def sign_data(self, data: str) -> str:
        signature = self.private_key.sign(
            data.encode(),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return base64.b64encode(signature).decode()
    
    def verify_signature(self, data: str, signature: str) -> bool:
        try:
            self.public_key.verify(
                base64.b64decode(signature),
                data.encode(),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except Exception:
            return False
```

---

## Implementierungs-Schritte

### 6.1 Phase 1: Setup (Woche 1-2)

**Schritt 1: Infrastruktur vorbereiten**
```bash
# Kubernetes Cluster
kubectl create namespace agentic-workspace
kubectl apply -f k8s/namespace.yaml

# PostgreSQL
helm install postgres bitnami/postgresql \
  --namespace agentic-workspace \
  --values postgres-values.yaml

# MongoDB
helm install mongodb bitnami/mongodb \
  --namespace agentic-workspace \
  --values mongodb-values.yaml

# Redis
helm install redis bitnami/redis \
  --namespace agentic-workspace
```

**Schritt 2: Datenbanken initialisieren**
```bash
# PostgreSQL
psql -h postgres-service -U postgres < schema.sql

# MongoDB
mongo < mongodb-init.js
```

**Schritt 3: Secrets konfigurieren**
```bash
kubectl create secret generic agentic-secrets \
  --from-literal=db-password=secure_password \
  --from-literal=jwt-secret=jwt_secret_key \
  --from-file=private-key.pem \
  --from-file=public-key.pem \
  -n agentic-workspace
```

### 6.2 Phase 2: Microservices (Woche 3-6)

**Schritt 1: Identity Service**
```bash
cd services/identity-service
npm install
npm run build
docker build -t identity-service:1.0 .
kubectl apply -f deployment.yaml
```

**Schritt 2: Access Control Service**
```bash
cd services/access-control-service
npm install
npm run build
docker build -t access-control-service:1.0 .
kubectl apply -f deployment.yaml
```

**Schritt 3: Weitere Services**
```bash
# Audit Service
cd services/audit-service && docker build -t audit-service:1.0 .

# Persona Manager
cd services/persona-manager && docker build -t persona-manager:1.0 .

# Policy Engine
cd services/policy-engine && docker build -t policy-engine:1.0 .

# Alle deployen
kubectl apply -f services/*/deployment.yaml
```

### 6.3 Phase 3: API Gateway (Woche 7)

```bash
cd services/api-gateway
npm install
npm run build
docker build -t api-gateway:1.0 .
kubectl apply -f deployment.yaml
```

---

## Code-Beispiele

### 7.1 Persona Creation Service (Node.js)

```javascript
const express = require('express');
const { v5: uuidv5 } = require('uuid');
const crypto = require('crypto');
const db = require('./db');
const auth = require('./auth');

const router = express.Router();

// POST /api/v1/personas
router.post('/personas', auth.verify, async (req, res) => {
  try {
    const {
      name,
      category,
      specialization_level,
      background,
      response_format,
      communication_style,
      capabilities,
      security_clearance
    } = req.body;

    // Validate input
    if (!name || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (specialization_level < 1 || specialization_level > 19) {
      return res.status(400).json({ error: 'Invalid specialization level' });
    }

    // Generate DID
    const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    const did = `did:example:persona:${uuidv5(name + Date.now(), namespace)}`;

    // Generate RSA key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    // Create persona
    const persona = {
      id: uuidv5(did, namespace),
      did,
      name,
      category,
      specialization_level,
      background,
      response_format,
      communication_style,
      capabilities: capabilities || [],
      public_key: publicKey,
      trust_level: 0.50,
      security_clearance: security_clearance || 'level-1',
      status: 'active',
      created_at: new Date(),
      created_by: req.user.persona_id,
      version: 1
    };

    // Save to database
    await db.query(
      `INSERT INTO personas (
        id, did, name, category, specialization_level,
        background, response_format, communication_style,
        public_key, trust_level, security_clearance,
        status, created_at, created_by, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        persona.id, persona.did, persona.name, persona.category,
        persona.specialization_level, persona.background,
        persona.response_format, persona.communication_style,
        persona.public_key, persona.trust_level, persona.security_clearance,
        persona.status, persona.created_at, persona.created_by, persona.version
      ]
    );

    // Log audit
    await logAudit({
      actor_id: req.user.persona_id,
      action: 'CREATE_PERSONA',
      resource_type: 'persona',
      resource_id: persona.id,
      status: 'success'
    });

    res.status(201).json({
      id: persona.id,
      did: persona.did,
      name: persona.name,
      category: persona.category,
      status: persona.status,
      created_at: persona.created_at
    });

  } catch (error) {
    console.error('Error creating persona:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

### 7.2 Access Control Check (Python)

```python
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import select
from datetime import datetime
import logging

app = FastAPI()
logger = logging.getLogger(__name__)

async def check_access(
    persona_id: str,
    resource: str,
    action: str,
    db_session
) -> dict:
    """
    Check if a persona has access to a resource
    """
    try:
        # Query capabilities
        query = select(Capability).where(
            (Capability.persona_id == persona_id) &
            (Capability.resource == resource) &
            (Capability.action == action) &
            (Capability.status == 'active')
        )
        
        capability = db_session.execute(query).first()
        
        if not capability:
            logger.warning(f"Access denied: No capability found for {persona_id}")
            return {
                'allowed': False,
                'reason': 'No capability found',
                'decision_id': str(uuid.uuid4())
            }
        
        # Check expiration
        if capability.expires_at and capability.expires_at < datetime.utcnow():
            logger.warning(f"Access denied: Capability expired for {persona_id}")
            return {
                'allowed': False,
                'reason': 'Capability expired',
                'decision_id': str(uuid.uuid4())
            }
        
        # Check conditions
        if capability.conditions:
            if not check_conditions(capability.conditions):
                logger.warning(f"Access denied: Conditions not met for {persona_id}")
                return {
                    'allowed': False,
                    'reason': 'Conditions not met',
                    'decision_id': str(uuid.uuid4())
                }
        
        # Log access
        await log_audit(
            actor_id=persona_id,
            action='ACCESS_CHECK',
            resource_type='capability',
            resource_id=capability.id,
            status='success'
        )
        
        return {
            'allowed': True,
            'reason': 'Capability found and valid',
            'decision_id': str(uuid.uuid4())
        }
        
    except Exception as e:
        logger.error(f"Error checking access: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/v1/access/check")
async def check_access_endpoint(
    request: AccessCheckRequest,
    db_session = Depends(get_db)
) -> dict:
    return await check_access(
        persona_id=request.persona_id,
        resource=request.resource,
        action=request.action,
        db_session=db_session
    )
```

### 7.3 Audit Logging (Python)

```python
from sqlalchemy.orm import Session
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

async def log_audit(
    actor_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    status: str,
    result_code: str = None,
    error_message: str = None,
    context: dict = None,
    changes: dict = None,
    db_session: Session = None
):
    """
    Log an audit event
    """
    try:
        audit_log = AuditLog(
            timestamp=datetime.utcnow(),
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            status=status,
            result_code=result_code,
            error_message=error_message,
            context=json.dumps(context) if context else None,
            changes=json.dumps(changes) if changes else None
        )
        
        db_session.add(audit_log)
        db_session.commit()
        
        logger.info(f"Audit logged: {action} on {resource_type} by {actor_id}")
        
        # Also log to blockchain (asynchronously)
        await log_to_blockchain(audit_log)
        
    except Exception as e:
        logger.error(f"Error logging audit: {e}")
        db_session.rollback()
        raise

async def log_to_blockchain(audit_log: AuditLog):
    """
    Log audit event to blockchain for immutability
    """
    try:
        # Serialize audit log
        log_data = {
            'id': str(audit_log.id),
            'timestamp': audit_log.timestamp.isoformat(),
            'actor_id': audit_log.actor_id,
            'action': audit_log.action,
            'resource_type': audit_log.resource_type,
            'resource_id': audit_log.resource_id,
            'status': audit_log.status
        }
        
        # Hash the data
        log_hash = hashlib.sha256(
            json.dumps(log_data).encode()
        ).hexdigest()
        
        # Submit to blockchain
        tx_hash = await blockchain_client.submit_transaction(
            method='log_audit',
            data=log_data,
            hash=log_hash
        )
        
        # Update audit log with blockchain reference
        audit_log.blockchain_hash = log_hash
        audit_log.blockchain_tx = tx_hash
        db_session.commit()
        
        logger.info(f"Audit logged to blockchain: {tx_hash}")
        
    except Exception as e:
        logger.error(f"Error logging to blockchain: {e}")
```

---

## Testing & Validierung

### 8.1 Unit Tests (Jest)

```javascript
const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('Persona API', () => {
  
  beforeAll(async () => {
    await db.connect();
  });
  
  afterAll(async () => {
    await db.disconnect();
  });
  
  describe('POST /api/v1/personas', () => {
    
    it('should create a new persona', async () => {
      const response = await request(app)
        .post('/api/v1/personas')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Test Persona',
          category: 'Entwickler',
          specialization_level: 15,
          background: 'Test background',
          response_format: 'Test format',
          communication_style: 'Direct',
          capabilities: ['test-capability'],
          security_clearance: 'level-3'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('did');
      expect(response.body.name).toBe('Test Persona');
    });
    
    it('should reject invalid specialization level', async () => {
      const response = await request(app)
        .post('/api/v1/personas')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Test Persona',
          category: 'Entwickler',
          specialization_level: 25, // Invalid
          background: 'Test background'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/personas')
        .send({
          name: 'Test Persona',
          category: 'Entwickler'
        });
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('GET /api/v1/personas/{id}', () => {
    
    it('should retrieve a persona', async () => {
      const response = await request(app)
        .get(`/api/v1/personas/${personaId}`)
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(personaId);
    });
    
    it('should return 404 for non-existent persona', async () => {
      const response = await request(app)
        .get('/api/v1/personas/non-existent-id')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(404);
    });
  });
});
```

### 8.2 Integration Tests (Pytest)

```python
import pytest
from httpx import AsyncClient
from app import app
from db import get_db

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def db_session():
    session = SessionLocal()
    yield session
    session.close()

@pytest.mark.asyncio
async def test_create_persona(client, db_session):
    response = await client.post(
        "/api/v1/personas",
        json={
            "name": "Test Persona",
            "category": "Entwickler",
            "specialization_level": 15,
            "background": "Test",
            "response_format": "Test",
            "communication_style": "Direct",
            "capabilities": ["test"],
            "security_clearance": "level-3"
        },
        headers={"Authorization": f"Bearer {valid_token}"}
    )
    
    assert response.status_code == 201
    assert response.json()["name"] == "Test Persona"

@pytest.mark.asyncio
async def test_access_control(client, db_session):
    response = await client.post(
        "/api/v1/access/check",
        json={
            "persona_id": "did:example:persona:001",
            "resource": "api:personas:read",
            "action": "read"
        },
        headers={"Authorization": f"Bearer {valid_token}"}
    )
    
    assert response.status_code == 200
    assert "allowed" in response.json()
```

---

## Deployment

### 9.1 Docker Deployment

```dockerfile
# Dockerfile für API Gateway
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
```

### 9.2 Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: agentic-workspace
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: api-gateway:1.0
        ports:
        - containerPort: 3000
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: agentic-secrets
              key: db-host
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: agentic-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
  namespace: agentic-workspace
spec:
  selector:
    app: api-gateway
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

## Troubleshooting

### 10.1 Häufige Fehler

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| `401 Unauthorized` | Ungültiger Token | Token erneuern oder neu anmelden |
| `403 Forbidden` | Keine Berechtigung | Capability prüfen oder Admin kontaktieren |
| `500 Internal Server Error` | Server-Fehler | Logs prüfen: `kubectl logs <pod-name>` |
| `Connection refused` | Service nicht erreichbar | Service Status prüfen: `kubectl get pods` |
| `Database connection error` | DB nicht erreichbar | DB-Verbindung prüfen: `kubectl port-forward postgres-0 5432:5432` |

### 10.2 Debugging

```bash
# Logs anschauen
kubectl logs -f deployment/api-gateway -n agentic-workspace

# Pod beschreiben
kubectl describe pod <pod-name> -n agentic-workspace

# Port forwarding
kubectl port-forward svc/api-gateway-service 3000:80 -n agentic-workspace

# Database-Verbindung testen
psql -h postgres-service -U postgres -d agentic_workspace

# Redis-Verbindung testen
redis-cli -h redis-service ping
```

---

**Dokument Ende**

*Technical Implementation Guide v1.0 - Januar 2026*  
*Für autonome KI-Agenten zur Programmierung der Agentic Workspace*
