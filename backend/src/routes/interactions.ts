// Interaction-Log endpoints — read-only access to the Phase 1 capture
// layer (evolutionary_agent_system.md §74-101). Writes happen inside
// the execution engine via interactionLogger.ts; here we only expose
// list / detail / aggregate / feedback for consumers.

import { Router, Request, Response } from 'express';
import {
  listInteractions,
  countInteractions,
  aggregateInteractions,
  getInteractionById,
  recordFeedback,
  type InteractionOutcome,
  type FeedbackScore,
} from '../services/interactionLogger.js';

const router = Router();

const ALLOWED_OUTCOMES: InteractionOutcome[] = ['pending', 'success', 'failure', 'cancelled'];

// GET /api/interactions?agentId=&taskId=&outcome=&since=&until=&limit=&offset=
router.get('/', (req: Request, res: Response) => {
  const { agentId, taskId, outcome, since, until, limit, offset } = req.query;
  if (outcome && !ALLOWED_OUTCOMES.includes(outcome as InteractionOutcome)) {
    res.status(400).json({ error: `outcome must be one of ${ALLOWED_OUTCOMES.join(', ')}` });
    return;
  }
  const filter = {
    agentId: typeof agentId === 'string' ? agentId : undefined,
    taskId: typeof taskId === 'string' ? taskId : undefined,
    outcome: typeof outcome === 'string' ? (outcome as InteractionOutcome) : undefined,
    since: typeof since === 'string' ? since : undefined,
    until: typeof until === 'string' ? until : undefined,
    limit: typeof limit === 'string' ? Number(limit) : undefined,
    offset: typeof offset === 'string' ? Number(offset) : undefined,
  };
  const interactions = listInteractions(filter);
  const total = countInteractions(filter);
  res.json({ interactions, total });
});

// GET /api/interactions/:id
router.get('/:id', (req: Request, res: Response) => {
  const row = getInteractionById(String(req.params.id));
  if (!row) {
    res.status(404).json({ error: 'Interaction not found' });
    return;
  }
  res.json(row);
});

// POST /api/interactions/:id/feedback  body: { score: -1 | 0 | 1, text?: string }
router.post('/:id/feedback', (req: Request, res: Response) => {
  const score = Number(req.body?.score);
  if (![-1, 0, 1].includes(score)) {
    res.status(400).json({ error: 'score must be -1, 0, or 1' });
    return;
  }
  const text: string | null = typeof req.body?.text === 'string' ? req.body.text : null;
  const existing = getInteractionById(String(req.params.id));
  if (!existing) {
    res.status(404).json({ error: 'Interaction not found' });
    return;
  }
  recordFeedback(String(req.params.id), score as FeedbackScore, text);
  const refreshed = getInteractionById(String(req.params.id));
  res.json(refreshed);
});

// GET /api/interactions/agent/:agentId/aggregates?since=
router.get('/agent/:agentId/aggregates', (req: Request, res: Response) => {
  const { since } = req.query;
  const aggregates = aggregateInteractions({
    agentId: String(req.params.agentId),
    since: typeof since === 'string' ? since : undefined,
  });
  res.json(aggregates);
});

export default router;
