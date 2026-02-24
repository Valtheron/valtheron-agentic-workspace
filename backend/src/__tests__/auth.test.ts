import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('Auth Endpoints', () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: 'securepassword123',
  };

  describe('POST /api/auth/register', () => {
    it('registers a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe(testUser.username);
      expect(res.body.user.role).toBe('operator');
    });

    it('rejects duplicate username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'onlyuser' });

      expect(res.status).toBe(400);
    });

    it('rejects short passwords', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newuser', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('6 characters');
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(testUser);

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe(testUser.username);
    });

    it('rejects invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: 'wrong' });

      expect(res.status).toBe(401);
    });

    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns user info with valid token', async () => {
      // First login to get a token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send(testUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe(testUser.username);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });
  });
});
