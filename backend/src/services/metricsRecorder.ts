import { getDb } from '../db/schema.js';
import { broadcast } from './websocket.js';
import { v4 as uuid } from 'uuid';

/**
 * Records a snapshot of real metrics from the database.
 * No simulation — all values are derived from actual DB state.
 */
export function recordMetricsSnapshot() {
  try {
    const db = getDb();
    const now = new Date().toISOString();

    const activeAgents = (
      db.prepare("SELECT COUNT(*) as c FROM agents WHERE status IN ('active', 'working')").get() as { c: number }
    ).c;
    const totalTasks = (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }).c;
    const completedToday = (
      db
        .prepare(
          "SELECT COUNT(*) as c FROM tasks WHERE status = 'completed' AND completedAt >= datetime('now', '-1 day')",
        )
        .get() as { c: number }
    ).c;
    const failedTasks = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'failed'").get() as { c: number })
      .c;
    const avgSuccessRate = (db.prepare('SELECT AVG(successRate) as avg FROM agents').get() as { avg: number }).avg ?? 0;
    const avgResponseTime =
      (db.prepare('SELECT AVG(avgTaskDuration) as avg FROM agents').get() as { avg: number }).avg ?? 0;
    const errorRate = totalTasks > 0 ? (failedTasks / totalTasks) * 100 : 0;
    const throughput = completedToday / 24;

    db.prepare(
      'INSERT INTO metrics_history (id, timestamp, activeAgents, totalTasks, completedToday, errorRate, avgResponseTime, throughput, successRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(
      uuid(),
      now,
      activeAgents,
      totalTasks,
      completedToday,
      +errorRate.toFixed(2),
      +avgResponseTime.toFixed(0),
      +throughput.toFixed(2),
      +avgSuccessRate.toFixed(1),
    );

    broadcast(
      {
        type: 'metric_change',
        payload: {
          activeAgents,
          totalTasks,
          completedToday,
          errorRate,
          avgResponseTime,
          throughput,
          successRate: avgSuccessRate,
        },
        timestamp: now,
      },
      'analytics',
    );
  } catch {
    // DB may not be ready yet — ignore
  }
}

let metricsInterval: ReturnType<typeof setInterval> | undefined;

/**
 * Start periodic metrics recording (every 60s).
 */
export function startMetricsRecorder() {
  console.log('[MetricsRecorder] Recording real metrics every 60s');
  // Initial snapshot after a short delay
  setTimeout(() => {
    recordMetricsSnapshot();
    metricsInterval = setInterval(recordMetricsSnapshot, 60_000);
  }, 3000);
}

export function stopMetricsRecorder() {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = undefined;
  }
}
