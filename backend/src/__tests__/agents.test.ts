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
      const res = await request(app).post('/api/agents').send({
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
      const res = await request(app).post('/api/agents').send({ name: 'Incomplete Agent' });

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
      const res = await request(app).patch('/api/agents/nonexistent-id').send({ name: 'Ghost' });

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

  describe('Capability state on agent responses', () => {
    it('GET /api/agents/:id includes a computed capability state for seeded agents', async () => {
      const list = await request(app).get('/api/agents?limit=1');
      const seedAgent = list.body.agents.find((a: { name: string }) => a.name === 'Market Data Harvester');
      const targetId = seedAgent ? seedAgent.id : list.body.agents[0].id;
      const res = await request(app).get(`/api/agents/${targetId}`);

      expect(res.status).toBe(200);
      expect(res.body.capabilities).toBeDefined();
      expect(res.body.capabilities.value).toBe(false);
      expect(['computed', 'pending']).toContain(res.body.capabilities.status);
      if (res.body.capabilities.status === 'computed') {
        expect(res.body.capabilities.profile).not.toBeNull();
        expect(res.body.capabilities.profile.layers).toHaveLength(5);
        const subs = res.body.capabilities.profile.layers.flatMap(
          (l: { sub_dimensions: unknown[] }) => l.sub_dimensions,
        );
        expect(subs).toHaveLength(30);
        expect(res.body.capabilities.profile.modifiers).toHaveLength(3);
        const modKeys = res.body.capabilities.profile.modifiers.map((m: { key: string }) => m.key);
        expect(modKeys).toEqual(
          expect.arrayContaining(['personality_influence', 'performance_history', 'test_results']),
        );
      } else {
        expect(res.body.capabilities.profile).toBeNull();
        expect(res.body.capabilities.pendingReason).toBeTruthy();
      }
    });

    it('GET /api/agents lists every entry with a slim capability summary respecting b ≠ 1', async () => {
      const res = await request(app).get('/api/agents?limit=10');
      expect(res.status).toBe(200);
      for (const agent of res.body.agents) {
        expect(agent.capabilities).toBeDefined();
        expect(agent.capabilities.value).toBe(false); // b ≠ 1 invariant on the wire
        expect(['computed', 'pending']).toContain(agent.capabilities.status);
        // List path returns slim summary — no profile blob, only status / timestamp / pendingReason.
        expect(agent.capabilities).not.toHaveProperty('profile');
        expect(agent.capabilities.timestamp).toBeTruthy();
      }
    });

    it('manually-created agent (no seed) gets a pending capability state', async () => {
      const create = await request(app)
        .post('/api/agents')
        .send({
          name: 'Manual Pending Test Agent',
          role: 'Manual Tester',
          category: 'qa',
          systemPrompt: 'manual',
          personality: { creativity: 50, analyticalDepth: 60 },
        });
      expect(create.status).toBe(201);
      const id = create.body.id;
      // The POST handler does not run capability scoring yet — we expect
      // pending state with the documented reason.
      expect(create.body.capabilities.value).toBe(false);
      expect(create.body.capabilities.status).toBe('pending');
      expect(create.body.capabilities.profile).toBeNull();
      expect(create.body.capabilities.pendingReason).toMatch(/No capability row|profile not yet computed/);

      // Cleanup
      await request(app).delete(`/api/agents/${id}`);
    });
  });
});
