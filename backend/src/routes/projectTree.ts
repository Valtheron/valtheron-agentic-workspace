import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';

const router = Router();

interface TreeRow {
  id: string;
  parentId: string | null;
  name: string;
  type: string;
  status: string;
  progress: number;
  agentId: string | null;
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface TreeNode extends TreeRow {
  children: TreeNode[];
}

function buildTree(rows: TreeRow[], parentId: string | null = null): TreeNode[] {
  return rows
    .filter(r => r.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(r => ({ ...r, children: buildTree(rows, r.id) }));
}

// GET /api/project-tree — get full tree
router.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM project_tree ORDER BY sortOrder ASC').all() as TreeRow[];

  // If empty, seed a default tree
  if (rows.length === 0) {
    seedDefaultTree(db);
    const seeded = db.prepare('SELECT * FROM project_tree ORDER BY sortOrder ASC').all() as TreeRow[];
    return res.json({ tree: buildTree(seeded) });
  }

  res.json({ tree: buildTree(rows) });
});

// GET /api/project-tree/flat — get flat list
router.get('/flat', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM project_tree ORDER BY sortOrder ASC').all();
  res.json({ nodes: rows });
});

// POST /api/project-tree — create node
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { parentId, name, type, status, progress, agentId, description, sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const id = uuid();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO project_tree (id, parentId, name, type, status, progress, agentId, description, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, parentId || null, name, type || 'module', status || 'active', progress || 0, agentId || null, description || '', sortOrder || 0, now, now);

  const node = db.prepare('SELECT * FROM project_tree WHERE id = ?').get(id);
  res.status(201).json(node);
});

// PATCH /api/project-tree/:id — update node
router.patch('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { name, type, status, progress, agentId, description, sortOrder, parentId } = req.body;
  const updates: string[] = [];
  const values: unknown[] = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (type !== undefined) { updates.push('type = ?'); values.push(type); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  if (progress !== undefined) { updates.push('progress = ?'); values.push(progress); }
  if (agentId !== undefined) { updates.push('agentId = ?'); values.push(agentId); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (sortOrder !== undefined) { updates.push('sortOrder = ?'); values.push(sortOrder); }
  if (parentId !== undefined) { updates.push('parentId = ?'); values.push(parentId); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  updates.push('updatedAt = ?');
  values.push(new Date().toISOString());
  values.push(req.params.id);

  const result = db.prepare(`UPDATE project_tree SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  if (result.changes === 0) return res.status(404).json({ error: 'Node not found' });

  const node = db.prepare('SELECT * FROM project_tree WHERE id = ?').get(req.params.id);
  res.json(node);
});

// DELETE /api/project-tree/:id — delete node and all children
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();

  // Recursively collect IDs to delete
  function collectIds(parentId: string): string[] {
    const children = db.prepare('SELECT id FROM project_tree WHERE parentId = ?').all(parentId) as { id: string }[];
    const ids = [parentId];
    for (const child of children) {
      ids.push(...collectIds(child.id));
    }
    return ids;
  }

  const nodeId = req.params.id as string;
  const ids = collectIds(nodeId);
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM project_tree WHERE id IN (${placeholders})`).run(...ids);

  res.json({ success: true, deletedCount: ids.length });
});

function seedDefaultTree(db: ReturnType<typeof getDb>) {
  const now = new Date().toISOString();
  const rootId = uuid();

  const nodes = [
    { id: rootId, parentId: null, name: 'Valtheron Workspace', type: 'project', status: 'active', progress: 45, sortOrder: 0 },
    { id: uuid(), parentId: rootId, name: 'Backend API', type: 'module', status: 'active', progress: 70, sortOrder: 1 },
    { id: uuid(), parentId: rootId, name: 'Frontend Dashboard', type: 'module', status: 'active', progress: 60, sortOrder: 2 },
    { id: uuid(), parentId: rootId, name: 'Agent System', type: 'module', status: 'active', progress: 55, sortOrder: 3 },
    { id: uuid(), parentId: rootId, name: 'Security & Auth', type: 'module', status: 'in_progress', progress: 35, sortOrder: 4 },
    { id: uuid(), parentId: rootId, name: 'Testing & QA', type: 'module', status: 'in_progress', progress: 20, sortOrder: 5 },
    { id: uuid(), parentId: rootId, name: 'Documentation', type: 'module', status: 'planned', progress: 10, sortOrder: 6 },
  ];

  const stmt = db.prepare(
    'INSERT INTO project_tree (id, parentId, name, type, status, progress, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  for (const n of nodes) {
    stmt.run(n.id, n.parentId, n.name, n.type, n.status, n.progress, n.sortOrder, now, now);
  }
}

export default router;
