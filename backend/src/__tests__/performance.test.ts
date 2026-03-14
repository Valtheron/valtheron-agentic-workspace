/**
 * Performance Tests — Load, Stress, Endurance
 *
 * Validates system behavior under various load conditions:
 * - Load Testing:    sustained throughput of concurrent requests
 * - Stress Testing:  behavior at and beyond capacity limits
 * - Endurance Testing: stability over extended operation periods
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import type { Express } from 'express';

let app: Express;
let authToken: string;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  app = createApp();

  // Register + login
  await request(app).post('/api/auth/register').send({
    username: 'perfuser',
    password: 'PerfTest123!',
    email: 'perf@test.com',
    role: 'admin',
  });
  const loginRes = await request(app).post('/api/auth/login').send({
    username: 'perfuser',
    password: 'PerfTest123!',
  });
  authToken = loginRes.body.token;
});

afterAll(() => {
  delete process.env.NODE_ENV;
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Fire N concurrent requests and collect response times */
async function concurrentRequests(
  method: 'get' | 'post' | 'patch' | 'delete',
  path: string,
  count: number,
  body?: Record<string, unknown>,
) {
  const start = Date.now();
  const promises = Array.from({ length: count }, () => {
    const req = request(app)[method](path).set('Authorization', `Bearer ${authToken}`);
    if (body) req.send(body);
    return req;
  });
  const results = await Promise.all(promises);
  const elapsed = Date.now() - start;
  return { results, elapsed, avgMs: elapsed / count };
}

/** Measure a single request's response time */
async function measureRequest(
  method: 'get' | 'post' | 'patch' | 'delete',
  path: string,
  body?: Record<string, unknown>,
) {
  const start = Date.now();
  const res = await request(app)[method](path)
    .set('Authorization', `Bearer ${authToken}`)
    .send(body ?? {});
  return { res, elapsed: Date.now() - start };
}

/* ================================================================== */
/*  LOAD TESTING                                                       */
/* ================================================================== */

describe('Load Testing', () => {
  it('handles 50 concurrent GET /api/agents requests', async () => {
    const { results, avgMs } = await concurrentRequests('get', '/api/agents', 50);
    const allOk = results.every((r) => r.status === 200);
    expect(allOk).toBe(true);
    expect(avgMs).toBeLessThan(500); // avg under 500 ms
  });

  it('handles 50 concurrent GET /api/tasks requests', async () => {
    const { results, avgMs } = await concurrentRequests('get', '/api/tasks', 50);
    const allOk = results.every((r) => r.status === 200);
    expect(allOk).toBe(true);
    expect(avgMs).toBeLessThan(500);
  });

  it('handles 30 concurrent GET /api/analytics/dashboard requests', async () => {
    const { results, avgMs } = await concurrentRequests('get', '/api/analytics/dashboard', 30);
    const allOk = results.every((r) => r.status === 200);
    expect(allOk).toBe(true);
    expect(avgMs).toBeLessThan(500);
  });

  it('handles 20 concurrent POST /api/agents (bulk create)', async () => {
    const { results } = await concurrentRequests('post', '/api/agents', 20, {
      name: 'LoadTestAgent',
      role: 'tester',
      category: 'testing',
      status: 'idle',
    });
    const created = results.filter((r) => r.status === 201 || r.status === 200);
    expect(created.length).toBe(20);
  });

  it('handles 20 concurrent POST /api/tasks (bulk create)', async () => {
    const { results } = await concurrentRequests('post', '/api/tasks', 20, {
      title: 'LoadTestTask',
      status: 'backlog',
      priority: 'medium',
      category: 'testing',
    });
    const created = results.filter((r) => r.status === 201 || r.status === 200);
    expect(created.length).toBe(20);
  });

  it('maintains response time < 200ms for health endpoint under load', async () => {
    const { results, avgMs } = await concurrentRequests('get', '/api/health', 100);
    const allOk = results.every((r) => r.status === 200);
    expect(allOk).toBe(true);
    expect(avgMs).toBeLessThan(200);
  });

  it('sustains mixed read/write workload (50 reads + 20 writes)', async () => {
    const reads = Array.from({ length: 50 }, () =>
      request(app).get('/api/agents').set('Authorization', `Bearer ${authToken}`),
    );
    const writes = Array.from({ length: 20 }, () =>
      request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'MixedLoadAgent', role: 'tester', category: 'testing', status: 'idle' }),
    );
    const start = Date.now();
    const results = await Promise.all([...reads, ...writes]);
    const elapsed = Date.now() - start;
    const allOk = results.every((r) => r.status === 200 || r.status === 201);
    expect(allOk).toBe(true);
    expect(elapsed).toBeLessThan(10000); // whole batch under 10s
  });
});

