// Encryption Service — Phase 4 Security
// Provides AES-256-GCM encryption for sensitive data fields and a simple secrets vault.

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const TAG_LENGTH = 16;
const ENCODING: BufferEncoding = 'base64';

/** Derive a 256-bit key from a passphrase using scrypt. */
export function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.scryptSync(passphrase, salt, 32);
}

/** Get (or derive) the master encryption key from the environment. */
function getMasterKey(): Buffer {
  const envKey = process.env.VALTHERON_ENCRYPTION_KEY;
  if (envKey && Buffer.from(envKey, 'base64').length === 32) {
    return Buffer.from(envKey, 'base64');
  }
  // In dev, derive from a fixed passphrase + salt (NOT secure for production)
  const passphrase = envKey || 'valtheron-dev-key-change-in-production';
  const salt = Buffer.from('valtheron-salt-v1');
  return deriveKey(passphrase, salt);
}

/**
 * Encrypt a plaintext string.
 * Returns a base64 string: iv + authTag + ciphertext
 */
export function encrypt(plaintext: string, key?: Buffer): string {
  const k = key ?? getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, k, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Pack: iv (12) + tag (16) + ciphertext
  return Buffer.concat([iv, tag, encrypted]).toString(ENCODING);
}

/**
 * Decrypt a base64-encoded ciphertext produced by `encrypt`.
 */
export function decrypt(encoded: string, key?: Buffer): string {
  const k = key ?? getMasterKey();
  const buf = Buffer.from(encoded, ENCODING);

  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, k, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * Hash a value with HMAC-SHA256 for integrity checking.
 */
export function hmacHash(value: string, key?: Buffer): string {
  const k = key ?? getMasterKey();
  return crypto.createHmac('sha256', k).update(value).digest('hex');
}

// ---- Secrets Vault (in-memory + DB backed) ----

interface SecretEntry {
  name: string;
  encryptedValue: string;
  createdAt: string;
  rotatedAt: string | null;
}

const secretsCache = new Map<string, SecretEntry>();

/** Store a secret (encrypts the value before caching). */
export function setSecret(name: string, value: string): SecretEntry {
  const entry: SecretEntry = {
    name,
    encryptedValue: encrypt(value),
    createdAt: new Date().toISOString(),
    rotatedAt: null,
  };
  secretsCache.set(name, entry);
  return entry;
}

/** Retrieve and decrypt a secret by name. Returns null if not found. */
export function getSecret(name: string): string | null {
  const entry = secretsCache.get(name);
  if (!entry) return null;
  return decrypt(entry.encryptedValue);
}

/** Rotate a secret's value — keeps the old creation date, updates rotatedAt. */
export function rotateSecret(name: string, newValue: string): SecretEntry | null {
  const existing = secretsCache.get(name);
  if (!existing) return null;
  const entry: SecretEntry = {
    ...existing,
    encryptedValue: encrypt(newValue),
    rotatedAt: new Date().toISOString(),
  };
  secretsCache.set(name, entry);
  return entry;
}

/** List all secret names (without values). */
export function listSecrets(): Array<{ name: string; createdAt: string; rotatedAt: string | null }> {
  return [...secretsCache.values()].map(({ name, createdAt, rotatedAt }) => ({
    name,
    createdAt,
    rotatedAt,
  }));
}

/** Delete a secret. */
export function deleteSecret(name: string): boolean {
  return secretsCache.delete(name);
}

/** Generate a random encryption key (for key rotation). */
export function generateKey(): string {
  return crypto.randomBytes(32).toString('base64');
}
