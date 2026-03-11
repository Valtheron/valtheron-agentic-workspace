import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp, initDatabase } from '../app.js';
import { executeWorkflow, isWorkflowRunning } from '../services/workflowEngine.js';
import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';

// Mock LLM so tests don't make real API calls
vi.mock('../services/llmClient.js', () => ({
  callLLM: vi.fn().mockResolvedValue('LLM-Ergebnis für diesen Schritt'),
}));

// Mock WebSocket broadcast
vi.mock('../services/websocket.js', () => ({
  broadcast: vi.fn(),
}));

// ── Helpers ──────────────────────────────────────────────────────────

function makeStep(overrides: Partial<{
  id: string; name: string; description: string;
  assignedAgentId: string | null; dependsOn: string[];
}> = {}) {
  return {
    id: uuid(),
    name: 'Test Schritt',
    description: 'Ein einfacher Schritt',
    assignedAgentId: null,
    status: 'pending',
    dependsOn: [],
    output: null,
    progress: 0,
    estimatedDuration: 60,
    retries: 0,
    ...overrides,
  };
}

function insertWorkflow(name: string, steps: object[]) {
  const db = getDb();
  const id = uuid();
  db.prepare(
    `INSERT INTO workflows (id, name, description, status, steps, createdAt)
     VALUES (?, ?, '', 'pending', ?, datetime('now'))`,
  ).run(id, name, JSON.stringify(steps));
  return id;
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('isWorkflowRunning', () => {
  it('gibt false zurück für unbekannte ID', () => {
    expect(isWorkflowRunning('nicht-vorhanden')).toBe(false);
  });
});

describe('executeWorkflow', () => {
  beforeEach(() => {
    createApp();
    initDatabase();
    vi.clearAllMocks();
  });

  it('tut nichts wenn Workflow nicht existiert', async () => {
    await expect(executeWorkflow('nicht-vorhanden')).resolves.toBeUndefined();
  });

  it('führt einfachen Workflow mit einem Schritt aus', async () => {
    const step = makeStep({ name: 'Analyse' });
    const wfId = insertWorkflow('Test Workflow', [step]);

    await executeWorkflow(wfId, { apiKey: 'test-key', provider: 'anthropic' });

    const db = getDb();
    const wf = db.prepare('SELECT status, steps FROM workflows WHERE id = ?').get(wfId) as
      | { status: string; steps: string }
      | undefined;

    expect(wf?.status).toBe('completed');
    const finalSteps = JSON.parse(wf!.steps);
    expect(finalSteps[0].status).toBe('completed');
    expect(finalSteps[0].output).toBe('LLM-Ergebnis für diesen Schritt');
  });

  it('verhindert doppelte Ausführung desselben Workflows', async () => {
    const { callLLM } = await import('../services/llmClient.js');
    let resolveFirst!: () => void;
    const first = new Promise<void>((r) => { resolveFirst = r; });

    (callLLM as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => {
      await first;
      return 'done';
    });

    const step = makeStep();
    const wfId = insertWorkflow('Double-Run Test', [step]);

    const run1 = executeWorkflow(wfId, { apiKey: 'key' });
    const run2 = executeWorkflow(wfId, { apiKey: 'key' });

    resolveFirst();
    await Promise.all([run1, run2]);

    // LLM should only have been called once
    expect(callLLM).toHaveBeenCalledTimes(1);
  });

  it('markiert Schritt als failed wenn kein API-Key vorhanden', async () => {
    const step = makeStep({ name: 'Kein Key' });
    const wfId = insertWorkflow('No-Key Workflow', [step]);

    // No apiKey, no env var
    const origKey = process.env.LLM_API_KEY;
    const origAnthKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.LLM_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    await executeWorkflow(wfId);

    process.env.LLM_API_KEY = origKey;
    process.env.ANTHROPIC_API_KEY = origAnthKey;

    const db = getDb();
    const wf = db.prepare('SELECT steps FROM workflows WHERE id = ?').get(wfId) as { steps: string };
    const steps = JSON.parse(wf.steps);
    expect(steps[0].status).toBe('failed');
    expect(steps[0].error).toBe('No API key configured');
  });

  it('führt unabhängige Schritte parallel aus', async () => {
    const step1 = makeStep({ id: 'step-1', name: 'Schritt 1' });
    const step2 = makeStep({ id: 'step-2', name: 'Schritt 2' });
    const wfId = insertWorkflow('Paralleler Workflow', [step1, step2]);

    await executeWorkflow(wfId, { apiKey: 'key' });

    const db = getDb();
    const wf = db.prepare('SELECT status, steps FROM workflows WHERE id = ?').get(wfId) as
      { status: string; steps: string };

    expect(wf.status).toBe('completed');
    const steps = JSON.parse(wf.steps);
    expect(steps.every((s: { status: string }) => s.status === 'completed')).toBe(true);
  });

  it('führt Schritte in Dependency-Reihenfolge aus', async () => {
    const order: string[] = [];
    const { callLLM } = await import('../services/llmClient.js');
    (callLLM as ReturnType<typeof vi.fn>).mockImplementation(async (opts) => {
      order.push(opts.messages[0].content);
      return `Ergebnis: ${opts.messages[0].content}`;
    });

    const step1 = makeStep({ id: 'dep-1', name: 'Erster' });
    const step2 = makeStep({ id: 'dep-2', name: 'Zweiter', dependsOn: ['dep-1'] });
    const wfId = insertWorkflow('Sequential Workflow', [step1, step2]);

    await executeWorkflow(wfId, { apiKey: 'key' });

    // step1 must be called before step2
    expect(order[0]).toContain('Erster');
    expect(order[1]).toContain('Zweiter');
  });

  it('überspringt Schritte wenn Dependency fehlschlägt', async () => {
    const { callLLM } = await import('../services/llmClient.js');
    (callLLM as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('LLM Fehler'));

    const step1 = makeStep({ id: 'fail-1', name: 'Fehlschlagender Schritt' });
    const step2 = makeStep({ id: 'skip-1', name: 'Übersprungener Schritt', dependsOn: ['fail-1'] });
    const wfId = insertWorkflow('Fail-Skip Workflow', [step1, step2]);

    await executeWorkflow(wfId, { apiKey: 'key' });

    const db = getDb();
    const wf = db.prepare('SELECT steps FROM workflows WHERE id = ?').get(wfId) as { steps: string };
    const steps = JSON.parse(wf.steps);

    const s1 = steps.find((s: { id: string }) => s.id === 'fail-1');
    const s2 = steps.find((s: { id: string }) => s.id === 'skip-1');
    expect(s1.status).toBe('failed');
    expect(s2.status).toBe('skipped');
  });

  it('schreibt Audit-Log nach Abschluss', async () => {
    const step = makeStep();
    const wfId = insertWorkflow('Audit Test Workflow', [step]);

    await executeWorkflow(wfId, { apiKey: 'key' });

    const db = getDb();
    const log = db
      .prepare("SELECT * FROM audit_log WHERE action = 'workflow_completed' ORDER BY timestamp DESC LIMIT 1")
      .get() as { details: string } | undefined;

    expect(log).toBeTruthy();
    expect(log!.details).toContain('Audit Test Workflow');
  });
});
