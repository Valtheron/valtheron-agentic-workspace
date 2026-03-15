import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { generateToken, verifyToken, authMiddleware, optionalAuth } from '../middleware/auth.js';

// ── Token functions ───────────────────────────────────────────────────

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

// ── authMiddleware ────────────────────────────────────────────────────

describe('authMiddleware', () => {
  const app = express();
  app.use(express.json());
  app.get('/protected', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });

  it('returns 401 without Authorization header', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authorization token required');
  });

  it('returns 401 when Authorization is not Bearer format', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Basic abc123');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authorization token required');
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or expired token');
  });

  it('returns 401 with tampered token', async () => {
    const token = generateToken({ userId: '1', username: 'test', role: 'admin' });
    const tampered = token.slice(0, -5) + 'ZZZZZ';
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${tampered}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or expired token');
  });

  it('allows request with valid token and sets req.user', async () => {
    const token = generateToken({ userId: 'u42', username: 'alice', role: 'admin' });
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.userId).toBe('u42');
    expect(res.body.user.username).toBe('alice');
    expect(res.body.user.role).toBe('admin');
  });

  it('preserves all payload fields', async () => {
    const token = generateToken({ userId: 'u99', username: 'bob', role: 'viewer' });
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ userId: 'u99', username: 'bob', role: 'viewer' });
  });
});

// ── optionalAuth ──────────────────────────────────────────────────────

describe('optionalAuth', () => {
  const app = express();
  app.use(express.json());
  app.get('/optional', optionalAuth, (req, res) => {
    res.json({ user: req.user ?? null });
  });

  it('continues without user when no Authorization header', async () => {
    const res = await request(app).get('/optional');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('continues without user for non-Bearer Authorization', async () => {
    const res = await request(app).get('/optional').set('Authorization', 'Basic abc123');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('continues without user when token is invalid', async () => {
    const res = await request(app).get('/optional').set('Authorization', 'Bearer bad-token');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('sets req.user with a valid token', async () => {
    const token = generateToken({ userId: 'u2', username: 'carol', role: 'operator' });
    const res = await request(app).get('/optional').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.userId).toBe('u2');
    expect(res.body.user.username).toBe('carol');
  });

  it('returns 200 even with tampered token (skips auth silently)', async () => {
    const token = generateToken({ userId: '1', username: 'test', role: 'admin' });
    const tampered = token.slice(0, -3) + 'XYZ';
    const res = await request(app).get('/optional').set('Authorization', `Bearer ${tampered}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });
});
