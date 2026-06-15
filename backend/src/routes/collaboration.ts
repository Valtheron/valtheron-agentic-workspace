import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';
import { broadcast } from '../services/websocket.js';
import { callLLM } from '../services/llmClient.js';
import { orchestrate, OrchestrationError, type OrchestratorAgent } from '../services/collaborationOrchestrator.js';

const router = Router();

interface AgentPromptRow {
  id: string;
  name: string;
  role: string;
  systemPrompt: string | null;
}

// GET /api/collaboration/sessions
router.get('/sessions', (_req, res) => {
  const db = getDb();
  const sessions = db.prepare('SELECT * FROM collaboration_sessions ORDER BY updatedAt DESC').all();
  const parsed = (sessions as Record<string, unknown>[]).map((s) => ({
    ...s,
    agents: JSON.parse((s.agents as string) || '[]'),
    sharedFiles: JSON.parse((s.sharedFiles as string) || '[]'),
  }));
  res.json({ sessions: parsed });
});

// POST /api/collaboration/sessions
router.post('/sessions', (req, res) => {
  const db = getDb();
  const { name, agents, coordinatorPrompt, delegationStrategy, conflictResolution, consensusThreshold, maxIterations } =
    req.body;
  if (!name || !agents?.length) return res.status(400).json({ error: 'name and agents are required' });

  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO collaboration_sessions (id, name, agents, status, sharedFiles, coordinatorPrompt, delegationStrategy, conflictResolution, consensusThreshold, maxIterations, startedAt, updatedAt)
    VALUES (?, ?, ?, 'active', '[]', ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    name,
    JSON.stringify(agents),
    coordinatorPrompt || '',
    delegationStrategy || 'round-robin',
    conflictResolution || 'coordinator-decides',
    consensusThreshold || 75,
    maxIterations || 10,
    now,
    now,
  );

  const session = db.prepare('SELECT * FROM collaboration_sessions WHERE id = ?').get(id) as Record<string, unknown>;
  res.status(201).json({
    ...session,
    agents: JSON.parse(session.agents as string),
    sharedFiles: JSON.parse(session.sharedFiles as string),
  });
});

