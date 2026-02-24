import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';
import { broadcast } from '../services/websocket.js';

const router = Router();

// GET /api/notifications
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { read, severity, limit = '50' } = req.query;

  let query = 'SELECT * FROM notifications WHERE 1=1';
  const params: unknown[] = [];

  if (read !== undefined) { query += ' AND read = ?'; params.push(read === 'true' ? 1 : 0); }
  if (severity) { query += ' AND severity = ?'; params.push(severity); }

  query += ' ORDER BY createdAt DESC LIMIT ?';
  params.push(Number(limit));

  const notifications = db.prepare(query).all(...params);
  const unreadCount = (db.prepare('SELECT COUNT(*) as c FROM notifications WHERE read = 0').get() as { c: number }).c;
  res.json({ notifications, unreadCount });
});

// POST /api/notifications
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { type, title, message, severity, targetAgentId } = req.body;
  if (!type || !title || !message) {
    return res.status(400).json({ error: 'type, title, and message are required' });
  }

  const id = uuid();
  db.prepare(
    'INSERT INTO notifications (id, type, title, message, severity, targetAgentId) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, type, title, message, severity || 'info', targetAgentId || null);

  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);

  broadcast({
    type: 'security_event',
    payload: { notification },
    timestamp: new Date().toISOString(),
  }, 'notifications');

  res.status(201).json(notification);
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Notification not found' });
  res.json({ success: true });
});

// POST /api/notifications/read-all
router.post('/read-all', (_req: Request, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET read = 1 WHERE read = 0').run();
  res.json({ success: true });
});

// DELETE /api/notifications/:id
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Notification not found' });
  res.json({ success: true });
});

export default router;

// Helper: create a notification from other modules
export function createNotification(type: string, title: string, message: string, severity = 'info', targetAgentId?: string) {
  try {
    const db = getDb();
    const id = uuid();
    db.prepare(
      'INSERT INTO notifications (id, type, title, message, severity, targetAgentId) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, type, title, message, severity, targetAgentId || null);

    broadcast({
      type: 'security_event',
      payload: { notification: { id, type, title, message, severity, targetAgentId, read: 0, createdAt: new Date().toISOString() } },
      timestamp: new Date().toISOString(),
    }, 'notifications');

    return id;
  } catch {
    return null;
  }
}
