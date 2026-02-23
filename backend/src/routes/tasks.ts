import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';

const router = Router();

function parseTask(row: Record<string, unknown>) {
  return {
    ...row,
    dependencies: JSON.parse(row.dependencies as string),
    tags: JSON.parse(row.tags as string),
  };
}

// GET /api/tasks
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { status, category, kanbanColumn, assignedAgentId, priority, limit = '100', offset = '0' } = req.query;

  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params: unknown[] = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (kanbanColumn) { query += ' AND kanbanColumn = ?'; params.push(kanbanColumn); }
  if (assignedAgentId) { query += ' AND assignedAgentId = ?'; params.push(assignedAgentId); }
  if (priority) { query += ' AND priority = ?'; params.push(priority); }

  query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const tasks = db.prepare(query).all(...params).map(t => parseTask(t as Record<string, unknown>));
  res.json({ tasks });
});

// GET /api/tasks/:id
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;

  if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
  res.json(parseTask(task));
});

// POST /api/tasks
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { title, description = '', category, priority = 'medium', assignedAgentId, taskType = 'feature', tags = [], kanbanColumn = 'backlog', estimatedHours } = req.body;

  if (!title || !category) {
    res.status(400).json({ error: 'title and category are required' });
    return;
  }

  const id = uuid();
  db.prepare(`
    INSERT INTO tasks (id, title, description, category, priority, assignedAgentId, taskType, tags, kanbanColumn, estimatedHours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description, category, priority, assignedAgentId || null, taskType, JSON.stringify(tags), kanbanColumn, estimatedHours || null);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown>;
  res.status(201).json(parseTask(task));
});

// PATCH /api/tasks/:id
router.patch('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

  if (!existing) { res.status(404).json({ error: 'Task not found' }); return; }

  const updates: string[] = [];
  const params: unknown[] = [];
  const allowed = ['title', 'description', 'status', 'priority', 'assignedAgentId', 'kanbanColumn', 'taskType', 'progress', 'estimatedHours', 'actualHours', 'deadline'];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates.push(`${key} = ?`);
      params.push(req.body[key]);
    }
  }

  if (req.body.tags) {
    updates.push('tags = ?');
    params.push(JSON.stringify(req.body.tags));
  }

  // Auto-set completedAt
  if (req.body.status === 'completed') {
    updates.push('completedAt = ?');
    params.push(new Date().toISOString());
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  params.push(req.params.id);
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json(parseTask(task));
});

// DELETE /api/tasks/:id
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);

  if (result.changes === 0) { res.status(404).json({ error: 'Task not found' }); return; }
  res.json({ success: true });
});

// PATCH /api/tasks/:id/move  (Kanban drag & drop)
router.patch('/:id/move', (req: Request, res: Response) => {
  const db = getDb();
  const { kanbanColumn } = req.body;

  if (!kanbanColumn) {
    res.status(400).json({ error: 'kanbanColumn is required' });
    return;
  }

  const statusMap: Record<string, string> = {
    backlog: 'pending',
    todo: 'pending',
    in_progress: 'in_progress',
    review: 'in_progress',
    done: 'completed',
  };

  const result = db.prepare('UPDATE tasks SET kanbanColumn = ?, status = ? WHERE id = ?').run(
    kanbanColumn, statusMap[kanbanColumn] || 'pending', req.params.id
  );

  if (result.changes === 0) { res.status(404).json({ error: 'Task not found' }); return; }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json(parseTask(task));
});

// GET /api/tasks/stats/overview
router.get('/stats/overview', (_req: Request, res: Response) => {
  const db = getDb();

  const total = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM tasks GROUP BY status').all();
  const byPriority = db.prepare('SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority').all();
  const byCategory = db.prepare('SELECT category, COUNT(*) as count FROM tasks GROUP BY category').all();
  const byKanban = db.prepare('SELECT kanbanColumn, COUNT(*) as count FROM tasks GROUP BY kanbanColumn').all();

  res.json({ total: total.count, byStatus, byPriority, byCategory, byKanban });
});

export default router;
