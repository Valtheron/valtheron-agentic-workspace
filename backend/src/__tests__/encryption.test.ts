import { describe, it, expect, beforeEach } from 'vitest';
import {
  encrypt,
  decrypt,
  hmacHash,
  setSecret,
  getSecret,
  rotateSecret,
  listSecrets,
  deleteSecret,
  generateKey,
} from '../services/encryption.js';

describe('Encryption Service', () => {
  it('should encrypt and decrypt a string', () => {
    const plaintext = 'Hello, Valtheron!';
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertexts for same plaintext (random IV)', () => {
    const plaintext = 'same-text';
    const e1 = encrypt(plaintext);
    const e2 = encrypt(plaintext);
    expect(e1).not.toBe(e2);
    expect(decrypt(e1)).toBe(plaintext);
    expect(decrypt(e2)).toBe(plaintext);
  });

  it('should fail to decrypt with tampered data', () => {
    const encrypted = encrypt('secret-data');
    const buf = Buffer.from(encrypted, 'base64');
    buf[buf.length - 1] ^= 0xff; // flip a byte
    expect(() => decrypt(buf.toString('base64'))).toThrow();
  });

  it('should produce consistent HMAC hashes', () => {
    const h1 = hmacHash('test-value');
    const h2 = hmacHash('test-value');
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64); // hex SHA-256
  });

  it('should generate a valid key', () => {
    const key = generateKey();
    const buf = Buffer.from(key, 'base64');
    expect(buf.length).toBe(32); // 256 bits
  });
});

describe('Secrets Vault', () => {
  beforeEach(() => {
    // Clear secrets between tests
    for (const s of listSecrets()) {
      deleteSecret(s.name);
    }
  });

  it('should store and retrieve a secret', () => {
    setSecret('db-password', 'super-secret-123');
    const value = getSecret('db-password');
    expect(value).toBe('super-secret-123');
  });

  it('should return null for unknown secret', () => {
    expect(getSecret('nonexistent')).toBeNull();
  });

  it('should list secrets without values', () => {
    setSecret('key1', 'val1');
    setSecret('key2', 'val2');
    const list = listSecrets();
    expect(list).toHaveLength(2);
    expect(list.map((s) => s.name).sort()).toEqual(['key1', 'key2']);
    // Should not contain the actual value
    expect(list[0]).not.toHaveProperty('encryptedValue');
    expect(list[0]).not.toHaveProperty('value');
  });

  it('should rotate a secret', () => {
    setSecret('api-key', 'old-value');
    const rotated = rotateSecret('api-key', 'new-value');
    expect(rotated).not.toBeNull();
    expect(rotated!.rotatedAt).toBeTruthy();
    expect(getSecret('api-key')).toBe('new-value');
  });

  it('should delete a secret', () => {
    setSecret('temp', 'data');
    expect(deleteSecret('temp')).toBe(true);
    expect(getSecret('temp')).toBeNull();
    expect(deleteSecret('temp')).toBe(false);
  });
});
