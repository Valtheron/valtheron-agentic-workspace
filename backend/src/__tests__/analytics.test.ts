import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, initDatabase } from '../app.js';

const app = createApp();

describe('Analytics Endpoints', () => {
  it('should initialize DB', () => {
    initDatabase();
  });

  // GET /api/analytics/dashboard
  it('GET /api/analytics/dashboard — returns dashboard metrics', async () => {
    const res = await request(app).get('/api/analytics/dashboard');
    expect(res.status).toBe(200);
    expect(typeof res.body.totalAgents).toBe('number');
    expect(typeof res.body.activeAgents).toBe('number');
    expect(typeof res.body.successRate).toBe('number');
    expect(typeof res.body.avgResponseTime).toBe('number');
    expect(res.body.tasksTrend).toBeInstanceOf(Array);
    expect(res.body.categoryDistribution).toBeInstanceOf(Array);
    expect(res.body.topPerformers).toBeInstanceOf(Array);
  });

  // GET /api/analytics/dashboard — cache hit
  it('GET /api/analytics/dashboard — returns cached response on second call', async () => {
    const res1 = await request(app).get('/api/analytics/dashboard');
    const res2 = await request(app).get('/api/analytics/dashboard');
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    // Both should return the same data
    expect(res1.body.totalAgents).toBe(res2.body.totalAgents);
  });

  // GET /api/analytics/performance
  it('GET /api/analytics/performance — returns performance trends', async () => {
    const res = await request(app).get('/api/analytics/performance');
    expect(res.status).toBe(200);
    expect(res.body.trends).toBeInstanceOf(Array);
  });

  // GET /api/analytics/sla
  it('GET /api/analytics/sla — returns SLA metrics', async () => {
    const res = await request(app).get('/api/analytics/sla');
    expect(res.status).toBe(200);
    expect(res.body.slaMetrics).toBeInstanceOf(Array);
  });

  // GET /api/analytics/agents/:id
  it('GET /api/analytics/agents/:id — returns agent analytics', async () => {
    // Get an agent first
    const agentsRes = await request(app).get('/api/agents?limit=1');
    const agentId = agentsRes.body.agents[0]?.id;
    if (!agentId) return; // skip if no agents

    const res = await request(app).get(`/api/analytics/agents/${agentId}`);
    expect(res.status).toBe(200);
    expect(res.body.agent).toBeTruthy();
  });

  it('GET /api/analytics/agents/:id — returns 404 for nonexistent', async () => {
    const res = await request(app).get('/api/analytics/agents/nonexistent-id');
    expect(res.status).toBe(404);
  });

  // GET /api/analytics/export
  it('GET /api/analytics/export — exports agents data as JSON', async () => {
    const res = await request(app).get('/api/analytics/export?type=agents&format=json');
    expect(res.status).toBe(200);
  });

  it('GET /api/analytics/export — exports tasks data as CSV', async () => {
    const res = await request(app).get('/api/analytics/export?type=tasks&format=csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });

  it('GET /api/analytics/export — exports metrics data', async () => {
    const res = await request(app).get('/api/analytics/export?type=metrics&format=json');
    expect(res.status).toBe(200);
  });

  it('GET /api/analytics/export — exports audit data', async () => {
    const res = await request(app).get('/api/analytics/export?type=audit&format=json');
    expect(res.status).toBe(200);
  });
});
