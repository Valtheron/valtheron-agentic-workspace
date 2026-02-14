# Agentic Workspace - API-Spezifikation

**Version:** 1.0  
**Datum:** Januar 2026  
**Base URL:** `https://api.agentic-workspace.com/api/v1`

---

## Authentifizierung

Alle API-Anfragen müssen mit einem JWT-Token authentifiziert werden. Der Token wird im `Authorization`-Header mit dem Format `Bearer <token>` übergeben.

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  https://api.agentic-workspace.com/api/v1/agents
```

### Login-Endpunkt

**POST** `/auth/login`

Authentifiziert einen Benutzer und gibt einen JWT-Token zurück.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

---

## Agent-Endpunkte

### GET /agents

Ruft eine Liste aller Agenten ab.

**Query Parameters:**
- `category` (optional): Filterung nach Agent-Kategorie (trading, development, security, qa, documentation, deployment, analyst, support, integration, monitoring)
- `status` (optional): Filterung nach Status (active, idle, working, blocked)
- `limit` (optional, default: 50): Anzahl der Ergebnisse
- `offset` (optional, default: 0): Offset für Pagination

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "agent_001",
      "name": "Market Analyzer 01",
      "role": "Market Analysis",
      "category": "trading",
      "status": "active",
      "successRate": 98,
      "tasksCompleted": 156,
      "currentTask": "Analyzing BTC/USD patterns",
      "lastActivity": "2026-01-03T10:30:00Z"
    }
  ],
  "total": 200,
  "limit": 50,
  "offset": 0
}
```

### GET /agents/:id

Ruft Details eines spezifischen Agenten ab.

**Response (200 OK):**
```json
{
  "id": "agent_001",
  "name": "Market Analyzer 01",
  "role": "Market Analysis",
  "category": "trading",
  "status": "active",
  "successRate": 98,
  "tasksCompleted": 156,
  "failedTasks": 3,
  "averageTaskDuration": 45,
  "currentTask": "Analyzing BTC/USD patterns",
  "lastActivity": "2026-01-03T10:30:00Z",
  "systemPrompt": "You are a market analysis specialist...",
  "parameters": {
    "maxConcurrentTasks": 5,
    "timeout": 3600
  }
}
```

### POST /agents

Erstellt einen neuen Agenten.

**Request Body:**
```json
{
  "name": "New Agent",
  "role": "Custom Role",
  "category": "trading",
  "systemPrompt": "You are a specialized agent...",
  "parameters": {
    "maxConcurrentTasks": 5,
    "timeout": 3600
  }
}
```

**Response (201 Created):**
```json
{
  "id": "agent_201",
  "name": "New Agent",
  "role": "Custom Role",
  "category": "trading",
  "status": "idle",
  "successRate": 0,
  "tasksCompleted": 0
}
```

### PUT /agents/:id

Aktualisiert einen Agenten.

**Request Body:**
```json
{
  "systemPrompt": "Updated system prompt...",
  "parameters": {
    "maxConcurrentTasks": 10
  }
}
```

**Response (200 OK):**
```json
{
  "id": "agent_001",
  "name": "Market Analyzer 01",
  "status": "idle"
}
```

### DELETE /agents/:id

Löscht einen Agenten.

**Response (204 No Content)**

---

## Task-Endpunkte

### GET /tasks

Ruft eine Liste aller Tasks ab.

**Query Parameters:**
- `status` (optional): Filterung nach Status (pending, in-progress, completed, failed)
- `assignedAgent` (optional): Filterung nach zugewiesenem Agenten
- `limit` (optional, default: 50): Anzahl der Ergebnisse
- `offset` (optional, default: 0): Offset für Pagination

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "task_001",
      "title": "Analyze Market Trends",
      "description": "Analyze BTC/USD market trends",
      "status": "in-progress",
      "priority": "high",
      "assignedAgent": "agent_001",
      "createdAt": "2026-01-03T09:00:00Z",
      "deadline": "2026-01-03T12:00:00Z",
      "progress": 65
    }
  ],
  "total": 487,
  "limit": 50,
  "offset": 0
}
```

### GET /tasks/:id

Ruft Details einer spezifischen Task ab.

**Response (200 OK):**
```json
{
  "id": "task_001",
  "title": "Analyze Market Trends",
  "description": "Analyze BTC/USD market trends",
  "status": "in-progress",
  "priority": "high",
  "assignedAgent": "agent_001",
  "createdAt": "2026-01-03T09:00:00Z",
  "deadline": "2026-01-03T12:00:00Z",
  "progress": 65,
  "dependencies": ["task_000"],
  "output": {
    "analysis": "Uptrend detected...",
    "confidence": 0.85
  }
}
```

### POST /tasks

Erstellt eine neue Task.

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "priority": "high",
  "deadline": "2026-01-03T12:00:00Z",
  "dependencies": ["task_000"],
  "requiredCapabilities": ["market-analysis"]
}
```

**Response (201 Created):**
```json
{
  "id": "task_002",
  "title": "New Task",
  "status": "pending",
  "assignedAgent": "agent_001",
  "createdAt": "2026-01-03T10:00:00Z"
}
```

### PUT /tasks/:id

Aktualisiert eine Task.

**Request Body:**
```json
{
  "status": "in-progress",
  "progress": 50
}
```

**Response (200 OK):**
```json
{
  "id": "task_001",
  "status": "in-progress",
  "progress": 50
}
```

### DELETE /tasks/:id

Löscht eine Task.

**Response (204 No Content)**

---

## Audit-Endpunkte

### GET /audit/logs

Ruft Audit-Logs ab.

