import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';

const router = Router();

// ===== Security Events =====

// GET /api/security/events
router.get('/events', (req: Request, res: Response) => {
  const db = getDb();
  const { severity, type, resolved, limit = '50' } = req.query;

  let query = 'SELECT * FROM security_events WHERE 1=1';
  const params: unknown[] = [];

  if (severity) { query += ' AND severity = ?'; params.push(severity); }
  if (type) { query += ' AND type = ?'; params.push(type); }
  if (resolved !== undefined) { query += ' AND resolved = ?'; params.push(resolved === 'true' ? 1 : 0); }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(Number(limit));

  const events = db.prepare(query).all(...params);
  res.json({ events });
});

// POST /api/security/events
router.post('/events', (req: Request, res: Response) => {
  const db = getDb();
  const { type, severity, message, agentId } = req.body;

  if (!type || !severity || !message) {
    res.status(400).json({ error: 'type, severity, and message are required' });
    return;
  }

  const id = uuid();
  db.prepare('INSERT INTO security_events (id, type, severity, message, agentId) VALUES (?, ?, ?, ?, ?)').run(
    id, type, severity, message, agentId || null
  );

  const event = db.prepare('SELECT * FROM security_events WHERE id = ?').get(id);
  res.status(201).json(event);
});

// PATCH /api/security/events/:id/resolve
router.patch('/events/:id/resolve', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('UPDATE security_events SET resolved = 1 WHERE id = ?').run(req.params.id);

  if (result.changes === 0) { res.status(404).json({ error: 'Event not found' }); return; }
  res.json({ success: true });
});

// ===== Kill Switch =====

// GET /api/security/kill-switch
router.get('/kill-switch', (_req: Request, res: Response) => {
  const db = getDb();
  const ks = db.prepare('SELECT * FROM kill_switch WHERE id = 1').get() as Record<string, unknown>;

  res.json({
    armed: Boolean(ks.armed),
    triggeredAt: ks.triggeredAt,
    triggeredBy: ks.triggeredBy,
    reason: ks.reason,
    affectedAgents: JSON.parse(ks.affectedAgents as string),
    autoTriggerRules: JSON.parse(ks.autoTriggerRules as string),
    history: JSON.parse(ks.history as string),
  });
});

// POST /api/security/kill-switch/arm
router.post('/kill-switch/arm', (req: Request, res: Response) => {
  const db = getDb();
  const { reason } = req.body;
  const username = req.user?.username || 'system';

  const ks = db.prepare('SELECT * FROM kill_switch WHERE id = 1').get() as Record<string, unknown>;
  const history = JSON.parse(ks.history as string);

  history.push({
    id: uuid(),
    action: 'armed',
    triggeredBy: username,
    reason: reason || 'Manual arm',
    affectedAgents: [],
    timestamp: new Date().toISOString(),
  });

  db.prepare('UPDATE kill_switch SET armed = 1, triggeredBy = ?, reason = ?, triggeredAt = ?, history = ? WHERE id = 1').run(
    username, reason || 'Manual arm', new Date().toISOString(), JSON.stringify(history)
  );

  // Suspend all active agents
  const agents = db.prepare("SELECT id FROM agents WHERE status IN ('active', 'working')").all() as { id: string }[];
  const agentIds = agents.map(a => a.id);

  if (agentIds.length > 0) {
    db.prepare("UPDATE agents SET status = 'suspended' WHERE status IN ('active', 'working')").run();
    db.prepare('UPDATE kill_switch SET affectedAgents = ? WHERE id = 1').run(JSON.stringify(agentIds));
  }

  res.json({ success: true, armed: true, suspendedAgents: agentIds.length });
});

// POST /api/security/kill-switch/disarm
router.post('/kill-switch/disarm', (req: Request, res: Response) => {
  const db = getDb();
  const username = req.user?.username || 'system';

  const ks = db.prepare('SELECT * FROM kill_switch WHERE id = 1').get() as Record<string, unknown>;
  const history = JSON.parse(ks.history as string);
  const affectedAgents = JSON.parse(ks.affectedAgents as string);

  history.push({
    id: uuid(),
    action: 'disarmed',
    triggeredBy: username,
    reason: 'Manual disarm',
    affectedAgents,
    timestamp: new Date().toISOString(),
  });

  // Reactivate suspended agents
  db.prepare("UPDATE agents SET status = 'idle' WHERE status = 'suspended'").run();

  db.prepare("UPDATE kill_switch SET armed = 0, affectedAgents = '[]', history = ? WHERE id = 1").run(JSON.stringify(history));

  res.json({ success: true, armed: false, reactivatedAgents: affectedAgents.length });
});

// ===== Audit Log =====

// GET /api/security/audit
router.get('/audit', (req: Request, res: Response) => {
  const db = getDb();
  const { agentId, riskLevel, limit = '100' } = req.query;

  let query = 'SELECT * FROM audit_log WHERE 1=1';
  const params: unknown[] = [];

  if (agentId) { query += ' AND agentId = ?'; params.push(agentId); }
  if (riskLevel) { query += ' AND riskLevel = ?'; params.push(riskLevel); }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(Number(limit));

  const entries = db.prepare(query).all(...params);
  res.json({ entries });
});

// POST /api/security/audit
router.post('/audit', (req: Request, res: Response) => {
  const db = getDb();
  const { agentId, action, details = '', riskLevel = 'info' } = req.body;

  if (!agentId || !action) {
    res.status(400).json({ error: 'agentId and action are required' });
    return;
  }

  const id = uuid();
  db.prepare('INSERT INTO audit_log (id, agentId, action, details, riskLevel) VALUES (?, ?, ?, ?, ?)').run(
    id, agentId, action, details, riskLevel
  );

  res.status(201).json({ id, agentId, action, details, riskLevel, timestamp: new Date().toISOString() });
});

export default router;
