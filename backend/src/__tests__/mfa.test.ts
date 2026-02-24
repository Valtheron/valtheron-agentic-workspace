import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, initDatabase } from '../app.js';

const app = createApp();

describe('MFA Endpoints', () => {
  let token: string;
  let userId: string;

  // Register a test user and get a token
  it('should register a user for MFA testing', async () => {
    initDatabase();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'mfa_testuser', password: 'securepass123' });
    expect(res.status).toBe(200);
    token = res.body.token;
    userId = res.body.user.id;
    expect(token).toBeTruthy();
    expect(userId).toBeTruthy();
  });

  it('GET /api/auth/mfa/status — should return mfaEnabled false initially', async () => {
    const res = await request(app).get('/api/auth/mfa/status').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.mfaEnabled).toBe(false);
  });

  it('POST /api/auth/mfa/setup — should return secret, URI and backup codes', async () => {
    const res = await request(app).post('/api/auth/mfa/setup').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.secret).toBeTruthy();
    expect(res.body.uri).toContain('otpauth://totp/');
    expect(res.body.backupCodes).toHaveLength(10);
  });

  it('POST /api/auth/mfa/confirm — should reject invalid code', async () => {
    const res = await request(app)
      .post('/api/auth/mfa/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid TOTP code');
  });

  it('POST /api/auth/mfa/setup — should reject without auth', async () => {
    const res = await request(app).post('/api/auth/mfa/setup');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/mfa/verify — should reject invalid userId', async () => {
    const res = await request(app).post('/api/auth/mfa/verify').send({ userId: 'nonexistent', code: '123456' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/mfa/disable — should reject when MFA not enabled', async () => {
    const res = await request(app)
      .post('/api/auth/mfa/disable')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('not enabled');
  });
});
