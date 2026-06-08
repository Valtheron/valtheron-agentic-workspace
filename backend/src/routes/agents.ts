import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';
import {
  wrapAsCapabilityState,
  pendingCapabilityState,
  assertCapabilityState,
  type CapabilityState,
} from '../services/capabilityScoring.js';

const router = Router();

interface CapabilityRow {
  status: string;
  profile: string | null;
  pendingReason: string | null;
  computedAt: string;
}

function rowToCapabilityState(row: CapabilityRow | undefined, now: string): CapabilityState {
  let state: CapabilityState;
  if (!row) {
    state = pendingCapabilityState(
      'No capability row for this agent — run seedAgentCatalog or POST /api/agents recompute',
      now,
    );
  } else if (row.status !== 'computed' || !row.profile) {
    state = pendingCapabilityState(row.pendingReason ?? 'profile not yet computed', row.computedAt);
  } else {
    state = wrapAsCapabilityState(JSON.parse(row.profile), row.computedAt);
  }
  // Boundary guard — throws if any invariant (b ≠ 1, status/profile pairing,
  // pending↔reason) was violated by upstream writes.
  assertCapabilityState(state);
  return state;
}

// Slim summary — list endpoints carry status/timestamp only; the heavy
// profile blob is reserved for GET /api/agents/:id. This keeps b ≠ 1
// observable on the wire without parsing 290 × 3-5 KB JSON per request.
interface CapabilitySummary {
  value: false;
  status: 'computed' | 'pending';
  timestamp: string;
  pendingReason: string | null;
}

function rowToCapabilitySummary(row: CapabilityRow | undefined, now: string): CapabilitySummary {
  if (!row) {
    return { value: false, status: 'pending', timestamp: now, pendingReason: 'No capability row' };
  }
  if (row.status !== 'computed' || !row.profile) {
    return {
      value: false,
      status: 'pending',
      timestamp: row.computedAt,
      pendingReason: row.pendingReason ?? 'profile not yet computed',
    };
  }
  return { value: false, status: 'computed', timestamp: row.computedAt, pendingReason: null };
}

function loadCapabilityStateOne(agentId: string): CapabilityState {
  const db = getDb();
  const row = db
    .prepare('SELECT status, profile, pendingReason, computedAt FROM agent_capabilities WHERE agentId = ?')
    .get(agentId) as CapabilityRow | undefined;
  return rowToCapabilityState(row, new Date().toISOString());
}

function loadCapabilitySummaryMap(agentIds: string[]): Map<string, CapabilitySummary> {
  if (agentIds.length === 0) return new Map();
  const db = getDb();
  const placeholders = agentIds.map(() => '?').join(',');
  // Skip `profile` column on list path — only summary fields needed.
  const rows = db
    .prepare(
      `SELECT agentId, status, pendingReason, computedAt
       FROM agent_capabilities WHERE agentId IN (${placeholders})`,
    )
    .all(...agentIds) as Array<{
    agentId: string;
    status: string;
    pendingReason: string | null;
    computedAt: string;
  }>;
  const now = new Date().toISOString();
  const byId = new Map<string, CapabilityRow>();
  for (const r of rows) byId.set(r.agentId, { ...r, profile: 'present' } as CapabilityRow);
  const out = new Map<string, CapabilitySummary>();
  for (const id of agentIds) {
    out.set(id, rowToCapabilitySummary(byId.get(id), now));
  }
  return out;
}

function parseAgentDetail(row: Record<string, unknown>) {
  const id = row.id as string;
  return {
    ...row,
    personality: JSON.parse(row.personality as string),
    parameters: JSON.parse(row.parameters as string),
    hooks: JSON.parse(row.hooks as string),
    testResults: JSON.parse(row.testResults as string),
    riskProfile: row.riskProfile ? JSON.parse(row.riskProfile as string) : undefined,
    capabilities: loadCapabilityStateOne(id),
  };
}

function parseAgentList(row: Record<string, unknown>, summary: CapabilitySummary | undefined) {
  return {
    ...row,
    personality: JSON.parse(row.personality as string),
    parameters: JSON.parse(row.parameters as string),
    hooks: JSON.parse(row.hooks as string),
    testResults: JSON.parse(row.testResults as string),
    riskProfile: row.riskProfile ? JSON.parse(row.riskProfile as string) : undefined,
    capabilities: summary ?? rowToCapabilitySummary(undefined, new Date().toISOString()),
  };
}

// GET /api/agents
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { category, status, search, limit = '1000', offset = '0' } = req.query;

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

  const rawRows = db.prepare(query).all(...params) as Record<string, unknown>[];
  const ids = rawRows.map((r) => r.id as string);
  const capMap = loadCapabilitySummaryMap(ids);
  const agents = rawRows.map((a) => parseAgentList(a, capMap.get(a.id as string)));
  const total = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };

  res.json({ agents, total: total.count });
});

// GET /api/agents/:id
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;

  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  res.json(parseAgentDetail(agent));
});

// POST /api/agents
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const {
    name,
    role,
    category,
    systemPrompt = '',
    personality = {},
    parameters = {},
    llmProvider,
    llmModel,
  } = req.body;

  if (!name || !role || !category) {
    res.status(400).json({ error: 'name, role, and category are required' });
    return;
  }

  const id = uuid();
  db.prepare(
    `
    INSERT INTO agents (id, name, role, category, systemPrompt, personality, parameters, llmProvider, llmModel, lastActivity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    name,
    role,
    category,
    systemPrompt,
    JSON.stringify(personality),
    JSON.stringify(parameters),
    llmProvider || 'anthropic',
    llmModel || 'claude-sonnet-4-5-20250929',
    new Date().toISOString(),
  );

  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as Record<string, unknown>;
  res.status(201).json(parseAgentDetail(agent));
});

// PATCH /api/agents/:id
router.patch('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;

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
  res.json(parseAgentDetail(agent));
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
  const result = db
    .prepare("UPDATE agents SET status = 'suspended', lastActivity = ? WHERE id = ?")
    .run(new Date().toISOString(), req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  res.json({ success: true, status: 'suspended' });
});

// POST /api/agents/:id/activate
router.post('/:id/activate', (req: Request, res: Response) => {
  const db = getDb();
  const result = db
    .prepare("UPDATE agents SET status = 'active', lastActivity = ? WHERE id = ?")
    .run(new Date().toISOString(), req.params.id);

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
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM agents GROUP BY status').all() as {
    status: string;
    count: number;
  }[];
  const byCategory = db.prepare('SELECT category, COUNT(*) as count FROM agents GROUP BY category').all() as {
    category: string;
    count: number;
  }[];
  const avgSuccessRate = db.prepare('SELECT AVG(successRate) as avg FROM agents').get() as { avg: number };
  const topPerformers = db
    .prepare('SELECT id, name, successRate, category FROM agents ORDER BY successRate DESC LIMIT 10')
    .all();

  res.json({
    total: total.count,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s.count])),
    byCategory: Object.fromEntries(byCategory.map((c) => [c.category, c.count])),
    avgSuccessRate: +(avgSuccessRate.avg || 0).toFixed(1),
    topPerformers,
  });
});

export default router;
