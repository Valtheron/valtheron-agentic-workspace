import { getDb } from '../db/schema.js';
import { broadcast } from './websocket.js';
import { createNotification } from '../routes/notifications.js';

interface AutoTriggerRule {
  id: string;
  condition: string;
  threshold: number;
  enabled: boolean;
}

// Evaluate auto-trigger rules every 30 seconds
function evaluateTriggerRules() {
  try {
    const db = getDb();
    const ks = db.prepare('SELECT * FROM kill_switch WHERE id = 1').get() as Record<string, unknown>;
    if (!ks || ks.armed) return; // Already armed, skip

    const rules: AutoTriggerRule[] = JSON.parse(ks.autoTriggerRules as string || '[]');
    if (rules.length === 0) return;

    const totalAgents = (db.prepare('SELECT COUNT(*) as c FROM agents').get() as { c: number }).c;
    const errorAgents = (db.prepare("SELECT COUNT(*) as c FROM agents WHERE status = 'error'").get() as { c: number }).c;
    const blockedAgents = (db.prepare("SELECT COUNT(*) as c FROM agents WHERE status = 'blocked'").get() as { c: number }).c;
    const totalTasks = (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }).c;
    const failedTasks = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'failed'").get() as { c: number }).c;
    const avgSuccessRate = (db.prepare('SELECT AVG(successRate) as avg FROM agents').get() as { avg: number }).avg ?? 100;

    const errorRate = totalAgents > 0 ? (errorAgents / totalAgents) * 100 : 0;
    const taskFailRate = totalTasks > 0 ? (failedTasks / totalTasks) * 100 : 0;

    for (const rule of rules) {
      if (!rule.enabled) continue;

      let triggered = false;
      let reason = '';

      switch (rule.condition) {
        case 'error_rate_exceeds':
          if (errorRate > rule.threshold) {
            triggered = true;
            reason = `Agent-Fehlerrate ${errorRate.toFixed(1)}% ueberschreitet Schwellwert ${rule.threshold}%`;
          }
          break;
        case 'task_failure_exceeds':
          if (taskFailRate > rule.threshold) {
            triggered = true;
            reason = `Task-Fehlerrate ${taskFailRate.toFixed(1)}% ueberschreitet Schwellwert ${rule.threshold}%`;
          }
          break;
        case 'blocked_agents_exceeds':
          if (blockedAgents > rule.threshold) {
            triggered = true;
            reason = `${blockedAgents} blockierte Agenten ueberschreiten Schwellwert ${rule.threshold}`;
          }
          break;
        case 'success_rate_below':
          if (avgSuccessRate < rule.threshold) {
            triggered = true;
            reason = `Erfolgsrate ${avgSuccessRate.toFixed(1)}% unter Schwellwert ${rule.threshold}%`;
          }
          break;
      }

      if (triggered) {
        armKillSwitch(db, reason, rule.id);
        break; // Only trigger once per evaluation
      }
    }
  } catch {
    // Silently fail — monitor should not crash the system
  }
}

function armKillSwitch(db: ReturnType<typeof getDb>, reason: string, ruleId: string) {
  const ks = db.prepare('SELECT * FROM kill_switch WHERE id = 1').get() as Record<string, unknown>;
  const history = JSON.parse(ks.history as string || '[]');
  const now = new Date().toISOString();

  history.push({
    id: ruleId,
    action: 'auto-armed',
    triggeredBy: 'system:auto-trigger',
    reason,
    affectedAgents: [],
    timestamp: now,
  });

  // Suspend active agents
  const agents = db.prepare("SELECT id FROM agents WHERE status IN ('active', 'working')").all() as { id: string }[];
  const agentIds = agents.map(a => a.id);

  if (agentIds.length > 0) {
    db.prepare("UPDATE agents SET status = 'suspended' WHERE status IN ('active', 'working')").run();
  }

  db.prepare(
    'UPDATE kill_switch SET armed = 1, triggeredBy = ?, reason = ?, triggeredAt = ?, affectedAgents = ?, history = ? WHERE id = 1'
  ).run('system:auto-trigger', reason, now, JSON.stringify(agentIds), JSON.stringify(history));

  broadcast({
    type: 'kill_switch',
    payload: { armed: true, reason, autoTriggered: true, suspendedAgents: agentIds.length },
    timestamp: now,
  });

  // Create notifications
  createNotification(
    'kill_switch',
    'Kill-Switch automatisch aktiviert',
    reason,
    'critical'
  );

  for (const agentId of agentIds.slice(0, 10)) {
    createNotification(
      'agent_suspended',
      'Agent suspendiert',
      `Agent wurde durch Kill-Switch suspendiert: ${reason}`,
      'high',
      agentId
    );
  }

  console.log(`[KillSwitchMonitor] Auto-triggered: ${reason}. ${agentIds.length} agents suspended.`);
}

export function startKillSwitchMonitor() {
  console.log('[KillSwitchMonitor] Starting auto-trigger monitoring...');
  // Seed default rules if none exist
  seedDefaultRules();
  setTimeout(() => setInterval(evaluateTriggerRules, 30000), 10000);
}

function seedDefaultRules() {
  try {
    const db = getDb();
    const ks = db.prepare('SELECT autoTriggerRules FROM kill_switch WHERE id = 1').get() as { autoTriggerRules: string };
    const rules = JSON.parse(ks.autoTriggerRules || '[]');
    if (rules.length > 0) return;

    const defaultRules: AutoTriggerRule[] = [
      { id: 'rule-1', condition: 'error_rate_exceeds', threshold: 50, enabled: true },
      { id: 'rule-2', condition: 'task_failure_exceeds', threshold: 60, enabled: true },
      { id: 'rule-3', condition: 'blocked_agents_exceeds', threshold: 100, enabled: false },
      { id: 'rule-4', condition: 'success_rate_below', threshold: 30, enabled: true },
    ];

    db.prepare('UPDATE kill_switch SET autoTriggerRules = ? WHERE id = 1').run(JSON.stringify(defaultRules));
  } catch {
    // Ignore
  }
}
