// Interaction Capture Layer — Phase 1 of the Evolutionary Agent System.
//
// Source: the-290-agent-database/valtheron-spezialisierte-ki-agenten-entwicklung_from_200_to_290/
//         valtheron_extension_v2/evolutionary_agent_system.md §74-101
//
// "Erfasst alle Interaktionen mit Agenten für spätere Analyse"
// Required fields per spec:
//   - Request:    Eingabe-Prompt, Parameter, Kontext
//   - Response:   Agent-Output, Reasoning-Steps
//   - Metadata:   Timestamp, User-ID, Agent-Version
//   - Performance: Execution Time, Token Usage, Kosten
//   - Feedback:   Explizites User-Feedback (Thumbs Up/Down)
//   - Outcome:    Task Success/Failure, Follow-up Actions
//
// SQLite-backed (instead of Kafka+MongoDB from the spec) — same shape,
// same fields. Later phases (analytics, evolution engine) read from this
// table; this module is the only writer.

import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/schema.js';

export type InteractionOutcome = 'pending' | 'success' | 'failure' | 'cancelled';
export type FeedbackScore = -1 | 0 | 1;

export interface InteractionStartInput {
  agentId: string;
  taskId?: string | null;
  userId?: string | null;
  requestPrompt: string;
  requestParams?: Record<string, unknown>;
  requestContext?: string | null;
  agentVersionId?: string | null;
}

export interface InteractionFinishInput {
  outcome: Exclude<InteractionOutcome, 'pending'>;
  responseContent?: string | null;
  responseReasoning?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  costUsd?: number | null;
  errorClass?: string | null;
  errorMessage?: string | null;
}

export interface InteractionRow {
  id: string;
  agentId: string;
  agentVersionId: string | null;
  taskId: string | null;
  userId: string | null;
  requestPrompt: string;
  requestParams: Record<string, unknown>;
  requestContext: string | null;
  responseContent: string | null;
  responseReasoning: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  costUsd: number | null;
  outcome: InteractionOutcome;
  errorClass: string | null;
  errorMessage: string | null;
  feedbackScore: FeedbackScore | null;
  feedbackText: string | null;
  feedbackAt: string | null;
  createdAt: string;
}

interface RawInteractionRow {
  id: string;
  agentId: string;
  agentVersionId: string | null;
  taskId: string | null;
  userId: string | null;
  requestPrompt: string;
  requestParams: string;
  requestContext: string | null;
  responseContent: string | null;
  responseReasoning: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  costUsd: number | null;
  outcome: InteractionOutcome;
  errorClass: string | null;
  errorMessage: string | null;
  feedbackScore: FeedbackScore | null;
  feedbackText: string | null;
  feedbackAt: string | null;
  createdAt: string;
}

function rowToInteraction(r: RawInteractionRow): InteractionRow {
  return {
    ...r,
    requestParams: r.requestParams ? (JSON.parse(r.requestParams) as Record<string, unknown>) : {},
  };
}

/**
 * Begin tracking an interaction. Returns the row id; the caller passes
 * it to `finishInteraction` once the LLM returns or throws.
 *
 * If the agent has no current version row in `agent_versions`, one is
 * created on the fly (synthetic version "1.0.0" with hash of the
 * current systemPrompt + parameters). This guarantees every
 * interaction is anchored to a reproducible version.
 */
