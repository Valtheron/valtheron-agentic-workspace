import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('Health Endpoint', () => {
  it('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.database).toBeDefined();
    expect(res.body.database.agents).toBeGreaterThan(0);
    expect(res.body.database.tasks).toBeGreaterThan(0);
  });

  it('returns 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Endpoint not found');
  });
});
