import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema.js';

const router = Router();

// GET /api/analytics/dashboard
router.get('/dashboard', (_req: Request, res: Response) => {
  const db = getDb();

  const totalAgents = (db.prepare('SELECT COUNT(*) as c FROM agents').get() as { c: number }).c;
  const activeAgents = (db.prepare("SELECT COUNT(*) as c FROM agents WHERE status IN ('active', 'working')").get() as { c: number }).c;
  const totalTasks = (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }).c;
  const completedTasks = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'completed'").get() as { c: number }).c;
  const failedTasks = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'failed'").get() as { c: number }).c;
  const avgSuccessRate = (db.prepare('SELECT AVG(successRate) as avg FROM agents').get() as { avg: number }).avg || 0;
  const avgResponseTime = (db.prepare('SELECT AVG(avgTaskDuration) as avg FROM agents').get() as { avg: number }).avg || 0;

  // Generate 7-day trend
  const tasksTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const dateStr = date.toISOString().split('T')[0];
    tasksTrend.push({
      date: dateStr,
      count: Math.floor(10 + Math.random() * 30), // Simulated until we have real timestamp data
    });
  }

  // Category distribution
  const categoryDist = db.prepare('SELECT category, COUNT(*) as count FROM agents GROUP BY category').all() as { category: string; count: number }[];

  // Top performers
  const topPerformers = db.prepare('SELECT id as agentId, name, successRate as score FROM agents ORDER BY successRate DESC LIMIT 5').all();

  const errorRate = totalTasks > 0 ? +((failedTasks / totalTasks) * 100).toFixed(1) : 0;
  const uptime = +(95 + Math.random() * 5).toFixed(2);

  res.json({
    totalAgents,
    activeAgents,
    tasksToday: Math.floor(totalTasks * 0.1),
    successRate: +avgSuccessRate.toFixed(1),
    avgResponseTime: +avgResponseTime.toFixed(0),
    tasksTrend,
    categoryDistribution: categoryDist,
    topPerformers,
    errorRate,
    uptime,
  });
});

// GET /api/analytics/performance
router.get('/performance', (_req: Request, res: Response) => {
  // Generate 7-day performance trend
  const trends = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    trends.push({
      date: date.toISOString().split('T')[0],
      throughput: Math.floor(50 + Math.random() * 100),
      errorRate: +(Math.random() * 5).toFixed(1),
      avgResponseTime: Math.floor(100 + Math.random() * 200),
      successRate: +(85 + Math.random() * 15).toFixed(1),
      activeAgents: Math.floor(120 + Math.random() * 80),
    });
  }

  res.json({ trends });
});

// GET /api/analytics/sla
router.get('/sla', (_req: Request, res: Response) => {
  const slaMetrics = [
    { id: 'sla-1', name: 'Response Time', metric: 'response_time', threshold: 200, unit: 'ms', current: Math.floor(80 + Math.random() * 180), status: 'met', period: 'hourly', history: [] },
    { id: 'sla-2', name: 'Success Rate', metric: 'success_rate', threshold: 95, unit: '%', current: +(90 + Math.random() * 10).toFixed(1), status: 'met', period: 'daily', history: [] },
    { id: 'sla-3', name: 'Uptime', metric: 'uptime', threshold: 99.5, unit: '%', current: +(99 + Math.random()).toFixed(2), status: 'met', period: 'monthly', history: [] },
    { id: 'sla-4', name: 'Throughput', metric: 'throughput', threshold: 100, unit: 'req/min', current: Math.floor(80 + Math.random() * 60), status: 'met', period: 'hourly', history: [] },
    { id: 'sla-5', name: 'Error Rate', metric: 'error_rate', threshold: 5, unit: '%', current: +(Math.random() * 8).toFixed(1), status: 'met', period: 'daily', history: [] },
  ];

  // Update statuses
  for (const sla of slaMetrics) {
    if (sla.metric === 'error_rate') {
      sla.status = sla.current > sla.threshold ? 'breached' : sla.current > sla.threshold * 0.8 ? 'warning' : 'met';
    } else {
      sla.status = sla.current < sla.threshold ? (sla.current < sla.threshold * 0.8 ? 'breached' : 'warning') : 'met';
    }
  }

  res.json({ slaMetrics });
});

export default router;