export function startInteraction(input: InteractionStartInput): { interactionId: string; agentVersionId: string } {
  const db = getDb();
  const startedAt = new Date().toISOString();
  const interactionId = uuid();
  const agentVersionId = input.agentVersionId ?? ensureCurrentVersion(input.agentId);

  db.prepare(
    `INSERT INTO agent_interactions (
      id, agentId, agentVersionId, taskId, userId,
      requestPrompt, requestParams, requestContext,
      startedAt, outcome
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
  ).run(
    interactionId,
    input.agentId,
    agentVersionId,
    input.taskId ?? null,
    input.userId ?? null,
    input.requestPrompt,
    JSON.stringify(input.requestParams ?? {}),
    input.requestContext ?? null,
    startedAt,
  );

  return { interactionId, agentVersionId };
}

export function finishInteraction(interactionId: string, input: InteractionFinishInput): void {
  const db = getDb();
  const row = db.prepare('SELECT startedAt, outcome FROM agent_interactions WHERE id = ?').get(interactionId) as
    | { startedAt: string; outcome: InteractionOutcome }
    | undefined;
  if (!row) throw new Error(`Interaction ${interactionId} not found`);
  if (row.outcome !== 'pending') {
    // Idempotent: ignore duplicate finish.
    return;
  }
  const finishedAt = new Date().toISOString();
  const durationMs = new Date(finishedAt).getTime() - new Date(row.startedAt).getTime();

  db.prepare(
    `UPDATE agent_interactions SET
      outcome = ?,
      responseContent = ?,
      responseReasoning = ?,
      finishedAt = ?,
      durationMs = ?,
      inputTokens = ?,
      outputTokens = ?,
      totalTokens = ?,
      costUsd = ?,
      errorClass = ?,
      errorMessage = ?
     WHERE id = ?`,
  ).run(
    input.outcome,
    input.responseContent ?? null,
    input.responseReasoning ?? null,
    finishedAt,
    durationMs,
    input.inputTokens ?? null,
    input.outputTokens ?? null,
    input.totalTokens ?? null,
    input.costUsd ?? null,
    input.errorClass ?? null,
    input.errorMessage ?? null,
    interactionId,
  );
}

export function recordFeedback(interactionId: string, score: FeedbackScore, text?: string | null): void {
  const db = getDb();
  db.prepare(`UPDATE agent_interactions SET feedbackScore = ?, feedbackText = ?, feedbackAt = ? WHERE id = ?`).run(
    score,
    text ?? null,
    new Date().toISOString(),
    interactionId,
  );
}

export interface ListInteractionsFilter {
  agentId?: string;
  taskId?: string;
  outcome?: InteractionOutcome;
  limit?: number;
  offset?: number;
  since?: string;
  until?: string;
}

export function listInteractions(filter: ListInteractionsFilter): InteractionRow[] {
  const db = getDb();
  const where: string[] = ['1=1'];
  const params: unknown[] = [];
  if (filter.agentId) {
    where.push('agentId = ?');
    params.push(filter.agentId);
  }
  if (filter.taskId) {
    where.push('taskId = ?');
    params.push(filter.taskId);
  }
  if (filter.outcome) {
    where.push('outcome = ?');
    params.push(filter.outcome);
  }
  if (filter.since) {
    where.push('createdAt >= ?');
    params.push(filter.since);
  }
  if (filter.until) {
    where.push('createdAt <= ?');
    params.push(filter.until);
  }
  const limit = Math.min(Math.max(filter.limit ?? 100, 1), 1000);
  const offset = Math.max(filter.offset ?? 0, 0);
  params.push(limit, offset);
  const rows = db
    .prepare(`SELECT * FROM agent_interactions WHERE ${where.join(' AND ')} ORDER BY createdAt DESC LIMIT ? OFFSET ?`)
    .all(...params) as RawInteractionRow[];
  return rows.map(rowToInteraction);
}

export function countInteractions(filter: Omit<ListInteractionsFilter, 'limit' | 'offset'>): number {
  const db = getDb();
  const where: string[] = ['1=1'];
  const params: unknown[] = [];
  if (filter.agentId) {
    where.push('agentId = ?');
    params.push(filter.agentId);
  }
  if (filter.taskId) {
    where.push('taskId = ?');
    params.push(filter.taskId);
  }
  if (filter.outcome) {
    where.push('outcome = ?');
    params.push(filter.outcome);
  }
  if (filter.since) {
    where.push('createdAt >= ?');
    params.push(filter.since);
  }
  if (filter.until) {
    where.push('createdAt <= ?');
    params.push(filter.until);
  }
  const row = db
    .prepare(`SELECT COUNT(*) as c FROM agent_interactions WHERE ${where.join(' AND ')}`)
    .get(...params) as { c: number };
  return row.c;
}

/**
 * Aggregates per-agent metrics from the interaction log. Returns enough
 * to drive the Phase-2 success-metrics dashboard without joining onto
 * the agents table.
 */
export interface InteractionAggregates {
  total: number;
  success: number;
  failure: number;
  cancelled: number;
  successRate: number; // 0-100, success / (success + failure), or 0 if denominator zero
  avgDurationMs: number | null;
  avgInputTokens: number | null;
  avgOutputTokens: number | null;
  totalCostUsd: number;
  feedbackPositive: number;
  feedbackNegative: number;
}

export function aggregateInteractions(filter: { agentId?: string; since?: string }): InteractionAggregates {
  const db = getDb();
  const where: string[] = ['1=1'];
  const params: unknown[] = [];
  if (filter.agentId) {
    where.push('agentId = ?');
    params.push(filter.agentId);
  }
  if (filter.since) {
    where.push('createdAt >= ?');
    params.push(filter.since);
  }

  const row = db
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN outcome='success' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN outcome='failure' THEN 1 ELSE 0 END) as failure,
        SUM(CASE WHEN outcome='cancelled' THEN 1 ELSE 0 END) as cancelled,
        AVG(durationMs) as avgDurationMs,
        AVG(inputTokens) as avgInputTokens,
        AVG(outputTokens) as avgOutputTokens,
        COALESCE(SUM(costUsd), 0) as totalCostUsd,
        SUM(CASE WHEN feedbackScore = 1 THEN 1 ELSE 0 END) as feedbackPositive,
        SUM(CASE WHEN feedbackScore = -1 THEN 1 ELSE 0 END) as feedbackNegative
      FROM agent_interactions WHERE ${where.join(' AND ')}`,
    )
    .get(...params) as {
    total: number | null;
    success: number | null;
    failure: number | null;
    cancelled: number | null;
    avgDurationMs: number | null;
    avgInputTokens: number | null;
    avgOutputTokens: number | null;
    totalCostUsd: number;
    feedbackPositive: number | null;
    feedbackNegative: number | null;
  };

  const total = row.total ?? 0;
  const success = row.success ?? 0;
  const failure = row.failure ?? 0;
  const denom = success + failure;
  return {
    total,
    success,
    failure,
    cancelled: row.cancelled ?? 0,
    successRate: denom > 0 ? +((success / denom) * 100).toFixed(1) : 0,
    avgDurationMs: row.avgDurationMs !== null ? Math.round(row.avgDurationMs) : null,
    avgInputTokens: row.avgInputTokens !== null ? Math.round(row.avgInputTokens) : null,
    avgOutputTokens: row.avgOutputTokens !== null ? Math.round(row.avgOutputTokens) : null,
    totalCostUsd: +row.totalCostUsd.toFixed(4),
    feedbackPositive: row.feedbackPositive ?? 0,
    feedbackNegative: row.feedbackNegative ?? 0,
  };
}