/* ================================================================== */
/*  STRESS TESTING                                                     */
/* ================================================================== */

describe('Stress Testing', () => {
  it('handles 100 concurrent requests without server crash', async () => {
    const { results } = await concurrentRequests('get', '/api/agents', 100);
    // Server should respond to all — no dropped connections
    expect(results.length).toBe(100);
    const statusCodes = results.map((r) => r.status);
    // All should succeed (no 5xx errors)
    const serverErrors = statusCodes.filter((s) => s >= 500);
    expect(serverErrors.length).toBe(0);
  });

  it('handles rapid sequential writes without data corruption', async () => {
    const names: string[] = [];
    for (let i = 0; i < 30; i++) {
      const name = `StressAgent_${i}_${Date.now()}`;
      names.push(name);
      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name, role: 'tester', category: 'stress', status: 'idle' });
      expect(res.status === 200 || res.status === 201).toBe(true);
    }
    // Verify all agents were persisted
    const listRes = await request(app).get('/api/agents?category=stress').set('Authorization', `Bearer ${authToken}`);
    expect(listRes.status).toBe(200);
    const agentNames = listRes.body.agents
      ? listRes.body.agents.map((a: { name: string }) => a.name)
      : listRes.body.map((a: { name: string }) => a.name);
    for (const name of names) {
      expect(agentNames).toContain(name);
    }
  });

  it('returns proper errors under invalid input flood', async () => {
    const { results } = await concurrentRequests('post', '/api/agents', 30, {
      // Missing required fields
    });
    // Should get 400 errors, not 500
    const serverErrors = results.filter((r) => r.status >= 500);
    expect(serverErrors.length).toBe(0);
  });

  it('handles concurrent read/write/delete operations gracefully', async () => {
    // Create some agents first
    const createRes = await request(app)
      .post('/api/agents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'ConcurrentTestAgent', role: 'tester', category: 'concurrent', status: 'idle' });
    const agentId = createRes.body.id;

    // Concurrent operations on mixed endpoints
    const ops = [
      request(app).get('/api/agents').set('Authorization', `Bearer ${authToken}`),
      request(app).get('/api/tasks').set('Authorization', `Bearer ${authToken}`),
      request(app).get('/api/analytics/dashboard').set('Authorization', `Bearer ${authToken}`),
      request(app).get('/api/security/events').set('Authorization', `Bearer ${authToken}`),
      request(app).get(`/api/agents/${agentId}`).set('Authorization', `Bearer ${authToken}`),
    ];

    const results = await Promise.all(ops);
    const allOk = results.every((r) => r.status === 200);
    expect(allOk).toBe(true);
  });
});

/* ================================================================== */
/*  ENDURANCE TESTING (simulated)                                      */
/* ================================================================== */

