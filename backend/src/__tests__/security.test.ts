import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp, initDatabase } from '../app.js';

const app = createApp();

// Admin auth header reused on every call. The Block-A D-17 fix removed the
// dev/test bypass, so security endpoints now always require an admin token —
// even when NODE_ENV=test. A single shared bearer header keeps the suite
// readable without sprinkling .set('Authorization', …) on every request.
let adminAuth = '';

describe('Security Endpoints', () => {
  let eventId: string;

  beforeAll(async () => {
    initDatabase();
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ username: 'security_admin', password: 'testpass123', role: 'admin' });
    adminAuth = `Bearer ${reg.body.token}`;
  });

  // === Security Events ===

  describe('Security Events', () => {
    it('GET /api/security/events — returns events list', async () => {
      const res = await request(app).get('/api/security/events').set('Authorization', adminAuth);
      expect(res.status).toBe(200);
      expect(res.body.events).toBeInstanceOf(Array);
    });

    it('POST /api/security/events — creates a security event', async () => {
      const res = await request(app).post('/api/security/events').set('Authorization', adminAuth).send({
        type: 'unauthorized_access',
        severity: 'high',
        message: 'Unauthorized access attempt detected',
      });
      expect(res.status).toBe(201);
      expect(res.body.type).toBe('unauthorized_access');
      expect(res.body.id).toBeTruthy();
      eventId = res.body.id;
    });

    it('POST /api/security/events — rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/security/events')
        .set('Authorization', adminAuth)
        .send({ type: 'test' });
      expect(res.status).toBe(400);
    });

    it('GET /api/security/events — supports severity filter', async () => {
      const res = await request(app).get('/api/security/events?severity=high').set('Authorization', adminAuth);
      expect(res.status).toBe(200);
      expect(res.body.events.every((e: { severity: string }) => e.severity === 'high')).toBe(true);
    });

    it('PATCH /api/security/events/:id/resolve — resolves an event', async () => {
      const res = await request(app).patch(`/api/security/events/${eventId}/resolve`).set('Authorization', adminAuth);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('PATCH /api/security/events/:id/resolve — returns 404 for nonexistent', async () => {
      const res = await request(app).patch('/api/security/events/nonexistent/resolve').set('Authorization', adminAuth);
      expect(res.status).toBe(404);
    });

    it('GET /api/security/events — rejects requests without auth (D-17)', async () => {
      const res = await request(app).get('/api/security/events');
      expect(res.status).toBe(401);
    });
  });

  // === Kill Switch ===

  describe('Kill Switch', () => {
    it('GET /api/security/kill-switch — returns kill-switch status', async () => {
      const res = await request(app).get('/api/security/kill-switch').set('Authorization', adminAuth);
      expect(res.status).toBe(200);
      expect(typeof res.body.aktiv).toBe('boolean');
    });

    it('POST /api/security/kill-switch/aktivieren — aktiviert den kill switch', async () => {
      const res = await request(app)
        .post('/api/security/kill-switch/aktivieren')
        .set('Authorization', adminAuth)
        .send({ reason: 'Test aktivierung' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.aktiv).toBe(true);
      expect(typeof res.body.suspendedAgents).toBe('number');
    });

    it('POST /api/security/kill-switch/deaktivieren — deaktiviert den kill switch', async () => {
      const res = await request(app).post('/api/security/kill-switch/deaktivieren').set('Authorization', adminAuth);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.aktiv).toBe(false);
    });
  });

  // === Auto-Trigger Rules ===

  describe('Auto-Trigger Rules', () => {
    it('GET /api/security/kill-switch/auto-trigger-rules — returns rules', async () => {
      const res = await request(app)
        .get('/api/security/kill-switch/auto-trigger-rules')
        .set('Authorization', adminAuth);
      expect(res.status).toBe(200);
      expect(res.body.rules).toBeInstanceOf(Array);
    });

    it('PUT /api/security/kill-switch/auto-trigger-rules — updates rules', async () => {
      const res = await request(app)
        .put('/api/security/kill-switch/auto-trigger-rules')
        .set('Authorization', adminAuth)
        .send({
          rules: [{ id: 'rule1', name: 'High error rate', metric: 'errorRate', threshold: 50, enabled: true }],
        });
      expect(res.status).toBe(200);
      expect(res.body.rules).toHaveLength(1);
    });

    it('PUT /api/security/kill-switch/auto-trigger-rules — rejects non-array', async () => {
      const res = await request(app)
        .put('/api/security/kill-switch/auto-trigger-rules')
        .set('Authorization', adminAuth)
        .send({ rules: 'not-array' });
      expect(res.status).toBe(400);
    });
  });

  // === Audit Log ===

  describe('Audit Log', () => {
    it('GET /api/security/audit — returns audit entries', async () => {
      const res = await request(app).get('/api/security/audit').set('Authorization', adminAuth);
      expect(res.status).toBe(200);
      expect(res.body.entries).toBeInstanceOf(Array);
    });

    it('POST /api/security/audit — creates an audit entry', async () => {
      const res = await request(app).post('/api/security/audit').set('Authorization', adminAuth).send({
        agentId: 'agent-1',
        action: 'test_action',
        details: 'Test audit entry',
        riskLevel: 'info',
      });
      expect(res.status).toBe(201);
      expect(res.body.action).toBe('test_action');
    });

    it('POST /api/security/audit — rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/security/audit')
        .set('Authorization', adminAuth)
        .send({ action: 'test' });
      expect(res.status).toBe(400);
    });

    it('GET /api/security/audit — supports riskLevel filter', async () => {
      const res = await request(app).get('/api/security/audit?riskLevel=info').set('Authorization', adminAuth);
      expect(res.status).toBe(200);
      expect(res.body.entries).toBeInstanceOf(Array);
    });

    it('GET /api/security/audit/export — returns CSV', async () => {
      const res = await request(app).get('/api/security/audit/export').set('Authorization', adminAuth);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });
  });
});
