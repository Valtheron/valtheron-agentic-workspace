import express from 'express';
import cors from 'cors';
import http from 'http';
import { optionalAuth, authMiddleware } from './middleware/auth.js';
import { initWebSocket, getClientCount } from './services/websocket.js';
import { getDb } from './db/schema.js';
import { seedDatabase } from './db/seed.js';

// Routes
import authRoutes from './routes/auth.js';
import agentRoutes from './routes/agents.js';
import taskRoutes from './routes/tasks.js';
import workflowRoutes from './routes/workflows.js';
import securityRoutes from './routes/security.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

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

// Initialize
const server = http.createServer(app);
initWebSocket(server);

// Initialize DB and seed
getDb();
seedDatabase();

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║     VALTHERON AGENTIC WORKSPACE - Backend API    ║
╠══════════════════════════════════════════════════╣
║  REST API:    http://localhost:${PORT}/api          ║
║  WebSocket:   ws://localhost:${PORT}/ws             ║
║  Health:      http://localhost:${PORT}/api/health   ║
╠══════════════════════════════════════════════════╣
║  Endpoints:                                      ║
║    POST   /api/auth/login                        ║
║    POST   /api/auth/register                     ║
║    GET    /api/agents          (CRUD + search)   ║
║    GET    /api/tasks           (CRUD + Kanban)   ║
║    GET    /api/workflows       (CRUD + execute)  ║
║    GET    /api/security/events (events + audit)  ║
║    GET    /api/security/kill-switch              ║
║    GET    /api/analytics/dashboard               ║
╚══════════════════════════════════════════════════╝
  `);
});

export default app;