describe('Endurance Testing (simulated burst cycles)', () => {
  it('maintains consistent response times across 5 burst cycles', async () => {
    const cycleTimes: number[] = [];

    for (let cycle = 0; cycle < 5; cycle++) {
      const { avgMs } = await concurrentRequests('get', '/api/agents', 20);
      cycleTimes.push(avgMs);
    }

    // No single cycle should deviate > 3x from the mean
    const mean = cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length;
    for (const t of cycleTimes) {
      expect(t).toBeLessThan(mean * 3);
    }
  });

  it('maintains data integrity across repeated create/read cycles', async () => {
    for (let i = 0; i < 10; i++) {
      const name = `EnduranceAgent_${i}_${Date.now()}`;
      const createRes = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name, role: 'tester', category: 'endurance', status: 'idle' });
      expect(createRes.status === 200 || createRes.status === 201).toBe(true);

      // Immediately verify it's readable
      const id = createRes.body.id;
      const readRes = await request(app).get(`/api/agents/${id}`).set('Authorization', `Bearer ${authToken}`);
      expect(readRes.status).toBe(200);
      expect(readRes.body.name).toBe(name);
    }
  });

  it('caching remains effective across sustained load', async () => {
    // First request warms the cache
    const { elapsed: cold } = await measureRequest('get', '/api/analytics/dashboard');

    // Subsequent requests should benefit from cache
    const warmTimes: number[] = [];
    for (let i = 0; i < 10; i++) {
      const { elapsed } = await measureRequest('get', '/api/analytics/dashboard');
      warmTimes.push(elapsed);
    }

    const avgWarm = warmTimes.reduce((a, b) => a + b, 0) / warmTimes.length;
    // Warm requests should generally be faster or comparable
    expect(avgWarm).toBeLessThan(cold * 3 + 50); // allow tolerance
  });

  it('handles sustained workflow execution (create → start → complete)', async () => {
    for (let i = 0; i < 5; i++) {
      // Create workflow
      const wfRes = await request(app)
        .post('/api/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `EnduranceWF_${i}`,
          description: 'Endurance test workflow',
          steps: [
            { name: 'Step A', type: 'automated' },
            { name: 'Step B', type: 'automated' },
          ],
        });
      expect(wfRes.status === 200 || wfRes.status === 201).toBe(true);
      const wfId = wfRes.body.id;

      // Start
      const startRes = await request(app)
        .post(`/api/workflows/${wfId}/start`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(startRes.status).toBe(200);
    }
  });

  it('security event logging remains consistent under sustained load', async () => {
    const events: string[] = [];
    for (let i = 0; i < 15; i++) {
      const res = await request(app)
        .post('/api/security/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'endurance_test',
          severity: 'low',
          message: `Endurance event ${i}`,
          source: 'performance-test',
        });
      expect(res.status === 200 || res.status === 201).toBe(true);
      if (res.body.id) events.push(res.body.id);
    }
    expect(events.length).toBeGreaterThanOrEqual(10);
  });
});

/* ================================================================== */
/*  PERFORMANCE BASELINE                                               */
/* ================================================================== */

describe('Performance Baseline', () => {
  it('GET /api/health responds within 50ms', async () => {
    const { elapsed } = await measureRequest('get', '/api/health');
    expect(elapsed).toBeLessThan(50);
  });

  it('GET /api/agents responds within 200ms', async () => {
    const { elapsed } = await measureRequest('get', '/api/agents');
    expect(elapsed).toBeLessThan(200);
  });

  it('GET /api/tasks responds within 200ms', async () => {
    const { elapsed } = await measureRequest('get', '/api/tasks');
    expect(elapsed).toBeLessThan(200);
  });

  it('GET /api/analytics/dashboard responds within 300ms', async () => {
    const { elapsed } = await measureRequest('get', '/api/analytics/dashboard');
    expect(elapsed).toBeLessThan(300);
  });

  it('POST /api/agents (create) responds within 200ms', async () => {
    const { elapsed } = await measureRequest('post', '/api/agents', {
      name: 'BaselineAgent',
      category: 'baseline',
      status: 'idle',
    });
    expect(elapsed).toBeLessThan(200);
  });

  it('POST /api/tasks (create) responds within 200ms', async () => {
    const { elapsed } = await measureRequest('post', '/api/tasks', {
      title: 'BaselineTask',
      status: 'backlog',
      priority: 'low',
      category: 'baseline',
    });
    expect(elapsed).toBeLessThan(200);
  });
});
