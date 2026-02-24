import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';
import { broadcast } from '../services/websocket.js';

const router = Router();

// GET /api/collaboration/sessions
router.get('/sessions', (_req, res) => {
  const db = getDb();
  const sessions = db.prepare('SELECT * FROM collaboration_sessions ORDER BY updatedAt DESC').all();
  const parsed = (sessions as Record<string, unknown>[]).map(s => ({
    ...s,
    agents: JSON.parse(s.agents as string || '[]'),
    sharedFiles: JSON.parse(s.sharedFiles as string || '[]'),
  }));
  res.json({ sessions: parsed });
});

// POST /api/collaboration/sessions
router.post('/sessions', (req, res) => {
  const db = getDb();
  const { name, agents, coordinatorPrompt, delegationStrategy, conflictResolution, consensusThreshold, maxIterations } = req.body;
  if (!name || !agents?.length) return res.status(400).json({ error: 'name and agents are required' });

  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`INSERT INTO collaboration_sessions (id, name, agents, status, sharedFiles, coordinatorPrompt, delegationStrategy, conflictResolution, consensusThreshold, maxIterations, startedAt, updatedAt)
    VALUES (?, ?, ?, 'active', '[]', ?, ?, ?, ?, ?, ?, ?)`).run(
    id, name, JSON.stringify(agents), coordinatorPrompt || '', delegationStrategy || 'round-robin',
    conflictResolution || 'coordinator-decides', consensusThreshold || 75, maxIterations || 10, now, now
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

  if (status) { updates.push('status = ?'); values.push(status); }
  if (synthesis !== undefined) { updates.push('synthesis = ?'); values.push(synthesis); }
  updates.push('updatedAt = ?');
  values.push(new Date().toISOString());
  values.push(req.params.id);

  db.prepare(`UPDATE collaboration_sessions SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const session = db.prepare('SELECT * FROM collaboration_sessions WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
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
  const messages = db.prepare('SELECT * FROM collaboration_messages WHERE sessionId = ? ORDER BY timestamp ASC').all(req.params.id);
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
    'INSERT INTO collaboration_messages (id, sessionId, senderId, content, messageType, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, req.params.id, senderId, content, messageType || 'message', now);
  db.prepare('UPDATE collaboration_sessions SET updatedAt = ? WHERE id = ?').run(now, req.params.id);

  const msg = db.prepare('SELECT * FROM collaboration_messages WHERE id = ?').get(id);

  broadcast({
    type: 'collaboration_message',
    payload: { sessionId: req.params.id, message: msg },
    timestamp: now,
  }, 'collaboration');

  res.status(201).json(msg);
});

export default router;
