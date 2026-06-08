import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import fs from 'node:fs';
import { getDb, closeDb } from '../db/schema.js';
import {
  startInteraction,
  finishInteraction,
  recordFeedback,
  listInteractions,
  countInteractions,
  aggregateInteractions,
  getInteractionById,
  ensureCurrentVersion,
} from '../services/interactionLogger.js';
import { v4 as uuid } from 'uuid';

const TEST_DB = '/tmp/valtheron-interactions-test.db';

let agentId: string;
let taskId: string;

beforeAll(() => {
  process.env.VALTHERON_DB_PATH = TEST_DB;
  closeDb();
  // Force a clean DB for this test file.
  for (const suffix of ['', '-wal', '-shm']) {
    try {
      fs.unlinkSync(TEST_DB + suffix);
    } catch {
      /* ok */
    }
  }
  const db = getDb();
  agentId = uuid();
  db.prepare(
    `INSERT INTO agents (id, name, role, category, status, systemPrompt, personality, parameters)
     VALUES (?, 'Test Agent', 'tester', 'qa', 'idle', 'You are a test.', '{"creativity":50}', '{"temperature":0.7}')`,
  ).run(agentId);
  taskId = uuid();
  db.prepare(`INSERT INTO tasks (id, title, category, assignedAgentId) VALUES (?, 'Test Task', 'qa', ?)`).run(
    taskId,
    agentId,
  );
});

beforeEach(() => {
  const db = getDb();
  db.exec('DELETE FROM agent_interactions');
});

describe('interactionLogger — Phase 1 capture', () => {
  it('startInteraction creates a pending row anchored to a version', () => {
    const { interactionId, agentVersionId } = startInteraction({
      agentId,
      taskId,
      requestPrompt: 'hello',
    });
    expect(interactionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(agentVersionId).toMatch(/^[0-9a-f-]{36}$/);
    const row = getInteractionById(interactionId);
    expect(row?.outcome).toBe('pending');
    expect(row?.requestPrompt).toBe('hello');
    expect(row?.finishedAt).toBeNull();
  });

  it('finishInteraction(success) populates response, duration, outcome', async () => {
    const { interactionId } = startInteraction({
      agentId,
      taskId,
      requestPrompt: 'test',
    });
    await new Promise((r) => setTimeout(r, 5));
    finishInteraction(interactionId, {
      outcome: 'success',
      responseContent: 'done',
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      costUsd: 0.0012,
    });
    const row = getInteractionById(interactionId);
    expect(row?.outcome).toBe('success');
    expect(row?.responseContent).toBe('done');
    expect(row?.totalTokens).toBe(150);
    expect(row?.costUsd).toBeCloseTo(0.0012);
    expect(row?.durationMs).toBeGreaterThanOrEqual(0);
    expect(row?.finishedAt).not.toBeNull();
  });

  it('finishInteraction(failure) records error class and message', () => {
    const { interactionId } = startInteraction({ agentId, requestPrompt: 'fails' });
    finishInteraction(interactionId, {
      outcome: 'failure',
      errorClass: 'LLMError',
      errorMessage: 'rate limit',
    });
    const row = getInteractionById(interactionId);
    expect(row?.outcome).toBe('failure');
    expect(row?.errorClass).toBe('LLMError');
    expect(row?.errorMessage).toBe('rate limit');
    expect(row?.responseContent).toBeNull();
  });

  it('finishInteraction is idempotent — second call is ignored', () => {
    const { interactionId } = startInteraction({ agentId, requestPrompt: 'idem' });
    finishInteraction(interactionId, { outcome: 'success', responseContent: 'first' });
    finishInteraction(interactionId, { outcome: 'failure', errorMessage: 'second' });
    const row = getInteractionById(interactionId);
    expect(row?.outcome).toBe('success');
    expect(row?.responseContent).toBe('first');
    expect(row?.errorMessage).toBeNull();
  });

  it('recordFeedback stores score + text + timestamp', () => {
    const { interactionId } = startInteraction({ agentId, requestPrompt: 'fb' });
    finishInteraction(interactionId, { outcome: 'success', responseContent: 'r' });
    recordFeedback(interactionId, 1, 'Helpful');
    const row = getInteractionById(interactionId);
    expect(row?.feedbackScore).toBe(1);
    expect(row?.feedbackText).toBe('Helpful');
    expect(row?.feedbackAt).toBeTruthy();
  });

  it('listInteractions filters by agentId, outcome, and supports pagination', () => {
    for (let i = 0; i < 5; i++) {
      const { interactionId } = startInteraction({ agentId, requestPrompt: `p${i}` });
      finishInteraction(interactionId, { outcome: i % 2 === 0 ? 'success' : 'failure' });
    }
    const success = listInteractions({ agentId, outcome: 'success' });
    expect(success).toHaveLength(3);
    expect(success.every((r) => r.outcome === 'success')).toBe(true);

    const limited = listInteractions({ agentId, limit: 2 });
    expect(limited).toHaveLength(2);

    expect(countInteractions({ agentId })).toBe(5);
  });

  it('aggregateInteractions returns success rate, averages, and feedback counts', () => {
    for (let i = 0; i < 4; i++) {
      const { interactionId } = startInteraction({ agentId, requestPrompt: `p${i}` });
      finishInteraction(interactionId, {
        outcome: i < 3 ? 'success' : 'failure',
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.001,
      });
      if (i < 2) recordFeedback(interactionId, 1);
      if (i === 3) recordFeedback(interactionId, -1);
    }
    const agg = aggregateInteractions({ agentId });
    expect(agg.total).toBe(4);
    expect(agg.success).toBe(3);
    expect(agg.failure).toBe(1);
    expect(agg.successRate).toBe(75);
    expect(agg.avgInputTokens).toBe(100);
    expect(agg.avgOutputTokens).toBe(50);
    expect(agg.totalCostUsd).toBeCloseTo(0.004);
    expect(agg.feedbackPositive).toBe(2);
    expect(agg.feedbackNegative).toBe(1);
  });
});

describe('agent_versions registry', () => {
  it('ensureCurrentVersion creates a new row on first call (v1.0.0)', () => {
    const versionId = ensureCurrentVersion(agentId);
    const db = getDb();
    const row = db.prepare('SELECT * FROM agent_versions WHERE id = ?').get(versionId) as {
      version: string;
      systemPromptHash: string;
      retiredAt: string | null;
    };
    expect(row.version).toMatch(/^1\.0\.\d+$/);
    expect(row.systemPromptHash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.retiredAt).toBeNull();
  });

  it('ensureCurrentVersion is stable when nothing changed (returns same id)', () => {
    const a = ensureCurrentVersion(agentId);
    const b = ensureCurrentVersion(agentId);
    expect(a).toBe(b);
  });

  it('ensureCurrentVersion bumps patch + retires old when systemPrompt changes', () => {
    const db = getDb();
    const before = ensureCurrentVersion(agentId);
    db.prepare('UPDATE agents SET systemPrompt = ? WHERE id = ?').run('A new prompt', agentId);
    const after = ensureCurrentVersion(agentId);
    expect(after).not.toBe(before);
    const oldRow = db.prepare('SELECT retiredAt FROM agent_versions WHERE id = ?').get(before) as { retiredAt: string };
    expect(oldRow.retiredAt).toBeTruthy();
    const newRow = db.prepare('SELECT version, evolutionTrigger FROM agent_versions WHERE id = ?').get(after) as {
      version: string;
      evolutionTrigger: string;
    };
    expect(newRow.version).toMatch(/^1\.0\.\d+$/);
    expect(newRow.evolutionTrigger).toMatch(/changed/);
  });
});
