import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, initDatabase } from '../app.js';

const app = createApp();

describe('Chat Endpoints', () => {
  let agentId: string;
  let sessionId: string;

  it('should initialize DB and get an agent', async () => {
    initDatabase();
    const agentsRes = await request(app).get('/api/agents?limit=1');
    agentId = agentsRes.body.agents[0]?.id;
    expect(agentId).toBeTruthy();
  });

  // POST /api/chat/sessions
  it('POST /api/chat/sessions — creates a chat session', async () => {
    const res = await request(app).post('/api/chat/sessions').send({
      agentId,
      title: 'Test Chat',
    });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.agentId).toBe(agentId);
    expect(res.body.title).toBe('Test Chat');
    sessionId = res.body.id;
  });

  it('POST /api/chat/sessions — rejects missing agentId', async () => {
    const res = await request(app).post('/api/chat/sessions').send({ title: 'No agent' });
    expect(res.status).toBe(400);
  });

  // GET /api/chat/sessions
  it('GET /api/chat/sessions — returns sessions list', async () => {
    const res = await request(app).get('/api/chat/sessions');
    expect(res.status).toBe(200);
    expect(res.body.sessions).toBeInstanceOf(Array);
    expect(res.body.sessions.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/chat/sessions — filters by agentId', async () => {
    const res = await request(app).get(`/api/chat/sessions?agentId=${agentId}`);
    expect(res.status).toBe(200);
    expect(res.body.sessions.every((s: { agentId: string }) => s.agentId === agentId)).toBe(true);
  });

  // POST /api/chat/sessions/:id/messages
  it('POST /api/chat/sessions/:id/messages — sends a message', async () => {
    const res = await request(app).post(`/api/chat/sessions/${sessionId}/messages`).send({ content: 'Hello, agent!' });
    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Hello, agent!');
    expect(res.body.senderType).toBe('user');
  });

  it('POST /api/chat/sessions/:id/messages — rejects missing content', async () => {
    const res = await request(app).post(`/api/chat/sessions/${sessionId}/messages`).send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/chat/sessions/:id/messages — returns error for nonexistent session', async () => {
    const res = await request(app).post('/api/chat/sessions/nonexistent/messages').send({ content: 'test' });
    // FK constraint or internal error for nonexistent session
    expect([400, 404, 500]).toContain(res.status);
  });

  // GET /api/chat/sessions/:id/messages
  it('GET /api/chat/sessions/:id/messages — returns messages', async () => {
    const res = await request(app).get(`/api/chat/sessions/${sessionId}/messages`);
    expect(res.status).toBe(200);
    expect(res.body.messages).toBeInstanceOf(Array);
    expect(res.body.messages.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/chat/sessions/:id/messages — returns empty for nonexistent', async () => {
    const res = await request(app).get('/api/chat/sessions/nonexistent/messages');
    expect(res.status).toBe(200);
    expect(res.body.messages).toEqual([]);
  });

  // DELETE /api/chat/sessions/:id
  it('DELETE /api/chat/sessions/:id — deletes a session', async () => {
    const res = await request(app).delete(`/api/chat/sessions/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/chat/sessions/:id — returns 404 for already deleted', async () => {
    const res = await request(app).delete(`/api/chat/sessions/${sessionId}`);
    expect(res.status).toBe(404);
  });
});
