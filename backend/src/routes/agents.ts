import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';

const router = Router();

function parseAgent(row: Record<string, unknown>) {
  return {
    ...row,
    personality: JSON.parse(row.personality as string),
    parameters: JSON.parse(row.parameters as string),
    hooks: JSON.parse(row.hooks as string),
    testResults: JSON.parse(row.testResults as string),
    riskProfile: row.riskProfile ? JSON.parse(row.riskProfile as string) : undefined,
  };
}

// GET /api/agents
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { category, status, search, limit = '200', offset = '0' } = req.query;

  let query = 'SELECT * FROM agents WHERE 1=1';
  const params: unknown[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (name LIKE ? OR role LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY successRate DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const agents = db.prepare(query).all(...params).map(a => parseAgent(a as Record<string, unknown>));
  const total = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };

  res.json({ agents, total: total.count });
});

// GET /api/agents/:id
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;

  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  res.json(parseAgent(agent));
});

// POST /api/agents
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { name, role, category, systemPrompt = '', personality = {}, parameters = {}, llmProvider, llmModel } = req.body;

  if (!name || !role || !category) {
    res.status(400).json({ error: 'name, role, and category are required' });
    return;
  }

  const id = uuid();
  db.prepare(`
    INSERT INTO agents (id, name, role, category, systemPrompt, personality, parameters, llmProvider, llmModel, lastActivity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, role, category, systemPrompt, JSON.stringify(personality), JSON.stringify(parameters), llmProvider || 'anthropic', llmModel || 'claude-sonnet-4-5-20250929', new Date().toISOString());

  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as Record<string, unknown>;
  res.status(201).json(parseAgent(agent));
});

// PATCH /api/agents/:id
router.patch('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  const updates: string[] = [];
  const params: unknown[] = [];
  const allowed = ['name', 'role', 'category', 'status', 'systemPrompt', 'llmProvider', 'llmModel', 'currentTask'];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates.push(`${key} = ?`);
      params.push(req.body[key]);
    }
  }

  // Handle JSON fields
  for (const key of ['personality', 'parameters', 'riskProfile']) {
    if (req.body[key] !== undefined) {
      updates.push(`${key} = ?`);
      params.push(JSON.stringify(req.body[key]));
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  updates.push('lastActivity = ?');
  params.push(new Date().toISOString());
  params.push(req.params.id);

  db.prepare(`UPDATE agents SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json(parseAgent(agent));
});

// DELETE /api/agents/:id
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM agents WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  res.json({ success: true });
});

// POST /api/agents/:id/suspend
router.post('/:id/suspend', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare("UPDATE agents SET status = 'suspended', lastActivity = ? WHERE id = ?").run(new Date().toISOString(), req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  res.json({ success: true, status: 'suspended' });
});

// POST /api/agents/:id/activate
router.post('/:id/activate', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare("UPDATE agents SET status = 'active', lastActivity = ? WHERE id = ?").run(new Date().toISOString(), req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  res.json({ success: true, status: 'active' });
});

// GET /api/agents/stats/overview
router.get('/stats/overview', (_req: Request, res: Response) => {
  const db = getDb();

  const total = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM agents GROUP BY status').all() as { status: string; count: number }[];
  const byCategory = db.prepare('SELECT category, COUNT(*) as count FROM agents GROUP BY category').all() as { category: string; count: number }[];
  const avgSuccessRate = db.prepare('SELECT AVG(successRate) as avg FROM agents').get() as { avg: number };
  const topPerformers = db.prepare('SELECT id, name, successRate, category FROM agents ORDER BY successRate DESC LIMIT 10').all();

  res.json({
    total: total.count,
    byStatus: Object.fromEntries(byStatus.map(s => [s.status, s.count])),
    byCategory: Object.fromEntries(byCategory.map(c => [c.category, c.count])),
    avgSuccessRate: +(avgSuccessRate.avg || 0).toFixed(1),
    topPerformers,
  });
});

export default router;
