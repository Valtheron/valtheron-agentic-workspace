import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp, initDatabase } from '../app.js';
import { executeTask } from '../services/executionEngine.js';
import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';

vi.mock('../services/llmClient.js', () => ({
  callLLM: vi.fn().mockResolvedValue('Aufgabe erfolgreich erledigt'),
}));

vi.mock('../services/websocket.js', () => ({
  broadcast: vi.fn(),
}));

// ── Helpers ──────────────────────────────────────────────────────────

function insertTask(overrides: Partial<{
  title: string; description: string; assignedAgentId: string | null;
}> = {}) {
  const db = getDb();
  const id = uuid();
  db.prepare(
    `INSERT INTO tasks (id, title, description, status, priority, kanbanColumn, progress, category, assignedAgentId, createdAt)
     VALUES (?, ?, ?, 'pending', 'medium', 'todo', 0, 'general', ?, datetime('now'))`,
  ).run(
    id,
    overrides.title ?? 'Test Aufgabe',
    overrides.description ?? 'Beschreibung der Aufgabe',
    overrides.assignedAgentId ?? null,
  );
  return id;
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('executeTask', () => {
  beforeEach(() => {
    createApp();
    initDatabase();
    vi.clearAllMocks();
  });

  it('gibt Fehler zurück wenn Task nicht existiert', async () => {
    const result = await executeTask({ taskId: 'nicht-vorhanden' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Task not found');
  });

  it('gibt Fehler zurück wenn kein API-Key konfiguriert', async () => {
    const taskId = insertTask();
    const origKey = process.env.LLM_API_KEY;
    const origAnthKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.LLM_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const result = await executeTask({ taskId });

    process.env.LLM_API_KEY = origKey;
    process.env.ANTHROPIC_API_KEY = origAnthKey;

    expect(result.success).toBe(false);
    expect(result.error).toContain('No API key configured');
  });

  it('führt Task erfolgreich aus und gibt output zurück', async () => {
    const taskId = insertTask({ title: 'Analyse Task' });

    const result = await executeTask({ taskId, apiKey: 'test-key' });

    expect(result.success).toBe(true);
    expect(result.taskId).toBe(taskId);
    expect(result.output).toBe('Aufgabe erfolgreich erledigt');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('markiert Task als completed in der DB', async () => {
    const taskId = insertTask();

    await executeTask({ taskId, apiKey: 'test-key' });

    const db = getDb();
    const task = db.prepare('SELECT status, progress, result FROM tasks WHERE id = ?').get(taskId) as
      | { status: string; progress: number; result: string }
      | undefined;

    expect(task?.status).toBe('completed');
    expect(task?.progress).toBe(100);
    expect(task?.result).toBe('Aufgabe erfolgreich erledigt');
  });

  it('verhindert doppelte Ausführung desselben Tasks', async () => {
    const { callLLM } = await import('../services/llmClient.js');
    let resolveFirst!: () => void;
    const first = new Promise<void>((r) => { resolveFirst = r; });

    (callLLM as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => {
      await first;
      return 'done';
    });

    const taskId = insertTask();

    const run1 = executeTask({ taskId, apiKey: 'key' });
    const run2 = executeTask({ taskId, apiKey: 'key' });

    resolveFirst();
    const [r1, r2] = await Promise.all([run1, run2]);

    // One should succeed, one should report already running
    const results = [r1, r2];
    const alreadyRunning = results.find((r) => r.error === 'Task is already running');
    expect(alreadyRunning).toBeTruthy();
  });

  it('markiert Task als failed wenn LLM Fehler wirft', async () => {
    const { callLLM } = await import('../services/llmClient.js');
    (callLLM as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('LLM nicht erreichbar'));

    const taskId = insertTask();

    const result = await executeTask({ taskId, apiKey: 'key' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('LLM nicht erreichbar');

    const db = getDb();
    const task = db.prepare('SELECT status FROM tasks WHERE id = ?').get(taskId) as { status: string };
    expect(task.status).toBe('failed');
  });

  it('schreibt Audit-Log nach erfolgreicher Ausführung', async () => {
    const taskId = insertTask({ title: 'Audit Test Task' });

    await executeTask({ taskId, apiKey: 'key' });

    const db = getDb();
    const log = db
      .prepare("SELECT * FROM audit_log WHERE action = 'task_executed' ORDER BY timestamp DESC LIMIT 1")
      .get() as { details: string } | undefined;

    expect(log).toBeTruthy();
    expect(log!.details).toContain('Audit Test Task');
  });

  it('nutzt provider und model aus dem Request', async () => {
    const { callLLM } = await import('../services/llmClient.js');
    const taskId = insertTask();

    await executeTask({ taskId, apiKey: 'key', provider: 'openai', model: 'gpt-4o' });

    expect(callLLM).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'openai', model: 'gpt-4o' }),
    );
  });
});
