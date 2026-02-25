# Valtheron Agentic Workspace - API Documentation

**Base URL:** `http://localhost:3001/api`
**Auth:** Bearer Token (JWT, 24h TTL)
**Content-Type:** `application/json`

---

## Authentication

### POST /auth/register
Register a new user.

**Body:**
```json
{ "username": "string", "password": "string", "role": "admin|operator|viewer" }
```
**Response (200):**
```json
{ "token": "jwt...", "user": { "id": "string", "username": "string", "role": "string" } }
```

### POST /auth/login
Login with username/password. Returns `mfaRequired: true` if MFA is enabled.

**Body:**
```json
{ "username": "string", "password": "string" }
```
**Response (200):**
```json
{ "token": "jwt...", "user": { "id": "string", "username": "string", "role": "string" } }
```
**MFA Response (200):**
```json
{ "mfaRequired": true, "userId": "string" }
```

### POST /auth/logout
Logout (invalidate token). Requires auth.

### GET /auth/me
Get current user info. Requires auth.

### POST /auth/refresh
Refresh an expired JWT token.

---

## MFA (Multi-Factor Authentication)

### POST /auth/mfa/setup
Start MFA enrollment. Returns TOTP secret and QR code. Requires auth.

**Response (200):**
```json
{ "secret": "string", "uri": "otpauth://...", "qrDataUrl": "data:image/png;base64,...", "backupCodes": ["string"] }
```

### POST /auth/mfa/confirm
Confirm MFA setup with a TOTP code. Requires auth.

**Body:** `{ "code": "123456" }`

### POST /auth/mfa/verify
Verify MFA during login (second factor).

**Body:** `{ "userId": "string", "code": "123456" }`
**Response (200):** `{ "token": "jwt...", "user": {...} }`

### POST /auth/mfa/disable
Disable MFA. Requires auth + current TOTP code.

**Body:** `{ "code": "123456" }`

### GET /auth/mfa/status
Check MFA status. Requires auth.

**Response (200):** `{ "mfaEnabled": true|false }`

---

## Agents

### GET /agents
List agents with optional filters.

**Query:** `?category=&status=&search=&limit=50&offset=0`
**Response (200):** `{ "agents": [...], "total": number }`

### GET /agents/:id
Get agent by ID.

### POST /agents
Create a new agent.

**Body:**
```json
{
  "name": "string", "role": "string",
  "category": "trading|security|development|qa|documentation|deployment|analyst|support|integration|monitoring",
  "systemPrompt": "string",
  "personality": { "creativity": 0-100, "analyticalDepth": 0-100, "riskTolerance": 0-100, "communicationStyle": "formal|casual|technical|diplomatic", "archetype": "analytiker|kreativer|diplomat|commander", "domainFocus": "string" },
  "parameters": { "temperature": 0-1, "maxTokens": number, "topP": 0-1, "frequencyPenalty": number, "presencePenalty": number }
}
```

### PATCH /agents/:id
Update agent fields.

### DELETE /agents/:id
Delete agent.

### POST /agents/:id/suspend
Suspend an agent.

### POST /agents/:id/activate
Reactivate an agent.

### GET /agents/stats/overview
Get agent statistics overview.

---

## Tasks

### GET /tasks
List tasks with optional filters.

**Query:** `?status=&category=&kanbanColumn=&assignedAgentId=&priority=`
**Response (200):** `{ "tasks": [...] }`

### GET /tasks/:id
Get task by ID.

### POST /tasks
Create a new task.

**Body:**
```json
{
  "title": "string", "category": "string",
  "description": "string", "priority": "critical|high|medium|low",
  "assignedAgentId": "string", "taskType": "feature|bug|improvement|research|documentation|testing|deployment|review",
  "tags": ["string"]
}
```

### PATCH /tasks/:id
Update task fields.

### DELETE /tasks/:id
Delete task.

### PATCH /tasks/:id/move
Move task to a different kanban column.

**Body:** `{ "kanbanColumn": "backlog|todo|in_progress|review|done" }`

### GET /tasks/stats/overview
Get task statistics.

---

## Workflows

### GET /workflows
List all workflows.

### GET /workflows/:id
Get workflow by ID.

### POST /workflows
Create a workflow.

**Body:**
```json
{
  "name": "string", "description": "string",
  "steps": [{ "name": "string", "description": "string", "dependsOn": ["stepId"] }],
  "tags": ["string"]
}
```

### PATCH /workflows/:id
Update workflow fields.

### DELETE /workflows/:id
Delete workflow.

### POST /workflows/:id/start
Start workflow execution.

### POST /workflows/:id/pause
Pause a running workflow.

### POST /workflows/:id/steps/:stepId/complete
Complete a workflow step.

**Body:** `{ "output": "string" }`

---

## Security

### GET /security/events
List security events.

**Query:** `?severity=&type=&resolved=`

### POST /security/events
Create a security event.

**Body:** `{ "type": "auth|access|injection|anomaly|policy", "severity": "critical|high|medium|low|info", "message": "string", "agentId": "string" }`

### PATCH /security/events/:id/resolve
Resolve a security event.

### GET /security/kill-switch
Get kill switch status.

### POST /security/kill-switch/arm
Arm the kill switch (suspends all active agents).

**Body:** `{ "reason": "string" }`
**Response (200):** `{ "success": true, "armed": true, "suspendedAgents": number }`

### POST /security/kill-switch/disarm
Disarm the kill switch (reactivates suspended agents).

**Response (200):** `{ "success": true, "armed": false, "reactivatedAgents": number }`

