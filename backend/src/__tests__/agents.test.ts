import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('Agents Endpoints', () => {
  let createdAgentId: string;

  describe('GET /api/agents', () => {
    it('returns a list of agents', async () => {
      const res = await request(app).get('/api/agents');

      expect(res.status).toBe(200);
      expect(res.body.agents).toBeDefined();
      expect(Array.isArray(res.body.agents)).toBe(true);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('supports category filter', async () => {
      const res = await request(app).get('/api/agents?category=security');

      expect(res.status).toBe(200);
      for (const agent of res.body.agents) {
        expect(agent.category).toBe('security');
      }
    });

    it('supports search query', async () => {
      const res = await request(app).get('/api/agents?search=Alpha');

      expect(res.status).toBe(200);
      expect(res.body.agents).toBeDefined();
    });

    it('supports pagination', async () => {
      const res = await request(app).get('/api/agents?limit=5&offset=0');

      expect(res.status).toBe(200);
      expect(res.body.agents.length).toBeLessThanOrEqual(5);
    });
  });

  describe('POST /api/agents', () => {
    it('creates a new agent', async () => {
      const res = await request(app)
        .post('/api/agents')
        .send({
          name: 'Test Agent',
          role: 'Test Runner',
          category: 'qa',
          systemPrompt: 'You are a test agent.',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test Agent');
      expect(res.body.role).toBe('Test Runner');
      expect(res.body.category).toBe('qa');
      expect(res.body.id).toBeDefined();
      createdAgentId = res.body.id;
    });

    it('rejects missing required fields', async () => {
      const res = await request(app)
        .post('/api/agents')
        .send({ name: 'Incomplete Agent' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/agents/:id', () => {
    it('returns a single agent', async () => {
      const res = await request(app).get(`/api/agents/${createdAgentId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdAgentId);
      expect(res.body.name).toBe('Test Agent');
    });

    it('returns 404 for nonexistent agent', async () => {
      const res = await request(app).get('/api/agents/nonexistent-id');

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/agents/:id', () => {
    it('updates agent fields', async () => {
      const res = await request(app)
        .patch(`/api/agents/${createdAgentId}`)
        .send({ name: 'Updated Agent', status: 'active' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Agent');
      expect(res.body.status).toBe('active');
    });

    it('returns 404 for nonexistent agent', async () => {
      const res = await request(app)
        .patch('/api/agents/nonexistent-id')
        .send({ name: 'Ghost' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/agents/:id/suspend & activate', () => {
    it('suspends an agent', async () => {
      const res = await request(app).post(`/api/agents/${createdAgentId}/suspend`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('suspended');
    });

    it('activates an agent', async () => {
      const res = await request(app).post(`/api/agents/${createdAgentId}/activate`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('active');
    });
  });

  describe('DELETE /api/agents/:id', () => {
    it('deletes an agent', async () => {
      const res = await request(app).delete(`/api/agents/${createdAgentId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for already deleted agent', async () => {
      const res = await request(app).delete(`/api/agents/${createdAgentId}`);

      expect(res.status).toBe(404);
    });
  });
});