// ───────── Version registry ─────────

interface AgentVersionRow {
  id: string;
  version: string;
  systemPromptHash: string;
  parametersHash: string;
}

/**
 * Returns the current version row id for an agent. If the agent has
 * never been versioned, creates v1.0.0 with hashes of the present
 * systemPrompt + parameters and returns its id. If the systemPrompt or
 * parameters have changed since the last recorded version, retires the
 * old one and creates a new patch version (v1.0.0 → v1.0.1).
 */
export function ensureCurrentVersion(agentId: string): string {
  const db = getDb();
  const agent = db.prepare('SELECT systemPrompt, parameters FROM agents WHERE id = ?').get(agentId) as
    | { systemPrompt: string; parameters: string }
    | undefined;
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  const promptHash = sha256(agent.systemPrompt ?? '');
  const paramsHash = sha256(agent.parameters ?? '{}');

  const current = db
    .prepare(
      'SELECT id, version, systemPromptHash, parametersHash FROM agent_versions WHERE agentId = ? AND retiredAt IS NULL ORDER BY deployedAt DESC LIMIT 1',
    )
    .get(agentId) as AgentVersionRow | undefined;

  if (current && current.systemPromptHash === promptHash && current.parametersHash === paramsHash) {
    return current.id;
  }

  // Either no version exists, or content has drifted — retire the old one (if any) and create a new patch.
  const now = new Date().toISOString();
  const newId = uuid();
  let nextVersion = '1.0.0';
  let trigger: string | null = null;
  if (current) {
    nextVersion = bumpPatch(current.version);
    trigger = 'systemPrompt or parameters changed';
    db.prepare('UPDATE agent_versions SET retiredAt = ? WHERE id = ?').run(now, current.id);
  }
  db.prepare(
    `INSERT INTO agent_versions (id, agentId, version, systemPromptHash, parametersHash, deployedAt, evolutionTrigger)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(newId, agentId, nextVersion, promptHash, paramsHash, now, trigger);
  return newId;
}

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function bumpPatch(version: string): string {
  const parts = version.split('-')[0].split('.');
  const major = Number(parts[0] ?? '1');
  const minor = Number(parts[1] ?? '0');
  const patch = Number(parts[2] ?? '0');
  return `${major}.${minor}.${patch + 1}`;
}

export function getInteractionById(id: string): InteractionRow | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM agent_interactions WHERE id = ?').get(id) as RawInteractionRow | undefined;
  return row ? rowToInteraction(row) : null;
}
