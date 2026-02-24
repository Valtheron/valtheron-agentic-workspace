import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
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
import chatRoutes from './routes/chat.js';
import collaborationRoutes from './routes/collaboration.js';
import fileRoutes from './routes/files.js';
import projectTreeRoutes from './routes/projectTree.js';
import notificationRoutes from './routes/notifications.js';
import { auditLogger } from './middleware/auditLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { adminOnly } from './middleware/rbac.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10mb' }));

  // HTTP request logging (skip in test environment)
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // Apply optional auth globally (populates req.user if token present)
  app.use(optionalAuth);

  // Audit logging for all mutating operations
  app.use(auditLogger);

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
  // Admin-only guard — enforced in production; passthrough in dev
  const adminGuard = process.env.NODE_ENV === 'production' ? adminOnly : optionalAuth;

  app.use('/api/agents', protect, agentRoutes);
  app.use('/api/tasks', protect, taskRoutes);
  app.use('/api/workflows', protect, workflowRoutes);
  // Security routes require admin role in production (RBAC)
  app.use('/api/security', protect, adminGuard, securityRoutes);
  app.use('/api/analytics', protect, analyticsRoutes);
  app.use('/api/chat', protect, chatRoutes);
  app.use('/api/collaboration', protect, collaborationRoutes);
  app.use('/api/collaboration', protect, fileRoutes);
  app.use('/api/project-tree', protect, projectTreeRoutes);
  app.use('/api/notifications', protect, notificationRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Centralized error handler (must be last)
  app.use(errorHandler);

  return app;
}

export function initDatabase() {
  getDb();
  seedDatabase();
}
