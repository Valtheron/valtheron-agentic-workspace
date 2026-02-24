// Valtheron API Client - Connects frontend to backend REST API

// Use relative paths when Vite proxy is configured, fallback to direct URLs
const API_BASE = import.meta.env.VITE_API_URL || '/api';
const WS_BASE = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

// Token management
let authToken: string | null = localStorage.getItem('valtheron_token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('valtheron_token', token);
  } else {
    localStorage.removeItem('valtheron_token');
  }
}

export function getToken(): string | null {
  return authToken;
}

// Base fetch wrapper
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
}

// ===== Auth API =====
export const authAPI = {
  login: (username: string, password: string) =>
    apiFetch<{ token: string; user: { id: string; username: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, password: string, role = 'operator') =>
    apiFetch<{ token: string; user: { id: string; username: string; role: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    }),

  me: () => apiFetch<{ user: { userId: string; username: string; role: string } }>('/auth/me'),
};

// ===== Agents API =====
export const agentsAPI = {
  list: (params?: { category?: string; status?: string; search?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return apiFetch<{ agents: unknown[]; total: number }>(`/agents${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) => apiFetch<unknown>(`/agents/${id}`),

  create: (data: { name: string; role: string; category: string; systemPrompt?: string; personality?: unknown; parameters?: unknown }) =>
    apiFetch<unknown>('/agents', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/agents/${id}`, { method: 'DELETE' }),

  suspend: (id: string) =>
    apiFetch<{ success: boolean }>(`/agents/${id}/suspend`, { method: 'POST' }),

  activate: (id: string) =>
    apiFetch<{ success: boolean }>(`/agents/${id}/activate`, { method: 'POST' }),

  stats: () => apiFetch<unknown>('/agents/stats/overview'),
};

// ===== Tasks API =====
export const tasksAPI = {
  list: (params?: { status?: string; category?: string; kanbanColumn?: string; assignedAgentId?: string; priority?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value) query.set(key, value);
      }
    }
    const qs = query.toString();
    return apiFetch<{ tasks: unknown[] }>(`/tasks${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) => apiFetch<unknown>(`/tasks/${id}`),

  create: (data: { title: string; category: string; description?: string; priority?: string; assignedAgentId?: string; taskType?: string; tags?: string[] }) =>
    apiFetch<unknown>('/tasks', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),

  move: (id: string, kanbanColumn: string) =>
    apiFetch<unknown>(`/tasks/${id}/move`, { method: 'PATCH', body: JSON.stringify({ kanbanColumn }) }),

  stats: () => apiFetch<unknown>('/tasks/stats/overview'),
};

// ===== Workflows API =====
export const workflowsAPI = {
  list: () => apiFetch<{ workflows: unknown[] }>('/workflows'),

  get: (id: string) => apiFetch<unknown>(`/workflows/${id}`),

  create: (data: { name: string; description?: string; steps?: unknown[]; tags?: string[] }) =>
    apiFetch<unknown>('/workflows', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/workflows/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/workflows/${id}`, { method: 'DELETE' }),

  start: (id: string) =>
    apiFetch<unknown>(`/workflows/${id}/start`, { method: 'POST' }),

  pause: (id: string) =>
    apiFetch<unknown>(`/workflows/${id}/pause`, { method: 'POST' }),

  completeStep: (workflowId: string, stepId: string, output?: string) =>
    apiFetch<unknown>(`/workflows/${workflowId}/steps/${stepId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ output }),
    }),
};

// ===== Security API =====
export const securityAPI = {
  events: (params?: { severity?: string; type?: string; resolved?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value) query.set(key, value);
      }
    }
    const qs = query.toString();
    return apiFetch<{ events: unknown[] }>(`/security/events${qs ? `?${qs}` : ''}`);
  },

  createEvent: (data: { type: string; severity: string; message: string; agentId?: string }) =>
    apiFetch<unknown>('/security/events', { method: 'POST', body: JSON.stringify(data) }),

  resolveEvent: (id: string) =>
    apiFetch<{ success: boolean }>(`/security/events/${id}/resolve`, { method: 'PATCH' }),

  killSwitch: () => apiFetch<unknown>('/security/kill-switch'),

  armKillSwitch: (reason?: string) =>
    apiFetch<{ success: boolean; armed: boolean; suspendedAgents: number }>('/security/kill-switch/arm', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  disarmKillSwitch: () =>
    apiFetch<{ success: boolean; armed: boolean; reactivatedAgents: number }>('/security/kill-switch/disarm', { method: 'POST' }),

  auditLog: (params?: { agentId?: string; riskLevel?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value) query.set(key, value);
      }
    }
    const qs = query.toString();
    return apiFetch<{ entries: unknown[] }>(`/security/audit${qs ? `?${qs}` : ''}`);
  },

  createAuditEntry: (data: { agentId: string; action: string; details?: string; riskLevel?: string }) =>
    apiFetch<unknown>('/security/audit', { method: 'POST', body: JSON.stringify(data) }),
};

// ===== Analytics API =====
export const analyticsAPI = {
  dashboard: () => apiFetch<unknown>('/analytics/dashboard'),
  performance: () => apiFetch<unknown>('/analytics/performance'),
  sla: () => apiFetch<unknown>('/analytics/sla'),
};

// ===== Chat API =====
export const chatAPI = {
  listSessions: (agentId?: string) => {
    const qs = agentId ? `?agentId=${agentId}` : '';
    return apiFetch<{ sessions: unknown[] }>(`/chat/sessions${qs}`);
  },

  createSession: (agentId: string, title?: string) =>
    apiFetch<unknown>('/chat/sessions', { method: 'POST', body: JSON.stringify({ agentId, title }) }),

  deleteSession: (id: string) =>
    apiFetch<{ success: boolean }>(`/chat/sessions/${id}`, { method: 'DELETE' }),

  getMessages: (sessionId: string) =>
    apiFetch<{ messages: unknown[] }>(`/chat/sessions/${sessionId}/messages`),

  sendMessage: (sessionId: string, content: string, llmHeaders?: Record<string, string>) =>
    apiFetch<unknown>(`/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
      headers: llmHeaders,
    }),
};

// ===== Collaboration API =====
export const collaborationAPI = {
  listSessions: () =>
    apiFetch<{ sessions: unknown[] }>('/collaboration/sessions'),

  createSession: (data: { name: string; agents: string[]; coordinatorPrompt?: string; delegationStrategy?: string; conflictResolution?: string; consensusThreshold?: number; maxIterations?: number }) =>
    apiFetch<unknown>('/collaboration/sessions', { method: 'POST', body: JSON.stringify(data) }),

  updateSession: (id: string, data: { status?: string; synthesis?: string }) =>
    apiFetch<unknown>(`/collaboration/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteSession: (id: string) =>
    apiFetch<{ success: boolean }>(`/collaboration/sessions/${id}`, { method: 'DELETE' }),

  getMessages: (sessionId: string) =>
    apiFetch<{ messages: unknown[] }>(`/collaboration/sessions/${sessionId}/messages`),

  sendMessage: (sessionId: string, senderId: string, content: string, messageType?: string) =>
    apiFetch<unknown>(`/collaboration/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ senderId, content, messageType }),
    }),
};

// ===== Health API =====
export const healthAPI = {
  check: () => apiFetch<{ status: string; version: string; timestamp: string; database: unknown; websocket: unknown }>('/health'),
};

// ===== WebSocket Client =====
export class ValtheronWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Map<string, Set<(data: unknown) => void>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect() {
    const url = authToken ? `${WS_BASE}?token=${authToken}` : WS_BASE;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected', {});
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.emit(msg.type, msg.payload);
        this.emit('*', msg); // Wildcard listener
      } catch {
        // Ignore
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('disconnected', {});
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      console.log(`WebSocket reconnecting (attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  subscribe(channel: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'subscribe', channel }));
    }
  }

  on(event: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}

// Singleton instance
export const wsClient = new ValtheronWebSocket();
