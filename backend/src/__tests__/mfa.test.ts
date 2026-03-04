import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, initDatabase } from '../app.js';
import * as OTPAuth from 'otpauth';

const app = createApp();

describe('MFA Endpoints', () => {
  let token: string;
  let userId: string;
  let mfaSecret: string;
  let backupCodes: string[];

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
    mfaSecret = res.body.secret;
    backupCodes = res.body.backupCodes;
  });

  it('POST /api/auth/mfa/confirm — should reject missing code', async () => {
    const res = await request(app).post('/api/auth/mfa/confirm').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('code is required');
  });

  it('POST /api/auth/mfa/confirm — should reject invalid code', async () => {
    const res = await request(app)
      .post('/api/auth/mfa/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid TOTP code');
  });

  it('POST /api/auth/mfa/confirm — should accept valid TOTP code and enable MFA', async () => {
    // Generate a valid TOTP code from the secret
    const totp = new OTPAuth.TOTP({
      issuer: 'Valtheron',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(mfaSecret),
    });
    const validCode = totp.generate();

    const res = await request(app)
      .post('/api/auth/mfa/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: validCode });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/auth/mfa/status — should return mfaEnabled true', async () => {
    const res = await request(app).get('/api/auth/mfa/status').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.mfaEnabled).toBe(true);
  });

  it('POST /api/auth/mfa/setup — should reject when MFA already enabled', async () => {
    const res = await request(app).post('/api/auth/mfa/setup').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
  });

  // Login flow with MFA
  it('POST /api/auth/login — should return mfaRequired when MFA enabled', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'mfa_testuser', password: 'securepass123' });
    expect(res.status).toBe(200);
    expect(res.body.mfaRequired).toBe(true);
    expect(res.body.userId).toBeTruthy();
  });

  // Verify with TOTP code
  it('POST /api/auth/mfa/verify — should accept valid TOTP', async () => {
    const totp = new OTPAuth.TOTP({
      issuer: 'Valtheron',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(mfaSecret),
    });
    const validCode = totp.generate();

    const res = await request(app).post('/api/auth/mfa/verify').send({ userId, code: validCode });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.username).toBe('mfa_testuser');
  });

  // Verify with invalid code
  it('POST /api/auth/mfa/verify — should reject invalid code', async () => {
    const res = await request(app).post('/api/auth/mfa/verify').send({ userId, code: '999999' });
    expect(res.status).toBe(401);
  });

  // Verify with backup code
  it('POST /api/auth/mfa/verify — should accept valid backup code', async () => {
    const res = await request(app).post('/api/auth/mfa/verify').send({ userId, backupCode: backupCodes[0] });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  // Verify missing params
  it('POST /api/auth/mfa/verify — should reject missing userId', async () => {
    const res = await request(app).post('/api/auth/mfa/verify').send({ code: '123456' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/mfa/verify — should reject missing code and backupCode', async () => {
    const res = await request(app).post('/api/auth/mfa/verify').send({ userId });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/mfa/verify — should reject nonexistent userId', async () => {
    const res = await request(app).post('/api/auth/mfa/verify').send({ userId: 'nonexistent', code: '123456' });
    expect(res.status).toBe(400);
  });

  // Disable MFA
  it('POST /api/auth/mfa/disable — should reject missing code', async () => {
    const res = await request(app).post('/api/auth/mfa/disable').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/mfa/disable — should reject invalid code', async () => {
    const res = await request(app)
      .post('/api/auth/mfa/disable')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/mfa/disable — should accept valid TOTP and disable', async () => {
    const totp = new OTPAuth.TOTP({
      issuer: 'Valtheron',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(mfaSecret),
    });
    const validCode = totp.generate();

    const res = await request(app)
      .post('/api/auth/mfa/disable')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: validCode });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/auth/mfa/disable — should reject when MFA not enabled', async () => {
    const res = await request(app)
      .post('/api/auth/mfa/disable')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('not enabled');
  });

  it('POST /api/auth/mfa/confirm — should reject when no pending setup', async () => {
    const res = await request(app)
      .post('/api/auth/mfa/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('No pending MFA setup');
  });

  // Unauthenticated requests
  it('POST /api/auth/mfa/setup — should reject without auth', async () => {
    const res = await request(app).post('/api/auth/mfa/setup');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/mfa/confirm — should reject without auth', async () => {
    const res = await request(app).post('/api/auth/mfa/confirm').send({ code: '123456' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/mfa/disable — should reject without auth', async () => {
    const res = await request(app).post('/api/auth/mfa/disable').send({ code: '123456' });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/mfa/status — should reject without auth', async () => {
    const res = await request(app).get('/api/auth/mfa/status');
    expect(res.status).toBe(401);
  });
});
