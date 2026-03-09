import { getDb } from '../db/schema.js';
import { broadcast } from './websocket.js';
import { callLLM } from './llmClient.js';
import { v4 as uuid } from 'uuid';

export interface ExecutionRequest {
  taskId: string;
  /** LLM config — if missing, execution requires agent-level config or env vars */
  apiKey?: string;
  provider?: string;
  model?: string;
}

export interface ExecutionResult {
  success: boolean;
  taskId: string;
  agentId: string | null;
  output: string;
  durationMs: number;
  error?: string;
}

// Track running executions so we can guard against double-runs
const runningTasks = new Set<string>();

/**
 * Execute a single task with its assigned agent (or a specified one).
 * This is a REAL execution: it calls the LLM, stores the result, and
 * updates agent metrics.
 *
 * Returns immediately with a promise — the task runs in the background.
 */
export async function executeTask(req: ExecutionRequest): Promise<ExecutionResult> {
  const db = getDb();
  const { taskId } = req;

  // Guard: no double execution
  if (runningTasks.has(taskId)) {
    return { success: false, taskId, agentId: null, output: '', durationMs: 0, error: 'Task is already running' };
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Record<string, unknown> | undefined;
  if (!task) {
    return { success: false, taskId, agentId: null, output: '', durationMs: 0, error: 'Task not found' };
  }

  const agentId = task.assignedAgentId as string | null;
  const agent = agentId
    ? (db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId) as Record<string, unknown> | undefined)
    : null;

  // Determine LLM config: request > agent > env
  const agentParams = agent?.parameters
    ? typeof agent.parameters === 'string'
      ? JSON.parse(agent.parameters as string)
      : (agent.parameters as Record<string, unknown>)
    : {};
  const agentPersonality = agent?.personality
    ? typeof agent.personality === 'string'
      ? JSON.parse(agent.personality as string)
      : (agent.personality as Record<string, unknown>)
    : {};

  const provider = req.provider || (agent?.llmProvider as string) || process.env.LLM_PROVIDER || 'anthropic';
  const model = req.model || (agent?.llmModel as string) || process.env.LLM_MODEL || 'claude-sonnet-4-5-20250929';
  const apiKey = req.apiKey || process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || '';

  if (!apiKey) {
    return {
      success: false,
      taskId,
      agentId,
      output: '',
      durationMs: 0,
      error: 'No API key configured. Set LLM_API_KEY env var, pass it in the request, or configure the agent.',
    };
  }

  // Mark task as in_progress
  runningTasks.add(taskId);
  const now = new Date().toISOString();
  db.prepare("UPDATE tasks SET status = 'in_progress', kanbanColumn = 'in_progress', progress = 5 WHERE id = ?").run(
    taskId,
  );
  if (agent) {
    db.prepare("UPDATE agents SET status = 'working', currentTask = ?, lastActivity = ? WHERE id = ?").run(
      task.title as string,
      now,
      agentId,
    );
  }

  broadcastTaskState(taskId, { status: 'in_progress', kanbanColumn: 'in_progress', progress: 5 });
  if (agentId) {
    broadcastAgentState(agentId, 'working');
  }

  const startTime = Date.now();

  try {
    // Build the prompt
    const systemPrompt = buildExecutionPrompt(agent ?? null, agentPersonality, task);
    const userMessage = buildTaskMessage(task);

    // Progress: 20% — sending to LLM
    db.prepare('UPDATE tasks SET progress = 20 WHERE id = ?').run(taskId);
    broadcastTaskState(taskId, { progress: 20 });

    const output = await callLLM({
      provider,
      model,
      apiKey,
      systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: (agentParams.maxTokens as number) || 2048,
      temperature: (agentParams.temperature as number) || 0.7,
      params: agentParams,
    });

    const durationMs = Date.now() - startTime;

    // Mark completed
    const completedAt = new Date().toISOString();
    db.prepare(
      "UPDATE tasks SET status = 'completed', kanbanColumn = 'done', progress = 100, completedAt = ?, result = ?, actualHours = ? WHERE id = ?",
    ).run(completedAt, output, +(durationMs / 3_600_000).toFixed(4), taskId);

    broadcastTaskState(taskId, { status: 'completed', kanbanColumn: 'done', progress: 100, completedAt });

    // Update agent metrics
    if (agent && agentId) {
      updateAgentMetrics(agentId, true, durationMs);
      db.prepare("UPDATE agents SET status = 'idle', currentTask = NULL, lastActivity = ? WHERE id = ?").run(
        completedAt,
        agentId,
      );
      broadcastAgentState(agentId, 'idle');
    }

    // Audit log
    db.prepare(
      'INSERT INTO audit_log (id, agentId, action, details, timestamp, riskLevel) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(
      uuid(),
      agentId || 'system',
      'task_executed',
      `Completed task "${task.title}" in ${durationMs}ms`,
      completedAt,
      'info',
    );

    runningTasks.delete(taskId);
    return { success: true, taskId, agentId, output, durationMs };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);
    const failedAt = new Date().toISOString();

    // Mark failed
    db.prepare("UPDATE tasks SET status = 'failed', progress = 0, result = ? WHERE id = ?").run(
      `[FEHLER] ${errorMsg}`,
      taskId,
    );

    broadcastTaskState(taskId, { status: 'failed', progress: 0 });

    if (agent && agentId) {
      updateAgentMetrics(agentId, false, durationMs);
      db.prepare("UPDATE agents SET status = 'error', currentTask = NULL, lastActivity = ? WHERE id = ?").run(
        failedAt,
        agentId,
      );
      broadcastAgentState(agentId, 'error');
    }

    // Audit log
    db.prepare(
      'INSERT INTO audit_log (id, agentId, action, details, timestamp, riskLevel) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(uuid(), agentId || 'system', 'task_failed', `Task "${task.title}" failed: ${errorMsg}`, failedAt, 'warning');

    runningTasks.delete(taskId);
    return { success: false, taskId, agentId, output: '', durationMs, error: errorMsg };
  }
}

