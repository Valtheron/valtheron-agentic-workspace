import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp, initDatabase } from '../app.js';
import { getDb } from '../db/schema.js';

// ── Mock Anthropic + OpenAI so LLM tests don't make real API calls ──

const mockAnthropicCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class Anthropic {
    messages = { create: mockAnthropicCreate };
  },
}));

const mockOpenAICreate = vi.fn();
vi.mock('openai', () => ({
  default: class OpenAI {
    chat = { completions: { create: mockOpenAICreate } };
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ── App setup ─────────────────────────────────────────────────────────

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

  it('POST /api/chat/sessions — uses default title when omitted', async () => {
    const res = await request(app).post('/api/chat/sessions').send({ agentId });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Neue Konversation');
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

  // POST /api/chat/sessions/:id/messages — simulation path (no apiKey)
  it('POST /api/chat/sessions/:id/messages — sends a message (simulation)', async () => {
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

  // POST /api/chat/sessions/:id/messages — LLM path (with apiKey)

  it('POST /api/chat/sessions/:id/messages — calls Anthropic LLM when x-llm-api-key provided', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Anthropic LLM Antwort' }],
    });

    const res = await request(app)
      .post(`/api/chat/sessions/${sessionId}/messages`)
      .set('x-llm-api-key', 'test-anthropic-key')
      .set('x-llm-provider', 'anthropic')
      .set('x-llm-model', 'claude-3-haiku')
      .send({ content: 'Hello via Anthropic' });

    expect(res.status).toBe(201);
    // Give async processing time to complete
    await new Promise((r) => setTimeout(r, 50));
    expect(mockAnthropicCreate).toHaveBeenCalled();
  });

  it('POST /api/chat/sessions/:id/messages — saves agent LLM response to DB', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Gespeicherte LLM-Antwort' }],
    });

    await request(app)
      .post(`/api/chat/sessions/${sessionId}/messages`)
      .set('x-llm-api-key', 'test-key')
      .set('x-llm-provider', 'anthropic')
      .send({ content: 'Speichere bitte' });

    await new Promise((r) => setTimeout(r, 50));

    const db = getDb();
    const agentMsg = db
      .prepare(
        "SELECT * FROM chat_messages WHERE sessionId = ? AND senderType = 'agent' ORDER BY timestamp DESC LIMIT 1",
      )
      .get(sessionId) as { content: string; senderType: string } | undefined;

    expect(agentMsg).toBeTruthy();
    expect(agentMsg?.content).toBe('Gespeicherte LLM-Antwort');
  });

  it('POST /api/chat/sessions/:id/messages — calls OpenAI when provider is openai', async () => {
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: 'OpenAI Antwort' } }],
    });

    const res = await request(app)
      .post(`/api/chat/sessions/${sessionId}/messages`)
      .set('x-llm-api-key', 'test-openai-key')
      .set('x-llm-provider', 'openai')
      .set('x-llm-model', 'gpt-4o-mini')
      .send({ content: 'Hello via OpenAI' });

    expect(res.status).toBe(201);
    await new Promise((r) => setTimeout(r, 50));
    expect(mockOpenAICreate).toHaveBeenCalled();
  });

  it('POST /api/chat/sessions/:id/messages — uses ollama via fetch', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: 'Ollama Antwort' } }),
    });

    const res = await request(app)
      .post(`/api/chat/sessions/${sessionId}/messages`)
      .set('x-llm-api-key', 'test-key')
      .set('x-llm-provider', 'ollama')
      .set('x-llm-model', 'llama3.2')
      .send({ content: 'Hello via Ollama' });

    expect(res.status).toBe(201);
    await new Promise((r) => setTimeout(r, 50));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('localhost:11434'),
      expect.any(Object),
    );
  });

  it('POST /api/chat/sessions/:id/messages — uses custom endpoint via fetch', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Custom LLM Antwort' } }] }),
    });

    // Need an agent with customEndpoint in parameters — we update the agent in DB directly
    const db = getDb();
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId) as Record<string, unknown>;
    const params = typeof agent.parameters === 'string' ? JSON.parse(agent.parameters as string) : agent.parameters;
    db.prepare('UPDATE agents SET parameters = ? WHERE id = ?').run(
      JSON.stringify({ ...params, customEndpoint: 'https://custom.llm.test/v1/chat' }),
      agentId,
    );

    const res = await request(app)
      .post(`/api/chat/sessions/${sessionId}/messages`)
      .set('x-llm-api-key', 'test-key')
      .set('x-llm-provider', 'custom')
      .send({ content: 'Hello via Custom' });

    expect(res.status).toBe(201);
    await new Promise((r) => setTimeout(r, 50));
    expect(mockFetch).toHaveBeenCalledWith('https://custom.llm.test/v1/chat', expect.any(Object));
  });

  it('POST /api/chat/sessions/:id/messages — falls back to simulation on LLM error', async () => {
    mockAnthropicCreate.mockRejectedValue(new Error('API-Fehler 500'));

    const res = await request(app)
      .post(`/api/chat/sessions/${sessionId}/messages`)
      .set('x-llm-api-key', 'failing-key')
      .set('x-llm-provider', 'anthropic')
      .send({ content: 'Trigger LLM error' });

    expect(res.status).toBe(201);
    await new Promise((r) => setTimeout(r, 50));

    // Agent message should still be saved with error info + fallback
    const db = getDb();
    const agentMsg = db
      .prepare(
        "SELECT content FROM chat_messages WHERE sessionId = ? AND senderType = 'agent' ORDER BY timestamp DESC LIMIT 1",
      )
      .get(sessionId) as { content: string } | undefined;

    expect(agentMsg?.content).toContain('LLM-Fehler');
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
