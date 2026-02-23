import express from 'express';
import cors from 'cors';
import { optionalAuth, authMiddleware } from './middleware/auth.js';
import { getDb } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { getClientCount } from './services/websocket.js';

// Routes
import authRoutes from './routes/auth.js';
import agentRoutes from './routes/agents.js';
import taskRoutes from './routes/tasks.js';
import workflowRoutes from './routes/workflows.js';
import securityRoutes from './routes/security.js';
import analyticsRoutes from './routes/analytics.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));

  // Apply optional auth globally (populates req.user if token present)
  app.use(optionalAuth);

  // Health check
  app.get('/api/health', (_req, res) => {
    const db = getDb();
    const agentCount = (db.prepare('SELECT COUNT(*) as c FROM agents').get() as { c: number }).c;
    const taskCount = (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }).c;

    res.json({
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: { agents: agentCount, tasks: taskCount },
      websocket: { clients: getClientCount() },
    });
  });

  // Public routes
  app.use('/api/auth', authRoutes);

  // Protected routes (require auth in production, optional in dev)
  const protect = process.env.NODE_ENV === 'production' ? authMiddleware : optionalAuth;

  app.use('/api/agents', protect, agentRoutes);
  app.use('/api/tasks', protect, taskRoutes);
  app.use('/api/workflows', protect, workflowRoutes);
  app.use('/api/security', protect, securityRoutes);
  app.use('/api/analytics', protect, analyticsRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  return app;
}

export function initDatabase() {
  getDb();
  seedDatabase();
}
