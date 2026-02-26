import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, initDatabase } from '../app.js';

const app = createApp();

describe('Security Endpoints', () => {
  let eventId: string;

  it('should initialize DB', () => {
    initDatabase();
  });

  // === Security Events ===

  describe('Security Events', () => {
    it('GET /api/security/events — returns events list', async () => {
      const res = await request(app).get('/api/security/events');
      expect(res.status).toBe(200);
      expect(res.body.events).toBeInstanceOf(Array);
    });

    it('POST /api/security/events — creates a security event', async () => {
      const res = await request(app).post('/api/security/events').send({
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
      const res = await request(app).post('/api/security/events').send({ type: 'test' });
      expect(res.status).toBe(400);
    });

    it('GET /api/security/events — supports severity filter', async () => {
      const res = await request(app).get('/api/security/events?severity=high');
      expect(res.status).toBe(200);
      expect(res.body.events.every((e: { severity: string }) => e.severity === 'high')).toBe(true);
    });

    it('PATCH /api/security/events/:id/resolve — resolves an event', async () => {
      const res = await request(app).patch(`/api/security/events/${eventId}/resolve`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('PATCH /api/security/events/:id/resolve — returns 404 for nonexistent', async () => {
      const res = await request(app).patch('/api/security/events/nonexistent/resolve');
      expect(res.status).toBe(404);
    });
  });

  // === Kill Switch ===

  describe('Kill Switch', () => {
    it('GET /api/security/kill-switch — returns kill-switch status', async () => {
      const res = await request(app).get('/api/security/kill-switch');
      expect(res.status).toBe(200);
      expect(typeof res.body.armed).toBe('boolean');
    });

    it('POST /api/security/kill-switch/arm — arms the kill switch', async () => {
      const res = await request(app).post('/api/security/kill-switch/arm').send({ reason: 'Test arming' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.armed).toBe(true);
      expect(typeof res.body.suspendedAgents).toBe('number');
    });

    it('POST /api/security/kill-switch/disarm — disarms the kill switch', async () => {
      const res = await request(app).post('/api/security/kill-switch/disarm');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.armed).toBe(false);
    });
  });

  // === Auto-Trigger Rules ===

  describe('Auto-Trigger Rules', () => {
    it('GET /api/security/kill-switch/auto-trigger-rules — returns rules', async () => {
      const res = await request(app).get('/api/security/kill-switch/auto-trigger-rules');
      expect(res.status).toBe(200);
      expect(res.body.rules).toBeInstanceOf(Array);
    });

    it('PUT /api/security/kill-switch/auto-trigger-rules — updates rules', async () => {
      const res = await request(app)
        .put('/api/security/kill-switch/auto-trigger-rules')
        .send({
          rules: [{ id: 'rule1', name: 'High error rate', metric: 'errorRate', threshold: 50, enabled: true }],
        });
      expect(res.status).toBe(200);
      expect(res.body.rules).toHaveLength(1);
    });

    it('PUT /api/security/kill-switch/auto-trigger-rules — rejects non-array', async () => {
      const res = await request(app).put('/api/security/kill-switch/auto-trigger-rules').send({ rules: 'not-array' });
      expect(res.status).toBe(400);
    });
  });

  // === Audit Log ===

  describe('Audit Log', () => {
    it('GET /api/security/audit — returns audit entries', async () => {
      const res = await request(app).get('/api/security/audit');
      expect(res.status).toBe(200);
      expect(res.body.entries).toBeInstanceOf(Array);
    });

    it('POST /api/security/audit — creates an audit entry', async () => {
      const res = await request(app).post('/api/security/audit').send({
        agentId: 'agent-1',
        action: 'test_action',
        details: 'Test audit entry',
        riskLevel: 'info',
      });
      expect(res.status).toBe(201);
      expect(res.body.action).toBe('test_action');
    });

    it('POST /api/security/audit — rejects missing fields', async () => {
      const res = await request(app).post('/api/security/audit').send({ action: 'test' });
      expect(res.status).toBe(400);
    });

    it('GET /api/security/audit — supports riskLevel filter', async () => {
      const res = await request(app).get('/api/security/audit?riskLevel=info');
      expect(res.status).toBe(200);
      expect(res.body.entries).toBeInstanceOf(Array);
    });

    it('GET /api/security/audit/export — returns CSV', async () => {
      const res = await request(app).get('/api/security/audit/export');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });
  });
});
