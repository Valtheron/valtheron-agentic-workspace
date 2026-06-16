import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { optionalAuth, authMiddleware } from './middleware/auth.js';
import { getDb } from './db/schema.js';
import { seedDatabase, seedAgentCatalog } from './db/seed.js';
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
import mfaRoutes from './routes/mfa.js';
import secretsRoutes from './routes/secrets.js';
import backupRoutes from './routes/backup.js';
import donationsRoutes from './routes/donations.js';
import interactionRoutes from './routes/interactions.js';
import certificationRoutes from './routes/certifications.js';
import browseRoutes from './routes/browse.js';
import { auditLogger } from './middleware/auditLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { adminOnly } from './middleware/rbac.js';
import { rateLimiter } from './middleware/rateLimiter.js';

export function createApp() {
  const app = express();

  // Security Headers
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // Middleware
  app.use(
    cors({
      origin: ['http://localhost:3055', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
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

  // Rate limiting for auth endpoints
  app.use('/api/auth', rateLimiter(60, 20)); // 20 requests per 60 seconds

  // Public routes
  app.use('/api/auth', authRoutes);
  app.use('/api/auth/mfa', mfaRoutes);
  app.use('/api/donations', rateLimiter(60, 5), donationsRoutes);

  // Protected routes.
  //
  // `protect` enforces a valid JWT in production and whenever
  // VALTHERON_REQUIRE_AUTH=true. In dev mode the product routes
  // (agents/tasks/workflows/analytics/chat/…) keep the historical
  // optionalAuth fallback so locally clicking around remains friction-free.
  //
  // `adminGuard` is the new, stricter gate: it **always** requires an
  // authenticated admin, regardless of NODE_ENV. Mounted on the security,
  // secrets and backup routes so audit-log, kill-switch and credentials
  // can't be hit anonymously even on a developer's dev server. Block-A
  // finding D-17 (dev auth bypass) is fixed here for the high-risk
  // surfaces; the dev convenience for product routes is preserved.
  const requireAuth = process.env.NODE_ENV === 'production' || process.env.VALTHERON_REQUIRE_AUTH === 'true';
  const protect = requireAuth ? authMiddleware : optionalAuth;
  const adminGuard = adminOnly;

  if (!requireAuth) {
    console.warn(
      '[auth] Dev mode: /api/agents, /api/tasks, /api/workflows, /api/analytics, /api/chat, ' +
        '/api/collaboration, /api/project-tree, /api/notifications, /api/interactions and ' +
        '/api/certifications accept ' +
        'requests without a JWT. Set VALTHERON_REQUIRE_AUTH=true to mirror production. ' +
        '/api/security, /api/secrets and /api/backup always require admin auth.',
    );
  }

  app.use('/api/agents', protect, agentRoutes);
  app.use('/api/tasks', protect, taskRoutes);
  app.use('/api/workflows', protect, workflowRoutes);
  // Security routes always require admin — never accessible anonymously.
  app.use('/api/security', authMiddleware, adminGuard, securityRoutes);
  app.use('/api/analytics', protect, analyticsRoutes);
  app.use('/api/chat', protect, chatRoutes);
  app.use('/api/collaboration', protect, collaborationRoutes);
  app.use('/api/collaboration', protect, fileRoutes);
  app.use('/api/project-tree', protect, projectTreeRoutes);
  app.use('/api/notifications', protect, notificationRoutes);
  app.use('/api/interactions', protect, interactionRoutes);
  app.use('/api/certifications', protect, certificationRoutes);
  app.use('/api/browse', protect, browseRoutes);
  // Always admin-only: secrets management and backup/restore.
  app.use('/api/secrets', authMiddleware, adminGuard, secretsRoutes);
  app.use('/api/backup', authMiddleware, adminGuard, backupRoutes);

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
  // Full demo data (agents + users + tasks + workflows) only when explicitly requested
  if (process.env.SEED_DEMO === 'true') {
    seedDatabase();
    return;
  }
  // Always ensure the 290-agent catalog is available on fresh installs (skip under test)
  if (process.env.NODE_ENV !== 'test') {
    seedAgentCatalog();
  }
}