// PATCH /api/collaboration/sessions/:id
router.patch('/sessions/:id', (req, res) => {
  const db = getDb();
  const { status, synthesis } = req.body;
  const updates: string[] = [];
  const values: unknown[] = [];

  if (status) {
    updates.push('status = ?');
    values.push(status);
  }
  if (synthesis !== undefined) {
    updates.push('synthesis = ?');
    values.push(synthesis);
  }
  updates.push('updatedAt = ?');
  values.push(new Date().toISOString());
  values.push(req.params.id);

  db.prepare(`UPDATE collaboration_sessions SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const session = db.prepare('SELECT * FROM collaboration_sessions WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!session) return res.status(404).json({ error: 'Session not found' });

  res.json({
    ...session,
    agents: JSON.parse(session.agents as string),
    sharedFiles: JSON.parse(session.sharedFiles as string),
  });
});

// DELETE /api/collaboration/sessions/:id
router.delete('/sessions/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM collaboration_messages WHERE sessionId = ?').run(req.params.id);
  const result = db.prepare('DELETE FROM collaboration_sessions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Session not found' });
  res.json({ success: true });
});

// GET /api/collaboration/sessions/:id/messages
router.get('/sessions/:id/messages', (req, res) => {
  const db = getDb();
  const messages = db
    .prepare('SELECT * FROM collaboration_messages WHERE sessionId = ? ORDER BY timestamp ASC')
    .all(req.params.id);
  res.json({ messages });
});

// POST /api/collaboration/sessions/:id/messages
router.post('/sessions/:id/messages', (req, res) => {
  const db = getDb();
  const { senderId, content, messageType } = req.body;
  if (!senderId || !content) return res.status(400).json({ error: 'senderId and content are required' });

  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO collaboration_messages (id, sessionId, senderId, content, messageType, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, req.params.id, senderId, content, messageType || 'message', now);
  db.prepare('UPDATE collaboration_sessions SET updatedAt = ? WHERE id = ?').run(now, req.params.id);

  const msg = db.prepare('SELECT * FROM collaboration_messages WHERE id = ?').get(id);

  broadcast(
    {
      type: 'collaboration_message',
      payload: { sessionId: req.params.id, message: msg },
      timestamp: now,
    },
    'collaboration',
  );

  res.status(201).json(msg);
});

// POST /api/collaboration/sessions/:id/run — orchestrate the selected agents
// over the coordinator task with REAL LLM calls (credentials via x-llm-*
// headers, same as chat). No simulation fallback: without a key the run is
// rejected so nothing is fabricated.
router.post('/sessions/:id/run', async (req, res) => {
  const db = getDb();
  const session = db.prepare('SELECT * FROM collaboration_sessions WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const apiKey = req.headers['x-llm-api-key'] as string | undefined;
  const provider = (req.headers['x-llm-provider'] as string | undefined) || 'anthropic';
  const model = (req.headers['x-llm-model'] as string | undefined) || 'claude-sonnet-4-5-20250929';
  if (!apiKey) {
    return res.status(400).json({
      error:
        'LLM-API-Key erforderlich: bitte in den LLM-Einstellungen einen Provider mit Key aktivieren. Es werden keine Antworten simuliert.',
    });
  }

  const task = (session.coordinatorPrompt as string) || '';
  const agentIds = JSON.parse((session.agents as string) || '[]') as string[];
  const rows = agentIds.length
    ? (db
        .prepare(`SELECT id, name, role, systemPrompt FROM agents WHERE id IN (${agentIds.map(() => '?').join(',')})`)
        .all(...agentIds) as AgentPromptRow[])
    : [];
  const byId = new Map(rows.map((r) => [r.id, r]));
  // Preserve the order the user picked the agents in.
  const orchestratorAgents: OrchestratorAgent[] = agentIds
    .map((id) => byId.get(id))
    .filter((a): a is AgentPromptRow => !!a)
    .map((a) => ({
      id: a.id,
      name: a.name,
      systemPrompt:
        a.systemPrompt && a.systemPrompt.trim()
          ? a.systemPrompt
          : `Du bist ${a.name}, ${a.role}. Antworte fachlich und prägnant.`,
    }));

  const llmFn = (systemPrompt: string, userMessage: string) =>
    callLLM({
      provider,
      model,
      apiKey,
      systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 700,
    });

  try {
    const result = await orchestrate(
      {
        task,
        delegationStrategy: session.delegationStrategy as string,
        conflictResolution: session.conflictResolution as string,
        agents: orchestratorAgents,
      },
      llmFn,
    );

    const insert = db.prepare(
      'INSERT INTO collaboration_messages (id, sessionId, senderId, content, messageType, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
    );
    const base = Date.now();
    result.messages.forEach((m, i) => {
      const mid = uuid();
      const ts = new Date(base + i).toISOString();
      insert.run(mid, req.params.id, m.senderId, m.content, m.messageType, ts);
      broadcast(
        {
          type: 'collaboration_message',
          payload: {
            sessionId: req.params.id,
            message: { id: mid, sessionId: req.params.id, ...m, timestamp: ts },
          },
          timestamp: ts,
        },
        'collaboration',
      );
    });

    const now = new Date().toISOString();
    db.prepare('UPDATE collaboration_sessions SET synthesis = ?, status = ?, updatedAt = ? WHERE id = ?').run(
      result.synthesis,
      'completed',
      now,
      req.params.id,
    );

    res.json({ messages: result.messages, synthesis: result.synthesis, status: 'completed' });
  } catch (err) {
    if (err instanceof OrchestrationError) return res.status(400).json({ error: err.message });
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(502).json({ error: `LLM-Orchestrierung fehlgeschlagen: ${msg}` });
  }
});

export default router;
