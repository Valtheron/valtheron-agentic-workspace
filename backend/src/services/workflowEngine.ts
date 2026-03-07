import { getDb } from '../db/schema.js';
import { broadcast } from './websocket.js';
import { callLLM } from './llmClient.js';
import { v4 as uuid } from 'uuid';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  assignedAgentId: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  dependsOn: string[];
  output: string | null;
  progress: number;
  estimatedDuration: number;
  retries: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// Track running workflows
const runningWorkflows = new Set<string>();

/**
 * Execute a workflow: run all steps in dependency order.
 * Steps without dependencies run in parallel.
 * Each step calls the LLM via its assigned agent (or a default).
 *
 * This runs in the background — the route returns immediately.
 */
export async function executeWorkflow(
  workflowId: string,
  opts: {
    apiKey?: string;
    provider?: string;
    model?: string;
  } = {},
): Promise<void> {
  const db = getDb();

  if (runningWorkflows.has(workflowId)) return;
  runningWorkflows.add(workflowId);

  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(workflowId) as
    | Record<string, unknown>
    | undefined;
  if (!workflow) {
    runningWorkflows.delete(workflowId);
    return;
  }

  const steps: WorkflowStep[] = JSON.parse(workflow.steps as string);
  const now = new Date().toISOString();

  // Ensure workflow is marked as running (may already be set by the route)
  const currentStatus = workflow.status as string;
  if (currentStatus !== 'running') {
    db.prepare("UPDATE workflows SET status = 'running', startedAt = ? WHERE id = ?").run(now, workflowId);
  }
  broadcastWorkflowUpdate(workflowId, 'running');

  try {
    await runSteps(workflowId, steps, opts);

    // Re-read steps from DB (they've been updated during execution)
    const updated = db.prepare('SELECT steps FROM workflows WHERE id = ?').get(workflowId) as { steps: string };
    const finalSteps: WorkflowStep[] = JSON.parse(updated.steps);

    const allDone = finalSteps.every((s) => s.status === 'completed' || s.status === 'skipped');
    const anyFailed = finalSteps.some((s) => s.status === 'failed');

    const finalStatus = allDone ? 'completed' : anyFailed ? 'failed' : 'completed';
    const completedAt = new Date().toISOString();

    db.prepare('UPDATE workflows SET status = ?, completedAt = ? WHERE id = ?').run(
      finalStatus,
      completedAt,
      workflowId,
    );
    broadcastWorkflowUpdate(workflowId, finalStatus);

    // Audit
    db.prepare(
      'INSERT INTO audit_log (id, agentId, action, details, timestamp, riskLevel) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(
      uuid(),
      'system',
      'workflow_completed',
      `Workflow "${workflow.name}" finished with status: ${finalStatus}`,
      completedAt,
      anyFailed ? 'warning' : 'info',
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    db.prepare("UPDATE workflows SET status = 'failed' WHERE id = ?").run(workflowId);
    broadcastWorkflowUpdate(workflowId, 'failed');

    db.prepare(
      'INSERT INTO audit_log (id, agentId, action, details, timestamp, riskLevel) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(
      uuid(),
      'system',
      'workflow_failed',
      `Workflow "${workflow.name}" error: ${errorMsg}`,
      new Date().toISOString(),
      'warning',
    );
  } finally {
    runningWorkflows.delete(workflowId);
  }
}

export function isWorkflowRunning(workflowId: string): boolean {
  return runningWorkflows.has(workflowId);
}

// ── Step execution with dependency resolution ─────────────────────────

async function runSteps(
  workflowId: string,
  steps: WorkflowStep[],
  opts: { apiKey?: string; provider?: string; model?: string },
): Promise<void> {
  const completed = new Set<string>();
  const failed = new Set<string>();

  // Keep running until no more steps can be started
  while (true) {
    // Find steps that are ready to run (all deps completed)
    const ready = steps.filter((s) => s.status === 'pending' && s.dependsOn.every((depId) => completed.has(depId)));

    if (ready.length === 0) break; // Nothing more to run

    // Skip steps whose deps have failed
    for (const step of ready) {
      if (step.dependsOn.some((depId) => failed.has(depId))) {
        step.status = 'skipped';
        step.output = 'Übersprungen — vorheriger Schritt fehlgeschlagen';
        saveSteps(workflowId, steps);
        continue;
      }
    }

    const runnableSteps = ready.filter((s) => s.status === 'pending');
    if (runnableSteps.length === 0) break;

    // Run all ready steps in parallel
    const results = await Promise.allSettled(runnableSteps.map((step) => runSingleStep(workflowId, step, steps, opts)));

    for (let i = 0; i < runnableSteps.length; i++) {
      const step = runnableSteps[i];
      const result = results[i];

      if (result.status === 'fulfilled' && result.value.success) {
        completed.add(step.id);
      } else {
        failed.add(step.id);
      }
    }
  }
}

async function runSingleStep(
  workflowId: string,
  step: WorkflowStep,
  allSteps: WorkflowStep[],
  opts: { apiKey?: string; provider?: string; model?: string },
): Promise<{ success: boolean }> {
  const db = getDb();
  const startTime = Date.now();

  // Mark step as running
  step.status = 'running';
  step.startedAt = new Date().toISOString();
  step.progress = 10;
  saveSteps(workflowId, allSteps);
  broadcastStepProgress(workflowId, step.id, 10, 'running');

  // Get agent for this step
  const agent = step.assignedAgentId
    ? (db.prepare('SELECT * FROM agents WHERE id = ?').get(step.assignedAgentId) as Record<string, unknown> | undefined)
    : null;

  // Determine LLM config
  const provider = opts.provider || (agent?.llmProvider as string) || process.env.LLM_PROVIDER || 'anthropic';
  const model = opts.model || (agent?.llmModel as string) || process.env.LLM_MODEL || 'claude-sonnet-4-5-20250929';
  const apiKey = opts.apiKey || process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || '';

  if (!apiKey) {
    step.status = 'failed';
    step.error = 'No API key configured';
    step.output = '[FEHLER] Kein API-Key konfiguriert';
    saveSteps(workflowId, allSteps);
    broadcastStepProgress(workflowId, step.id, 0, 'failed');
    return { success: false };
  }

  const agentParams = agent?.parameters
    ? typeof agent.parameters === 'string'
      ? JSON.parse(agent.parameters as string)
      : (agent.parameters as Record<string, unknown>)
    : {};

  // Set agent working
  if (agent && step.assignedAgentId) {
    db.prepare("UPDATE agents SET status = 'working', currentTask = ?, lastActivity = ? WHERE id = ?").run(
      step.name,
      new Date().toISOString(),
      step.assignedAgentId,
    );
  }

  try {
    // Collect outputs from dependency steps for context
    const depOutputs = allSteps
      .filter((s) => step.dependsOn.includes(s.id) && s.output)
      .map((s) => `## Ergebnis von "${s.name}":\n${s.output}`)
      .join('\n\n');

    const systemPrompt = buildStepSystemPrompt(agent);
    const userMessage = buildStepUserMessage(step, depOutputs);

    step.progress = 30;
    saveSteps(workflowId, allSteps);
    broadcastStepProgress(workflowId, step.id, 30, 'running');

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

    step.status = 'completed';
    step.progress = 100;
    step.output = output;
    step.completedAt = new Date().toISOString();
    saveSteps(workflowId, allSteps);
    broadcastStepProgress(workflowId, step.id, 100, 'completed');

    // Reset agent
    if (agent && step.assignedAgentId) {
      db.prepare("UPDATE agents SET status = 'idle', currentTask = NULL, lastActivity = ? WHERE id = ?").run(
        new Date().toISOString(),
        step.assignedAgentId,
      );
      // Update agent metrics
      updateAgentMetricsForStep(step.assignedAgentId, true, durationMs);
    }

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    step.status = 'failed';
    step.progress = 0;
    step.error = errorMsg;
    step.output = `[FEHLER] ${errorMsg}`;
    saveSteps(workflowId, allSteps);
    broadcastStepProgress(workflowId, step.id, 0, 'failed');

    if (agent && step.assignedAgentId) {
      const durationMs = Date.now() - startTime;
      db.prepare("UPDATE agents SET status = 'error', currentTask = NULL, lastActivity = ? WHERE id = ?").run(
        new Date().toISOString(),
        step.assignedAgentId,
      );
      updateAgentMetricsForStep(step.assignedAgentId, false, durationMs);
    }

    return { success: false };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────

function saveSteps(workflowId: string, steps: WorkflowStep[]) {
  const db = getDb();
  db.prepare('UPDATE workflows SET steps = ? WHERE id = ?').run(JSON.stringify(steps), workflowId);
}

function buildStepSystemPrompt(agent: Record<string, unknown> | null | undefined): string {
  const base = (agent?.systemPrompt as string) || '';
  const category = (agent?.category as string) || 'general';
  const role = (agent?.role as string) || 'Autonomous Agent';

  return `${base}

Du bist ein autonomer Agent im Valtheron Workspace.
Kategorie: ${category} | Rolle: ${role}

Du führst einen Workflow-Schritt aus. Liefere ein konkretes, umsetzbares Ergebnis.
Falls dir Ergebnisse vorheriger Schritte als Kontext gegeben werden, nutze sie.
Antworte auf Deutsch.`;
}

function buildStepUserMessage(step: WorkflowStep, depOutputs: string): string {
  const parts = [
    `# Workflow-Schritt: ${step.name}`,
    '',
    step.description ? `## Beschreibung\n${step.description}` : '',
  ];

  if (depOutputs) {
    parts.push('', '## Kontext aus vorherigen Schritten', depOutputs);
  }

  parts.push('', '## Anweisung', 'Führe diesen Schritt aus und liefere das Ergebnis.');

  return parts.filter(Boolean).join('\n');
}

function updateAgentMetricsForStep(agentId: string, success: boolean, durationMs: number) {
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
  const prevTotal = agent.tasksCompleted + agent.failedTasks;
  const newAvgDuration =
    prevTotal > 0 ? (agent.avgTaskDuration * prevTotal + durationSeconds) / (prevTotal + 1) : durationSeconds;

  db.prepare(
    'UPDATE agents SET tasksCompleted = ?, failedTasks = ?, successRate = ?, avgTaskDuration = ? WHERE id = ?',
  ).run(newCompleted, newFailed, +newSuccessRate.toFixed(1), +newAvgDuration.toFixed(1), agentId);
}

function broadcastWorkflowUpdate(workflowId: string, status: string) {
  broadcast(
    { type: 'workflow_progress', payload: { workflowId, status }, timestamp: new Date().toISOString() },
    'workflows',
  );
}

function broadcastStepProgress(workflowId: string, stepId: string, progress: number, status: string) {
  broadcast(
    {
      type: 'workflow_progress',
      payload: { workflowId, stepId, progress, status },
      timestamp: new Date().toISOString(),
    },
    'workflows',
  );
}
