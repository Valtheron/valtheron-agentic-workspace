import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken } from '../middleware/auth.js';

describe('Auth Token Functions', () => {
  it('generateToken creates a valid JWT', () => {
    const token = generateToken({ userId: '123', username: 'testuser', role: 'admin' });
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  });

  it('verifyToken decodes a valid token', () => {
    const token = generateToken({ userId: 'u1', username: 'alice', role: 'operator' });
    const payload = verifyToken(token);
    expect(payload.userId).toBe('u1');
    expect(payload.username).toBe('alice');
    expect(payload.role).toBe('operator');
  });

  it('verifyToken throws for invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow();
  });

  it('verifyToken throws for tampered token', () => {
    const token = generateToken({ userId: '123', username: 'test', role: 'admin' });
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(() => verifyToken(tampered)).toThrow();
  });
});