export function isTaskRunning(taskId: string): boolean {
  return runningTasks.has(taskId);
}

// ── Internal helpers ──────────────────────────────────────────────────

function buildExecutionPrompt(
  agent: Record<string, unknown> | null,
  personality: Record<string, unknown>,
  task: Record<string, unknown>,
): string {
  const base = (agent?.systemPrompt as string) || '';
  const category = (agent?.category as string) || (task.category as string) || 'general';
  const role = (agent?.role as string) || 'Autonomous Agent';

  const style = personality.communicationStyle || 'technical';
  const creativity = personality.creativity || 5;
  const analyticalDepth = personality.analyticalDepth || 5;

  return `${base}

Du bist ein autonomer Agent im Valtheron Workspace.
Kategorie: ${category}
Rolle: ${role}
Kommunikationsstil: ${style}
Kreativität: ${creativity}/10
Analytische Tiefe: ${analyticalDepth}/10

Dein Job: Führe die zugewiesene Aufgabe aus und liefere ein konkretes Ergebnis.
- Arbeite präzise und liefere umsetzbare Resultate.
- Wenn die Aufgabe Code erfordert, liefere Code.
- Wenn die Aufgabe eine Analyse erfordert, liefere eine strukturierte Analyse.
- Antworte immer auf Deutsch.`;
}

function buildTaskMessage(task: Record<string, unknown>): string {
  const parts = [
    `# Aufgabe: ${task.title}`,
    '',
    task.description ? `## Beschreibung\n${task.description}` : '',
    `**Kategorie:** ${task.category}`,
    `**Priorität:** ${task.priority}`,
    `**Typ:** ${task.taskType || 'feature'}`,
  ].filter(Boolean);

  return parts.join('\n');
}

function updateAgentMetrics(agentId: string, success: boolean, durationMs: number) {
  const db = getDb();
  const agent = db
    .prepare('SELECT tasksCompleted, failedTasks, avgTaskDuration FROM agents WHERE id = ?')
    .get(agentId) as
    | {
        tasksCompleted: number;
        failedTasks: number;
        avgTaskDuration: number;
      }
    | undefined;
  if (!agent) return;

  const newCompleted = agent.tasksCompleted + (success ? 1 : 0);
  const newFailed = agent.failedTasks + (success ? 0 : 1);
  const totalTasks = newCompleted + newFailed;
  const newSuccessRate = totalTasks > 0 ? (newCompleted / totalTasks) * 100 : 0;
  const durationSeconds = durationMs / 1000;
  // Rolling average
  const prevTotal = agent.tasksCompleted + agent.failedTasks;
  const newAvgDuration =
    prevTotal > 0 ? (agent.avgTaskDuration * prevTotal + durationSeconds) / (prevTotal + 1) : durationSeconds;

  db.prepare(
    'UPDATE agents SET tasksCompleted = ?, failedTasks = ?, successRate = ?, avgTaskDuration = ? WHERE id = ?',
  ).run(newCompleted, newFailed, +newSuccessRate.toFixed(1), +newAvgDuration.toFixed(1), agentId);
}

function broadcastTaskState(taskId: string, payload: Record<string, unknown>) {
  broadcast({ type: 'task_update', payload: { id: taskId, ...payload }, timestamp: new Date().toISOString() }, 'tasks');
}

function broadcastAgentState(agentId: string, status: string) {
  broadcast(
    {
      type: 'agent_status',
      payload: { agentId, status, lastActivity: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    },
    'agents',
  );
}
