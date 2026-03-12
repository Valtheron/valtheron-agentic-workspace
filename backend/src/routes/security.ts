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

  if (severity) {
    query += ' AND severity = ?';
    params.push(severity);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (resolved !== undefined) {
    query += ' AND resolved = ?';
    params.push(resolved === 'true' ? 1 : 0);
  }

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
    id,
    type,
    severity,
    message,
    agentId || null,
  );

  const event = db.prepare('SELECT * FROM security_events WHERE id = ?').get(id);
  res.status(201).json(event);
});

// PATCH /api/security/events/:id/resolve
router.patch('/events/:id/resolve', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('UPDATE security_events SET resolved = 1 WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json({ success: true });
});

// ===== Kill Switch =====

// GET /api/security/kill-switch
router.get('/kill-switch', (_req: Request, res: Response) => {
  const db = getDb();
  const ks = db.prepare('SELECT * FROM kill_switch WHERE id = 1').get() as Record<string, unknown>;

  res.json({
    aktiv: Boolean(ks.aktiv),
    triggeredAt: ks.triggeredAt,
    triggeredBy: ks.triggeredBy,
    reason: ks.reason,
    affectedAgents: JSON.parse(ks.affectedAgents as string),
    autoTriggerRules: JSON.parse(ks.autoTriggerRules as string),
    history: JSON.parse(ks.history as string),
  });
});

// POST /api/security/kill-switch/aktivieren
router.post('/kill-switch/aktivieren', (req: Request, res: Response) => {
  const db = getDb();
  const { reason } = req.body;
  const username = req.user?.username || 'system';

  const ks = db.prepare('SELECT * FROM kill_switch WHERE id = 1').get() as Record<string, unknown>;
  const history = JSON.parse(ks.history as string);

  history.push({
    id: uuid(),
    action: 'aktiviert',
    triggeredBy: username,
    reason: reason || 'Manuell aktiviert',
    affectedAgents: [],
    timestamp: new Date().toISOString(),
  });

  db.prepare(
    'UPDATE kill_switch SET aktiv = 1, triggeredBy = ?, reason = ?, triggeredAt = ?, history = ? WHERE id = 1',
  ).run(username, reason || 'Manuell aktiviert', new Date().toISOString(), JSON.stringify(history));

  // Suspend all active agents
  const agents = db.prepare("SELECT id FROM agents WHERE status IN ('active', 'working')").all() as { id: string }[];
  const agentIds = agents.map((a) => a.id);

  if (agentIds.length > 0) {
    db.prepare("UPDATE agents SET status = 'suspended' WHERE status IN ('active', 'working')").run();
    db.prepare('UPDATE kill_switch SET affectedAgents = ? WHERE id = 1').run(JSON.stringify(agentIds));
  }

  res.json({ success: true, aktiv: true, suspendedAgents: agentIds.length });
});

// POST /api/security/kill-switch/deaktivieren
router.post('/kill-switch/deaktivieren', (req: Request, res: Response) => {
  const db = getDb();
  const username = req.user?.username || 'system';

  const ks = db.prepare('SELECT * FROM kill_switch WHERE id = 1').get() as Record<string, unknown>;
  const history = JSON.parse(ks.history as string);
  const affectedAgents = JSON.parse(ks.affectedAgents as string);

  history.push({
    id: uuid(),
    action: 'deaktiviert',
    triggeredBy: username,
    reason: 'Manuell deaktiviert',
    affectedAgents,
    timestamp: new Date().toISOString(),
  });

  // Reactivate suspended agents
  db.prepare("UPDATE agents SET status = 'idle' WHERE status = 'suspended'").run();

  db.prepare("UPDATE kill_switch SET aktiv = 0, affectedAgents = '[]', history = ? WHERE id = 1").run(
    JSON.stringify(history),
  );

  res.json({ success: true, aktiv: false, reactivatedAgents: affectedAgents.length });
});

// ===== Audit Log =====

// GET /api/security/audit
router.get('/audit', (req: Request, res: Response) => {
  const db = getDb();
  const { agentId, riskLevel, limit = '100' } = req.query;

  let query = 'SELECT * FROM audit_log WHERE 1=1';
  const params: unknown[] = [];

  if (agentId) {
    query += ' AND agentId = ?';
    params.push(agentId);
  }
  if (riskLevel) {
    query += ' AND riskLevel = ?';
    params.push(riskLevel);
  }

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
    id,
    agentId,
    action,
    details,
    riskLevel,
  );

  res.status(201).json({ id, agentId, action, details, riskLevel, timestamp: new Date().toISOString() });
});

export default router;

// GET /api/security/audit/export — CSV download
router.get('/audit/export', (req: Request, res: Response) => {
  const db = getDb();
  const { agentId, riskLevel } = req.query;

  let query = 'SELECT * FROM audit_log WHERE 1=1';
  const params: unknown[] = [];
  if (agentId) {
    query += ' AND agentId = ?';
    params.push(agentId);
  }
  if (riskLevel) {
    query += ' AND riskLevel = ?';
    params.push(riskLevel);
  }
  query += ' ORDER BY timestamp DESC';

  const entries = db.prepare(query).all(...params) as Array<Record<string, unknown>>;

  const header = 'id,agentId,action,riskLevel,timestamp,details\n';
  const rows = entries.map((e) => {
    const details = String(e.details || '').replace(/"/g, '""');
    const action = String(e.action || '').replace(/"/g, '""');
    return `"${e.id}","${e.agentId}","${action}","${e.riskLevel}","${e.timestamp}","${details}"`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
  res.send(header + rows.join('\n'));
});

// ===== Auto-Trigger Rules Management =====

// GET /api/security/kill-switch/auto-trigger-rules
router.get('/kill-switch/auto-trigger-rules', (_req: Request, res: Response) => {
  const db = getDb();
  const ks = db.prepare('SELECT autoTriggerRules FROM kill_switch WHERE id = 1').get() as { autoTriggerRules: string };
  res.json({ rules: JSON.parse(ks?.autoTriggerRules || '[]') });
});

// PUT /api/security/kill-switch/auto-trigger-rules — replace all rules
router.put('/kill-switch/auto-trigger-rules', (req: Request, res: Response) => {
  const db = getDb();
  const { rules } = req.body;
  if (!Array.isArray(rules)) {
    res.status(400).json({ error: 'rules must be an array' });
    return;
  }
  db.prepare('UPDATE kill_switch SET autoTriggerRules = ? WHERE id = 1').run(JSON.stringify(rules));
  res.json({ rules });
});

// PATCH /api/security/kill-switch/auto-trigger-rules/:ruleId — toggle enable/disable
router.patch('/kill-switch/auto-trigger-rules/:ruleId', (req: Request, res: Response) => {
  const db = getDb();
  const ks = db.prepare('SELECT autoTriggerRules FROM kill_switch WHERE id = 1').get() as { autoTriggerRules: string };
  const rules = JSON.parse(ks?.autoTriggerRules || '[]') as Array<{ id: string; enabled: boolean }>;
  const idx = rules.findIndex((r) => r.id === req.params.ruleId);
  if (idx === -1) {
    res.status(404).json({ error: 'Rule not found' });
    return;
  }
  Object.assign(rules[idx], req.body);
  db.prepare('UPDATE kill_switch SET autoTriggerRules = ? WHERE id = 1').run(JSON.stringify(rules));
  res.json(rules[idx]);
});
