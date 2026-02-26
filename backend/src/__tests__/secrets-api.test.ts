import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, initDatabase } from '../app.js';

const app = createApp();

describe('Secrets API Endpoints', () => {
  let token: string;

  it('should initialize DB and get admin token', async () => {
    initDatabase();
    // Register an admin user for auth
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'secrets_admin', password: 'testpass123', role: 'admin' });
    token = res.body.token;
    expect(token).toBeTruthy();
  });

  // POST /api/secrets
  it('POST /api/secrets — stores a new secret', async () => {
    const res = await request(app)
      .post('/api/secrets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'db-password', value: 'super-secret-123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.name).toBe('db-password');
  });

  it('POST /api/secrets — rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/secrets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'incomplete' });
    expect(res.status).toBe(400);
  });

  // GET /api/secrets
  it('GET /api/secrets — lists secrets (names only)', async () => {
    const res = await request(app).get('/api/secrets').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.secrets).toBeInstanceOf(Array);
    expect(res.body.secrets.length).toBeGreaterThanOrEqual(1);
    expect(res.body.secrets[0].name).toBe('db-password');
    // Should not contain actual value in list
    expect(res.body.secrets[0]).not.toHaveProperty('value');
  });

  // GET /api/secrets/:name
  it('GET /api/secrets/:name — retrieves a secret value', async () => {
    const res = await request(app).get('/api/secrets/db-password').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.value).toBe('super-secret-123');
  });

  it('GET /api/secrets/:name — returns 404 for nonexistent', async () => {
    const res = await request(app).get('/api/secrets/nonexistent').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  // PUT /api/secrets/:name
  it('PUT /api/secrets/:name — rotates a secret', async () => {
    const res = await request(app)
      .put('/api/secrets/db-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ value: 'new-secret-value' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.rotatedAt).toBeTruthy();
  });

  it('PUT /api/secrets/:name — verifies rotated value', async () => {
    const res = await request(app).get('/api/secrets/db-password').set('Authorization', `Bearer ${token}`);
    expect(res.body.value).toBe('new-secret-value');
  });

  it('PUT /api/secrets/:name — returns 404 for nonexistent', async () => {
    const res = await request(app)
      .put('/api/secrets/nonexistent')
      .set('Authorization', `Bearer ${token}`)
      .send({ value: 'x' });
    expect(res.status).toBe(404);
  });

  // POST /api/secrets/generate-key
  it('POST /api/secrets/generate-key — generates a random key', async () => {
    const res = await request(app).post('/api/secrets/generate-key').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.key).toBeTruthy();
    const buf = Buffer.from(res.body.key, 'base64');
    expect(buf.length).toBe(32);
  });

  // DELETE /api/secrets/:name
  it('DELETE /api/secrets/:name — deletes a secret', async () => {
    const res = await request(app).delete('/api/secrets/db-password').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/secrets/:name — returns 404 for already deleted', async () => {
    const res = await request(app).delete('/api/secrets/db-password').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  // In dev/test mode, adminGuard = optionalAuth, so all users can access
  it('GET /api/secrets — accessible in dev mode without admin role', async () => {
    const res = await request(app).get('/api/secrets');
    expect(res.status).toBe(200);
  });
});
