import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { verifyToken } from '../middleware/auth.js';

interface WSClient {
  ws: WebSocket;
  userId?: string;
  username?: string;
  subscribedChannels: Set<string>;
}

const clients = new Map<WebSocket, WSClient>();

export type WSEventType = 'agent_status' | 'task_update' | 'workflow_progress' | 'security_event' | 'kill_switch' | 'metric_change' | 'system';

export interface WSMessage {
  type: WSEventType;
  payload: unknown;
  timestamp: string;
}

let wss: WebSocketServer;

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    const client: WSClient = { ws, subscribedChannels: new Set(['*']) };
    clients.set(ws, client);

    // Try to authenticate from query string
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (token) {
      try {
        const payload = verifyToken(token);
        client.userId = payload.userId;
        client.username = payload.username;
      } catch {
        // Anonymous connection allowed
      }
    }

    console.log(`WebSocket connected (${clients.size} total)`);

    // Send welcome message
    sendTo(ws, {
      type: 'system',
      payload: { message: 'Connected to Valtheron WebSocket', clientCount: clients.size },
      timestamp: new Date().toISOString(),
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // Handle subscription
        if (msg.action === 'subscribe' && msg.channel) {
          client.subscribedChannels.add(msg.channel);
        }
        if (msg.action === 'unsubscribe' && msg.channel) {
          client.subscribedChannels.delete(msg.channel);
        }
      } catch {
        // Ignore invalid messages
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`WebSocket disconnected (${clients.size} total)`);
    });

    ws.on('error', () => {
      clients.delete(ws);
    });
  });

  // Start heartbeat
  setInterval(() => {
    broadcast({
      type: 'system',
      payload: { heartbeat: true, clients: clients.size },
      timestamp: new Date().toISOString(),
    });
  }, 30000);

  console.log('WebSocket server initialized on /ws');
}

function sendTo(ws: WebSocket, message: WSMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export function broadcast(message: WSMessage, channel?: string) {
  for (const [, client] of clients) {
    if (!channel || client.subscribedChannels.has('*') || client.subscribedChannels.has(channel)) {
      sendTo(client.ws, message);
    }
  }
}

export function broadcastAgentStatus(agentId: string, status: string, name: string) {
  broadcast({
    type: 'agent_status',
    payload: { agentId, status, name },
    timestamp: new Date().toISOString(),
  }, 'agents');
}

export function broadcastTaskUpdate(taskId: string, status: string, title: string) {
  broadcast({
    type: 'task_update',
    payload: { taskId, status, title },
    timestamp: new Date().toISOString(),
  }, 'tasks');
}

export function broadcastWorkflowProgress(workflowId: string, stepId: string, progress: number) {
  broadcast({
    type: 'workflow_progress',
    payload: { workflowId, stepId, progress },
    timestamp: new Date().toISOString(),
  }, 'workflows');
}

export function broadcastSecurityEvent(event: { type: string; severity: string; message: string }) {
  broadcast({
    type: 'security_event',
    payload: event,
    timestamp: new Date().toISOString(),
  }, 'security');
}

export function broadcastKillSwitch(armed: boolean, reason?: string) {
  broadcast({
    type: 'kill_switch',
    payload: { armed, reason },
    timestamp: new Date().toISOString(),
  });
}

export function getClientCount(): number {
  return clients.size;
}
