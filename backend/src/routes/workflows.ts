import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';

const router = Router();

function parseWorkflow(row: Record<string, unknown>) {
  return {
    ...row,
    steps: JSON.parse(row.steps as string),
    tags: JSON.parse(row.tags as string),
  };
}

// GET /api/workflows
router.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const workflows = db.prepare('SELECT * FROM workflows ORDER BY createdAt DESC').all().map(w => parseWorkflow(w as Record<string, unknown>));
  res.json({ workflows });
});

// GET /api/workflows/:id
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;

  if (!workflow) { res.status(404).json({ error: 'Workflow not found' }); return; }
  res.json(parseWorkflow(workflow));
});

// POST /api/workflows
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { name, description = '', steps = [], tags = [] } = req.body;

  if (!name) { res.status(400).json({ error: 'name is required' }); return; }

  // Ensure each step has an ID
  const processedSteps = steps.map((s: Record<string, unknown>) => ({
    id: s.id || uuid(),
    name: s.name || 'Unnamed Step',
    description: s.description || '',
    assignedAgentId: s.assignedAgentId || null,
    status: 'pending',
    dependsOn: s.dependsOn || [],
    output: null,
    progress: 0,
    estimatedDuration: s.estimatedDuration || 60,
    retries: 0,
  }));

  const id = uuid();
  db.prepare(`
    INSERT INTO workflows (id, name, description, steps, createdBy, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, description, JSON.stringify(processedSteps), req.user?.username || 'system', JSON.stringify(tags));

  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(id) as Record<string, unknown>;
  res.status(201).json(parseWorkflow(workflow));
});

// POST /api/workflows/:id/start
router.post('/:id/start', (req: Request, res: Response) => {
  const db = getDb();
  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;

  if (!workflow) { res.status(404).json({ error: 'Workflow not found' }); return; }

  const steps = JSON.parse(workflow.steps as string);

  // Start first step(s) that have no dependencies
  for (const step of steps) {
    if (step.dependsOn.length === 0) {
      step.status = 'running';
      step.startedAt = new Date().toISOString();
    }
  }

  db.prepare("UPDATE workflows SET status = 'running', startedAt = ?, steps = ? WHERE id = ?").run(
    new Date().toISOString(), JSON.stringify(steps), req.params.id
  );

  const updated = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json(parseWorkflow(updated));
});

// POST /api/workflows/:id/pause
router.post('/:id/pause', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare("UPDATE workflows SET status = 'paused' WHERE id = ? AND status = 'running'").run(req.params.id);

  if (result.changes === 0) { res.status(400).json({ error: 'Workflow not running' }); return; }

  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json(parseWorkflow(workflow));
});

// POST /api/workflows/:id/steps/:stepId/complete
router.post('/:id/steps/:stepId/complete', (req: Request, res: Response) => {
  const db = getDb();
  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;

  if (!workflow) { res.status(404).json({ error: 'Workflow not found' }); return; }

  const steps = JSON.parse(workflow.steps as string);
  const stepIdx = steps.findIndex((s: Record<string, unknown>) => s.id === req.params.stepId);

  if (stepIdx === -1) { res.status(404).json({ error: 'Step not found' }); return; }

  steps[stepIdx].status = 'completed';
  steps[stepIdx].progress = 100;
  steps[stepIdx].completedAt = new Date().toISOString();
  steps[stepIdx].output = req.body.output || 'Step completed successfully';

  // Start dependent steps
  for (const step of steps) {
    if (step.status === 'pending' && step.dependsOn.includes(req.params.stepId)) {
      const allDepsMet = step.dependsOn.every((depId: string) => {
        const dep = steps.find((s: Record<string, unknown>) => s.id === depId);
        return dep && dep.status === 'completed';
      });
      if (allDepsMet) {
        step.status = 'running';
        step.startedAt = new Date().toISOString();
      }
    }
  }

  // Check if all steps are done
  const allDone = steps.every((s: Record<string, unknown>) => s.status === 'completed' || s.status === 'skipped');
  if (allDone) {
    db.prepare("UPDATE workflows SET status = 'completed', completedAt = ?, steps = ? WHERE id = ?").run(
      new Date().toISOString(), JSON.stringify(steps), req.params.id
    );
  } else {
    db.prepare('UPDATE workflows SET steps = ? WHERE id = ?').run(JSON.stringify(steps), req.params.id);
  }

  const updated = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json(parseWorkflow(updated));
});

// PATCH /api/workflows/:id
router.patch('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const updates: string[] = [];
  const params: unknown[] = [];

  if (req.body.name) { updates.push('name = ?'); params.push(req.body.name); }
  if (req.body.description) { updates.push('description = ?'); params.push(req.body.description); }
  if (req.body.steps) { updates.push('steps = ?'); params.push(JSON.stringify(req.body.steps)); }
  if (req.body.tags) { updates.push('tags = ?'); params.push(JSON.stringify(req.body.tags)); }

  if (updates.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }

  params.push(req.params.id);
  const result = db.prepare(`UPDATE workflows SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  if (result.changes === 0) { res.status(404).json({ error: 'Workflow not found' }); return; }

  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json(parseWorkflow(workflow));
});

// DELETE /api/workflows/:id
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM workflows WHERE id = ?').run(req.params.id);

  if (result.changes === 0) { res.status(404).json({ error: 'Workflow not found' }); return; }
  res.json({ success: true });
});

export default router;
