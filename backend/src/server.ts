import http from 'http';
import { createApp, initDatabase } from './app.js';
import { initWebSocket } from './services/websocket.js';
import { startKillSwitchMonitor } from './services/killSwitchMonitor.js';
import { startScheduledBackups } from './services/backup.js';
import { startMetricsRecorder } from './services/metricsRecorder.js';

const app = createApp();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Initialize
const server = http.createServer(app);
initWebSocket(server);

// Initialize DB and seed
initDatabase();

// Start real metrics recording (no simulation)
startMetricsRecorder();

// Start kill-switch auto-trigger monitoring
startKillSwitchMonitor();

// Start automated database backups (every 6 hours)
startScheduledBackups();

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Server] Port ${PORT} is already in use. Is another instance running?`);
    console.error('[Server] Stop the existing process and try again.');
  } else {
    console.error('[Server] Failed to start:', err.message);
  }
  process.exit(1);
});

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
║    POST   /api/tasks/:id/execute  (LLM exec)    ║
║    GET    /api/security/events (events + audit)  ║
║    GET    /api/security/kill-switch              ║
║    GET    /api/analytics/dashboard               ║
╚══════════════════════════════════════════════════╝
  `);
});

export default app;
