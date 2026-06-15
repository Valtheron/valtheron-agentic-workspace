import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema.js';
import { computeCertification, type CertificationInput } from '../services/certificationScoring.js';

const router = Router();

interface AgentRow {
  id: string;
  name: string;
  status: string;
  successRate: number;
  tasksCompleted: number;
  failedTasks: number;
  systemPrompt: string | null;
  createdAt: string | null;
  lastActivity: string | null;
  testResults: string | null;
}

interface ProfileRow {
  agentId: string;
  status: string;
  profile: string | null;
}

/**
 * Assemble the real-signal inputs for one or all agents. The certification
 * itself is derived deterministically in computeCertification() — this layer
 * only reads the persisted agent rows + computed capability/Forseti profiles.
 */
function buildInputs(agentId?: string): CertificationInput[] {
  const db = getDb();
  const where = agentId ? ' WHERE id = ?' : '';
  const agentArgs = agentId ? [agentId] : [];
  const agents = db
    .prepare(
      `SELECT id, name, status, successRate, tasksCompleted, failedTasks, systemPrompt, createdAt, lastActivity, testResults
       FROM agents${where}`,
    )
    .all(...agentArgs) as AgentRow[];

  const capRows = db.prepare('SELECT agentId, status, profile FROM agent_capabilities').all() as ProfileRow[];
  const forRows = db.prepare('SELECT agentId, status, profile FROM agent_forseti_profiles').all() as ProfileRow[];
  const capMap = new Map(capRows.map((r) => [r.agentId, r]));
  const forMap = new Map(forRows.map((r) => [r.agentId, r]));

  return agents.map((a) => {
    let capabilityComputed = false;
    let capabilityAvg: number | null = null;
    const cap = capMap.get(a.id);
    if (cap && cap.status === 'computed' && cap.profile) {
      const p = JSON.parse(cap.profile) as { layers?: Array<{ score: number }> };
      const layers = p.layers ?? [];
      capabilityComputed = true;
      capabilityAvg = layers.length ? layers.reduce((s, l) => s + l.score, 0) / layers.length : null;
    }

    let forsetiComputed = false;
    let forsetiUnifiedLevel: number | null = null;
    const f = forMap.get(a.id);
    if (f && f.status === 'computed' && f.profile) {
      const p = JSON.parse(f.profile) as { unified_level: number };
      forsetiComputed = true;
      forsetiUnifiedLevel = p.unified_level;
    }

    const testResults = (
      JSON.parse(a.testResults ?? '[]') as Array<{ category: string; name: string; passed: boolean }>
    ).map((t) => ({ category: t.category, name: t.name, passed: t.passed }));

    return {
      id: a.id,
      name: a.name,
      agentStatus: a.status,
      successRate: a.successRate,
      tasksCompleted: a.tasksCompleted,
      failedTasks: a.failedTasks,
      systemPrompt: a.systemPrompt ?? '',
      createdAt: a.createdAt,
      lastActivity: a.lastActivity,
      testResults,
      capabilityComputed,
      capabilityAvg,
      forsetiComputed,
      forsetiUnifiedLevel,
    };
  });
}

// GET /api/certifications — one deterministic certification per agent.
router.get('/', (_req: Request, res: Response) => {
  const certifications = buildInputs().map((i) => computeCertification(i));
  res.json({ certifications, total: certifications.length });
});

// GET /api/certifications/:agentId
router.get('/:agentId', (req: Request, res: Response) => {
  const inputs = buildInputs(String(req.params.agentId));
  if (inputs.length === 0) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  res.json(computeCertification(inputs[0]));
});

export default router;
