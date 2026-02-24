import http from 'http';
import { createApp, initDatabase } from './app.js';
import { initWebSocket } from './services/websocket.js';
import { startActivitySimulator } from './services/activitySimulator.js';

const app = createApp();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Initialize
const server = http.createServer(app);
initWebSocket(server);

// Initialize DB and seed
initDatabase();

// Start live activity simulation
startActivitySimulator();

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
