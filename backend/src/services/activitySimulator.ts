import { getDb } from '../db/schema.js';
import { broadcast } from './websocket.js';
import { v4 as uuid } from 'uuid';

type AgentStatus = 'active' | 'idle' | 'working' | 'blocked' | 'error' | 'suspended';

function nextAgentStatus(current: string): AgentStatus {
  switch (current) {
    case 'idle':    return Math.random() > 0.5 ? 'working' : 'active';
    case 'working': return Math.random() > 0.75 ? 'idle' : 'active';
    case 'active':  return Math.random() > 0.7 ? 'working' : 'idle';
    case 'error':   return 'idle';
    case 'blocked': return Math.random() > 0.4 ? 'idle' : 'active';
    default:        return 'idle';
  }
}

// Update 1-3 agent statuses every 3 seconds
function tickAgentStatuses() {
  try {
    const db = getDb();
    const agents = db.prepare(
      "SELECT id, status FROM agents WHERE status != 'suspended' ORDER BY RANDOM() LIMIT 3"
    ).all() as { id: string; status: string }[];
    const now = new Date().toISOString();

    for (const agent of agents) {
      const newStatus = nextAgentStatus(agent.status);
      if (newStatus === agent.status) continue;
      db.prepare('UPDATE agents SET status = ?, lastActivity = ? WHERE id = ?').run(newStatus, now, agent.id);
      broadcast(
        { type: 'agent_status', payload: { agentId: agent.id, status: newStatus, lastActivity: now }, timestamp: now },
        'agents'
      );
    }
  } catch {
    // DB may not be ready yet — ignore
  }
}

// Progress 1-3 in_progress tasks every 5 seconds
function tickTaskProgress() {
  try {
    const db = getDb();
    const tasks = db.prepare(
      "SELECT id, progress FROM tasks WHERE status = 'in_progress' ORDER BY RANDOM() LIMIT 3"
    ).all() as { id: string; progress: number }[];
    const now = new Date().toISOString();

    for (const task of tasks) {
      const increment = Math.floor(5 + Math.random() * 20);
      const newProgress = Math.min(100, (task.progress ?? 0) + increment);

      if (newProgress >= 100) {
        db.prepare(
          "UPDATE tasks SET progress = 100, status = 'completed', kanbanColumn = 'done', completedAt = ? WHERE id = ?"
        ).run(now, task.id);
        broadcast(
          { type: 'task_update', payload: { id: task.id, progress: 100, status: 'completed', kanbanColumn: 'done', completedAt: now }, timestamp: now },
          'tasks'
        );
      } else {
        db.prepare('UPDATE tasks SET progress = ? WHERE id = ?').run(newProgress, task.id);
        broadcast(
          { type: 'task_update', payload: { id: task.id, progress: newProgress }, timestamp: now },
          'tasks'
        );
      }
    }
  } catch {
    // ignore
  }
}

// Start a pending task every 20 seconds
function tickStartPendingTask() {
  try {
    const db = getDb();
    const task = db.prepare(
      "SELECT id FROM tasks WHERE status = 'pending' ORDER BY RANDOM() LIMIT 1"
    ).get() as { id: string } | undefined;
    if (!task) return;

    const agent = db.prepare(
      "SELECT id FROM agents WHERE status IN ('active', 'idle') ORDER BY RANDOM() LIMIT 1"
    ).get() as { id: string } | undefined;
    const now = new Date().toISOString();
    const kanban = Math.random() > 0.3 ? 'in_progress' : 'review';

    db.prepare(
      "UPDATE tasks SET status = 'in_progress', kanbanColumn = ?, progress = 0, assignedAgentId = ? WHERE id = ?"
    ).run(kanban, agent?.id ?? null, task.id);

    broadcast(
      { type: 'task_update', payload: { id: task.id, status: 'in_progress', kanbanColumn: kanban, progress: 0, assignedAgentId: agent?.id }, timestamp: now },
      'tasks'
    );
  } catch {
    // ignore
  }
}

// Record a metrics snapshot every 60 seconds
function recordMetricsSnapshot() {
  try {
    const db = getDb();
    const now = new Date().toISOString();

    const activeAgents = (db.prepare("SELECT COUNT(*) as c FROM agents WHERE status IN ('active', 'working')").get() as { c: number }).c;
    const totalTasks = (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }).c;
    const completedToday = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'completed' AND completedAt >= datetime('now', '-1 day')").get() as { c: number }).c;
    const failedTasks = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'failed'").get() as { c: number }).c;
    const avgSuccessRate = (db.prepare('SELECT AVG(successRate) as avg FROM agents').get() as { avg: number }).avg ?? 0;
    const avgResponseTime = (db.prepare('SELECT AVG(avgTaskDuration) as avg FROM agents').get() as { avg: number }).avg ?? 0;
    const errorRate = totalTasks > 0 ? (failedTasks / totalTasks) * 100 : 0;
    const throughput = completedToday / 24;

    db.prepare(
      'INSERT INTO metrics_history (id, timestamp, activeAgents, totalTasks, completedToday, errorRate, avgResponseTime, throughput, successRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(uuid(), now, activeAgents, totalTasks, completedToday, +errorRate.toFixed(2), +avgResponseTime.toFixed(0), +throughput.toFixed(2), +avgSuccessRate.toFixed(1));

    broadcast(
      { type: 'metric_change', payload: { activeAgents, totalTasks, completedToday, errorRate, avgResponseTime, throughput, successRate: avgSuccessRate }, timestamp: now },
      'analytics'
    );
  } catch {
    // ignore
  }
}

export function startActivitySimulator() {
  console.log('[ActivitySimulator] Starting live simulation...');

  // Stagger initial starts so the DB has time to settle
  setTimeout(() => setInterval(tickAgentStatuses, 3000), 1000);
  setTimeout(() => setInterval(tickTaskProgress, 5000), 2000);
  setTimeout(() => setInterval(tickStartPendingTask, 20000), 5000);
  setTimeout(() => {
    recordMetricsSnapshot();
    setInterval(recordMetricsSnapshot, 60000);
  }, 3000);
}