**Query Parameters:**
- `agent` (optional): Filterung nach Agent
- `action` (optional): Filterung nach Aktion
- `startDate` (optional): Start-Datum (ISO 8601)
- `endDate` (optional): End-Datum (ISO 8601)
- `limit` (optional, default: 100): Anzahl der Ergebnisse
- `offset` (optional, default: 0): Offset für Pagination

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "log_001",
      "timestamp": "2026-01-03T10:30:00Z",
      "agent": "agent_001",
      "action": "task_completed",
      "details": {
        "taskId": "task_001",
        "result": "success"
      },
      "severity": "info"
    }
  ],
  "total": 5234,
  "limit": 100,
  "offset": 0
}
```

### GET /audit/logs/:id

Ruft Details eines spezifischen Audit-Logs ab.

**Response (200 OK):**
```json
{
  "id": "log_001",
  "timestamp": "2026-01-03T10:30:00Z",
  "agent": "agent_001",
  "action": "task_completed",
  "details": {
    "taskId": "task_001",
    "result": "success",
    "duration": 1800
  },
  "severity": "info",
  "userId": "user_123"
}
```

---

## Analytics-Endpunkte

### GET /analytics/dashboard

Ruft Dashboard-Metriken ab.

**Response (200 OK):**
```json
{
  "activeAgents": 24,
  "totalAgents": 200,
  "tasksCompleted": 487,
  "tasksInProgress": 12,
  "tasksFailed": 3,
  "projectProgress": 45,
  "averageSuccessRate": 96.25,
  "systemUptime": 99.99,
  "averageResponseTime": 145
}
```

### GET /analytics/agent/:agentId

Ruft Agent-spezifische Metriken ab.

**Response (200 OK):**
```json
{
  "agentId": "agent_001",
  "tasksCompleted": 156,
  "tasksFailed": 3,
  "successRate": 98,
  "averageTaskDuration": 45,
  "totalExecutionTime": 7020,
  "lastActivity": "2026-01-03T10:30:00Z",
  "performanceTrend": [
    { "date": "2026-01-01", "successRate": 97 },
    { "date": "2026-01-02", "successRate": 97.5 },
    { "date": "2026-01-03", "successRate": 98 }
  ]
}
```

### GET /analytics/tasks

Ruft Task-spezifische Metriken ab.

**Response (200 OK):**
```json
{
  "totalTasks": 502,
  "completedTasks": 487,
  "failedTasks": 3,
  "inProgressTasks": 12,
  "averageTaskDuration": 1800,
  "tasksByStatus": {
    "completed": 487,
    "in-progress": 12,
    "pending": 3,
    "failed": 3
  },
  "tasksByCategory": {
    "trading": 156,
    "development": 89,
    "security": 42,
    "qa": 234,
    "documentation": 67
  }
}
```

---

## Kill-Switch-Endpunkte

### POST /kill-switch/activate

Aktiviert den Kill-Switch für einen Agenten.

**Request Body:**
```json
{
  "agentId": "agent_001",
  "reason": "Risk parameter violation"
}
```

**Response (200 OK):**
```json
{
  "agentId": "agent_001",
  "status": "deactivated",
  "timestamp": "2026-01-03T10:30:00Z",
  "reason": "Risk parameter violation"
}
```

### GET /kill-switch/status/:agentId

Ruft Kill-Switch-Status eines Agenten ab.

**Response (200 OK):**
```json
{
  "agentId": "agent_001",
  "status": "active",
  "lastActivation": null,
  "riskParameters": {
    "maxErrorRate": 0.05,
    "maxTaskFailureRate": 0.1,
    "maxResourceUsage": 0.8
  }
}
```

---

## WebSocket-Endpunkte

### WebSocket Connection

Verbindung zu Echtzeit-Updates.

**URL:** `wss://api.agentic-workspace.com/ws`

**Authentication:** Token im Query-Parameter: `?token=<jwt_token>`

**Nachrichten-Format:**

**Agent Status Update:**
```json
{
  "type": "agent_status_update",
  "agentId": "agent_001",
  "status": "working",
  "currentTask": "task_001",
  "timestamp": "2026-01-03T10:30:00Z"
}
```

**Task Progress Update:**
```json
{
  "type": "task_progress_update",
  "taskId": "task_001",
  "progress": 75,
  "status": "in-progress",
  "timestamp": "2026-01-03T10:30:00Z"
}
```

**Task Completion:**
```json
{
  "type": "task_completed",
  "taskId": "task_001",
  "result": "success",
  "output": {
    "analysis": "Market trend analysis complete"
  },
  "timestamp": "2026-01-03T10:30:00Z"
}
```

**Error:**
```json
{
  "type": "error",
  "message": "Connection error",
  "timestamp": "2026-01-03T10:30:00Z"
}
```

---

## Error-Handling

Alle Fehler folgen diesem Format:

```json
{
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "The requested agent does not exist",
    "details": {
      "agentId": "agent_999"
    }
  }
}
```

### Error-Codes

| Code | HTTP Status | Bedeutung |
|------|-------------|----------|
| INVALID_REQUEST | 400 | Ungültige Request-Parameter |
| UNAUTHORIZED | 401 | Authentifizierung erforderlich |
| FORBIDDEN | 403 | Zugriff verweigert |
| NOT_FOUND | 404 | Ressource nicht gefunden |
| CONFLICT | 409 | Konflikt mit existierender Ressource |
| RATE_LIMITED | 429 | Rate-Limit überschritten |
| INTERNAL_ERROR | 500 | Interner Server-Fehler |
| SERVICE_UNAVAILABLE | 503 | Service nicht verfügbar |

---

## Rate-Limiting

API-Anfragen sind auf 1000 Anfragen pro Minute pro API-Key limitiert.

**Response-Header:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

---

**Dokument Ende**

*Diese API-Spezifikation sollte von allen Entwicklern verwendet werden, um die Agentic Workspace API zu implementieren und zu integrieren.*