### GET /security/audit
List audit log entries.

**Query:** `?agentId=&riskLevel=`

### POST /security/audit
Create an audit entry.

**Body:** `{ "agentId": "string", "action": "string", "details": "string", "riskLevel": "critical|high|medium|low|info" }`

---

## Analytics

### GET /analytics/dashboard
Dashboard KPIs and aggregated data.

**Response (200):**
```json
{
  "totalAgents": number, "activeAgents": number, "tasksToday": number,
  "successRate": number, "avgResponseTime": number, "errorRate": number, "uptime": number,
  "tasksTrend": [{ "date": "string", "count": number }],
  "categoryDistribution": [{ "category": "string", "count": number }],
  "topPerformers": [{ "agentId": "string", "name": "string", "score": number }]
}
```

### GET /analytics/performance
30-day performance trends.

**Response (200):**
```json
{ "trends": [{ "date": "string", "throughput": number, "errorRate": number, "avgResponseTime": number, "successRate": number, "activeAgents": number }] }
```

### GET /analytics/sla
SLA monitoring metrics.

### GET /analytics/agents/:agentId
Agent-specific performance drill-down.

### GET /analytics/export
Export data as JSON or CSV.

**Query:** `?type=agents|tasks|metrics|audit&format=json|csv`

---

## Chat

### GET /chat/sessions
List chat sessions.

**Query:** `?agentId=`

### POST /chat/sessions
Create a chat session.

**Body:** `{ "agentId": "string", "title": "string" }`

### DELETE /chat/sessions/:id
Delete a chat session.

### GET /chat/sessions/:id/messages
Get messages in a chat session.

### POST /chat/sessions/:id/messages
Send a message.

**Body:** `{ "content": "string" }`

---

## Collaboration

### GET /collaboration/sessions
List collaboration sessions.

### POST /collaboration/sessions
Create a collaboration session.

**Body:**
```json
{
  "name": "string", "agents": ["agentId"],
  "coordinatorPrompt": "string",
  "delegationStrategy": "round-robin|capability-based|load-balanced|priority",
  "conflictResolution": "coordinator-decides|voting|merge|priority-based",
  "consensusThreshold": 0-1, "maxIterations": number
}
```

### PATCH /collaboration/sessions/:id
Update session (status, synthesis).

### DELETE /collaboration/sessions/:id
Delete session.

### GET /collaboration/sessions/:id/messages
Get messages.

### POST /collaboration/sessions/:id/messages
Send a message.

**Body:** `{ "senderId": "string", "content": "string", "messageType": "message|system|decision|file_share" }`

---

## File Sharing

### GET /collaboration/sessions/:id/files
List files in a session.

### POST /collaboration/sessions/:id/files
Upload a file.

**Body:** `{ "filename": "string", "content": "string", "mimeType": "string" }`

### GET /collaboration/files/:fileId
Get file content.

### PUT /collaboration/files/:fileId
Update file content.

### GET /collaboration/files/:fileId/versions
Get file version history.

### GET /collaboration/files/:fileId/versions/:version
Get specific file version.

### DELETE /collaboration/files/:fileId
Delete file.

---

## Project Tree

### GET /project-tree
Get hierarchical project tree.

### GET /project-tree/flat
Get flat list of all nodes.

### POST /project-tree
Create a tree node.

**Body:** `{ "parentId": "string", "name": "string", "type": "project|phase|milestone|module|task|agent", "status": "string", "progress": 0-100, "description": "string" }`

### PATCH /project-tree/:id
Update a tree node.

### DELETE /project-tree/:id
Delete a node and all descendants.

---

## Notifications

### GET /notifications
List notifications.

**Query:** `?read=true|false&severity=&limit=`

### PATCH /notifications/:id/read
Mark notification as read.

### POST /notifications/read-all
Mark all notifications as read.

### DELETE /notifications/:id
Delete notification.

---

## Secrets (Admin only)

### GET /secrets
List secrets (names only).

### GET /secrets/:name
Get secret value (decrypted).

### POST /secrets
Create a secret.

**Body:** `{ "name": "string", "value": "string" }`

### PUT /secrets/:name
Rotate (update) a secret.

**Body:** `{ "value": "string" }`

### DELETE /secrets/:name
Delete a secret.

---

## Backup (Admin only)

### GET /backup
List available backups.

### POST /backup
Create a new backup.

### POST /backup/restore
Restore from a backup.

**Body:** `{ "filename": "string" }`

---

## Health

### GET /health
Health check endpoint.

**Response (200):**
```json
{ "status": "ok", "version": "2.0.0", "timestamp": "ISO", "database": { "agents": number, "tasks": number }, "websocket": { "clients": number } }
```

---

## WebSocket

**URL:** `ws://localhost:3001/ws?token=JWT`

**Channels:** `agents`, `tasks`, `security`, `workflows`, `analytics`

**Events:**
- `agent:update` - Agent status/data changed
- `task:update` - Task status/progress changed
- `security:event` - New security event
- `workflow:update` - Workflow status changed
- `kill-switch:update` - Kill switch state changed

**Subscribe:** `{ "action": "subscribe", "channel": "agents" }`

---

## Rate Limiting

Auth endpoints are rate-limited to **20 requests per 60 seconds** per IP.

## Error Responses

All errors follow the format:
```json
{ "error": "Error message description" }
```

Common status codes:
- `400` - Bad request / validation error
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient role)
- `404` - Resource not found
- `409` - Conflict (duplicate resource)
- `500` - Internal server error
