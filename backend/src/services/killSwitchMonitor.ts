/**
 * Kill-Switch Auto-Trigger Rules Engine
 *
 * Periodically evaluates auto-trigger rules stored in the kill_switch table.
 * If any enabled rule's threshold is breached, the kill switch is aktiviert automatically.
 */

import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';

export interface AutoTriggerRule {
  id: string;
  name: string;
  metric: 'error_rate' | 'failed_agents' | 'failed_tasks_rate';
  threshold: number;
  comparison: 'gt' | 'lt' | 'gte' | 'lte';
  enabled: boolean;
  windowMinutes: number;
}

const POLL_INTERVAL_MS = 30_000; // 30 seconds

let monitorInterval: ReturnType<typeof setInterval> | null = null;

function compare(value: number, threshold: number, comparison: AutoTriggerRule['comparison']): boolean {
  switch (comparison) {
    case 'gt':
      return value > threshold;
    case 'gte':
      return value >= threshold;
    case 'lt':
      return value < threshold;
    case 'lte':
      return value <= threshold;
  }
}

function evaluateMetric(rule: AutoTriggerRule): { value: number; breached: boolean } {
  const db = getDb();
  const windowCutoff = new Date(Date.now() - rule.windowMinutes * 60 * 1000).toISOString();
  let value = 0;

  switch (rule.metric) {
    case 'error_rate': {
      const total = (
        db
          .prepare('SELECT COUNT(*) as c FROM tasks WHERE createdAt >= ?')
          .get(windowCutoff) as { c: number }
      ).c;
      const failed = (
        db
          .prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'failed' AND createdAt >= ?")
          .get(windowCutoff) as { c: number }
      ).c;
      value = total > 0 ? (failed / total) * 100 : 0;
      break;
    }
    case 'failed_agents': {
      value = (db.prepare("SELECT COUNT(*) as c FROM agents WHERE status = 'error'").get() as { c: number }).c;
      break;
    }
    case 'failed_tasks_rate': {
      const completed = (
        db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status IN ('completed','failed')").get() as { c: number }
      ).c;
      const failed = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'failed'").get() as { c: number }).c;
      value = completed > 0 ? (failed / completed) * 100 : 0;
      break;
    }
  }

  return { value, breached: compare(value, rule.threshold, rule.comparison) };
}

function aktivierenKillSwitch(rule: AutoTriggerRule, triggeredValue: number): void {
  const db = getDb();
  const ks = db.prepare('SELECT * FROM kill_switch WHERE id = 1').get() as Record<string, unknown>;
  const history = JSON.parse(ks.history as string) as unknown[];
  const reason = `Auto-trigger: ${rule.name} — Wert ${triggeredValue.toFixed(2)} ${rule.comparison} Schwellenwert ${rule.threshold}`;

  history.push({
    id: uuid(),
    action: 'auto-triggered',
    triggeredBy: 'system:auto-trigger',
    reason,
    affectedAgents: [],
    timestamp: new Date().toISOString(),
  });

  const agents = db.prepare("SELECT id FROM agents WHERE status IN ('active','working')").all() as { id: string }[];
  const agentIds = agents.map((a) => a.id);
  if (agentIds.length > 0) {
    db.prepare("UPDATE agents SET status = 'suspended' WHERE status IN ('active','working')").run();
  }

  db.prepare(
    'UPDATE kill_switch SET aktiv = 1, triggeredBy = ?, reason = ?, triggeredAt = ?, affectedAgents = ?, history = ? WHERE id = 1',
  ).run('system:auto-trigger', reason, new Date().toISOString(), JSON.stringify(agentIds), JSON.stringify(history));

  db.prepare(
    "INSERT INTO audit_log (id, agentId, action, details, riskLevel) VALUES (?, 'system', ?, ?, 'critical')",
  ).run(uuid(), 'kill-switch:auto-triggered', reason);

  console.warn(`[KillSwitchMonitor] Kill switch auto-triggered by rule "${rule.name}": ${reason}`);
}

function runCheck(): void {
  try {
    const db = getDb();
    const ks = db.prepare('SELECT aktiv, autoTriggerRules FROM kill_switch WHERE id = 1').get() as
      | { aktiv: number; autoTriggerRules: string }
      | undefined;

    if (!ks || ks.aktiv) return;

    const rules: AutoTriggerRule[] = JSON.parse(ks.autoTriggerRules || '[]');
    const enabledRules = rules.filter((r) => r.enabled);

    for (const rule of enabledRules) {
      const { value, breached } = evaluateMetric(rule);
      if (breached) {
        aktivierenKillSwitch(rule, value);
        break;
      }
    }
  } catch (err) {
    console.error('[KillSwitchMonitor] Error during check:', err);
  }
}

export function startKillSwitchMonitor(): void {
  if (monitorInterval) return;
  monitorInterval = setInterval(runCheck, POLL_INTERVAL_MS);
  console.info('[KillSwitchMonitor] Auto-trigger monitor started (interval: 30s)');
}

export function stopKillSwitchMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.info('[KillSwitchMonitor] Auto-trigger monitor stopped');
  }
}
