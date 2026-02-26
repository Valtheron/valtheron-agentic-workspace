import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, initDatabase } from '../app.js';

const app = createApp();

describe('Collaboration Endpoints', () => {
  let sessionId: string;

  it('should initialize DB', () => {
    initDatabase();
  });

  // POST /api/collaboration/sessions
  it('POST /api/collaboration/sessions — creates a session', async () => {
    const res = await request(app)
      .post('/api/collaboration/sessions')
      .send({
        name: 'Test Collab',
        agents: ['agent-1', 'agent-2'],
        coordinatorPrompt: 'Coordinate the work',
        delegationStrategy: 'round-robin',
        conflictResolution: 'coordinator-decides',
        consensusThreshold: 80,
        maxIterations: 5,
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Collab');
    expect(res.body.agents).toEqual(['agent-1', 'agent-2']);
    sessionId = res.body.id;
  });

  it('POST /api/collaboration/sessions — rejects missing name', async () => {
    const res = await request(app)
      .post('/api/collaboration/sessions')
      .send({ agents: ['a'] });
    expect(res.status).toBe(400);
  });

  it('POST /api/collaboration/sessions — rejects missing agents', async () => {
    const res = await request(app).post('/api/collaboration/sessions').send({ name: 'test' });
    expect(res.status).toBe(400);
  });

  // GET /api/collaboration/sessions
  it('GET /api/collaboration/sessions — returns sessions list', async () => {
    const res = await request(app).get('/api/collaboration/sessions');
    expect(res.status).toBe(200);
    expect(res.body.sessions).toBeInstanceOf(Array);
    expect(res.body.sessions.length).toBeGreaterThanOrEqual(1);
  });

  // PATCH /api/collaboration/sessions/:id
  it('PATCH /api/collaboration/sessions/:id — updates session', async () => {
    const res = await request(app)
      .patch(`/api/collaboration/sessions/${sessionId}`)
      .send({ status: 'paused', synthesis: 'Results synthesized' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paused');
  });

  it('PATCH /api/collaboration/sessions/:id — returns 404 for nonexistent', async () => {
    const res = await request(app).patch('/api/collaboration/sessions/nonexistent').send({ status: 'paused' });
    expect(res.status).toBe(404);
  });

  // POST /api/collaboration/sessions/:id/messages
  it('POST /api/collaboration/sessions/:id/messages — sends a message', async () => {
    const res = await request(app)
      .post(`/api/collaboration/sessions/${sessionId}/messages`)
      .send({ senderId: 'agent-1', content: 'Hello team!', messageType: 'message' });
    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Hello team!');
    expect(res.body.senderId).toBe('agent-1');
  });

  it('POST /api/collaboration/sessions/:id/messages — rejects missing fields', async () => {
    const res = await request(app)
      .post(`/api/collaboration/sessions/${sessionId}/messages`)
      .send({ content: 'Missing senderId' });
    expect(res.status).toBe(400);
  });

  // GET /api/collaboration/sessions/:id/messages
  it('GET /api/collaboration/sessions/:id/messages — returns messages', async () => {
    const res = await request(app).get(`/api/collaboration/sessions/${sessionId}/messages`);
    expect(res.status).toBe(200);
    expect(res.body.messages).toBeInstanceOf(Array);
    expect(res.body.messages.length).toBeGreaterThanOrEqual(1);
  });

  // DELETE /api/collaboration/sessions/:id
  it('DELETE /api/collaboration/sessions/:id — deletes session', async () => {
    const res = await request(app).delete(`/api/collaboration/sessions/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/collaboration/sessions/:id — returns 404 for already deleted', async () => {
    const res = await request(app).delete(`/api/collaboration/sessions/${sessionId}`);
    expect(res.status).toBe(404);
  });
});
