/**
 * Integration Tests - End-to-End API Workflow Tests
 * Tests critical cross-endpoint workflows that verify the system works as a whole.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp, initDatabase } from '../app.js';

const app = createApp();

describe('Integration: Auth → Agent → Task Workflow', () => {
  let authToken: string;
  let agentId: string;
  let taskId: string;

  beforeAll(() => {
    initDatabase();
  });

  it('registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: `integ_user_${Date.now()}`, password: 'TestPass123!', role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    authToken = res.body.token;
  });

  it('authenticated user can create an agent', async () => {
    const res = await request(app)
      .post('/api/agents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Integration Agent',
        role: 'Integration Tester',
        category: 'qa',
        systemPrompt: 'You test integrations.',
        personality: {
          creativity: 50,
          analyticalDepth: 80,
          riskTolerance: 30,
          communicationStyle: 'technical',
          archetype: 'analytiker',
          domainFocus: 'testing',
        },
        parameters: { temperature: 0.5, maxTokens: 4096, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
      });
    expect(res.status).toBe(201);
    agentId = res.body.id;
    expect(res.body.name).toBe('Integration Agent');
  });

  it('creates a task and assigns it to the agent', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Integration Test Task',
        description: 'A task for integration testing',
        category: 'qa',
        priority: 'high',
        assignedAgentId: agentId,
        taskType: 'testing',
        tags: ['integration', 'automated'],
      });
    expect(res.status).toBe(201);
    taskId = res.body.id;
    expect(res.body.assignedAgentId).toBe(agentId);
  });

  it('can move the task to in_progress', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/move`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ kanbanColumn: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.kanbanColumn).toBe('in_progress');
  });

  it('can update the task progress', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ progress: 75, status: 'in_progress' });
    expect(res.status).toBe(200);
  });

  it('can verify agent and task are linked', async () => {
    const agentRes = await request(app).get(`/api/agents/${agentId}`).set('Authorization', `Bearer ${authToken}`);
    expect(agentRes.status).toBe(200);
    expect(agentRes.body.name).toBe('Integration Agent');

    const taskRes = await request(app).get(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${authToken}`);
    expect(taskRes.status).toBe(200);
    expect(taskRes.body.assignedAgentId).toBe(agentId);
  });

  it('can complete the task', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'completed', progress: 100 });
    expect(res.status).toBe(200);
  });

  it('cleanup: delete task and agent', async () => {
    const taskDel = await request(app).delete(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${authToken}`);
    expect(taskDel.status).toBe(200);

    const agentDel = await request(app).delete(`/api/agents/${agentId}`).set('Authorization', `Bearer ${authToken}`);
    expect(agentDel.status).toBe(200);
  });
});

describe('Integration: Workflow Execution', () => {
  let workflowId: string;
  let stepIds: string[] = [];

  beforeAll(() => {
    initDatabase();
  });

  it('creates a workflow with dependent steps', async () => {
    const res = await request(app)
      .post('/api/workflows')
      .send({
        name: 'Integration Pipeline',
        description: 'Full CI/CD pipeline',
        steps: [
          { name: 'Build', description: 'Build the project' },
          { name: 'Test', description: 'Run tests' },
          { name: 'Deploy', description: 'Deploy to staging' },
        ],
        tags: ['ci', 'integration'],
      });
    expect(res.status).toBe(201);
    workflowId = res.body.id;
    stepIds = res.body.steps.map((s: { id: string }) => s.id);
    expect(res.body.steps).toHaveLength(3);
  });

  it('starts the workflow', async () => {
    const res = await request(app).post(`/api/workflows/${workflowId}/start`).send();
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('running');
  });

  it('completes steps sequentially', async () => {
    // Complete step 1
    const res1 = await request(app)
      .post(`/api/workflows/${workflowId}/steps/${stepIds[0]}/complete`)
      .send({ output: 'Build successful' });
    expect(res1.status).toBe(200);

    // Complete step 2
    const res2 = await request(app)
      .post(`/api/workflows/${workflowId}/steps/${stepIds[1]}/complete`)
      .send({ output: 'All tests passed' });
    expect(res2.status).toBe(200);

    // Complete step 3
    const res3 = await request(app)
      .post(`/api/workflows/${workflowId}/steps/${stepIds[2]}/complete`)
      .send({ output: 'Deployed to staging' });
    expect(res3.status).toBe(200);
  });

  it('workflow is marked as completed', async () => {
    const res = await request(app).get(`/api/workflows/${workflowId}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
  });

  it('cleanup: delete workflow', async () => {
    const res = await request(app).delete(`/api/workflows/${workflowId}`);
    expect(res.status).toBe(200);
  });
});

describe('Integration: Security Events & Kill Switch', () => {
  beforeAll(() => {
    initDatabase();
  });

  it('creates a security event', async () => {
    const res = await request(app).post('/api/security/events').send({
      type: 'anomaly',
      severity: 'high',
      message: 'Integration test anomaly detected',
    });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('anomaly');
  });

  it('lists security events including the new one', async () => {
    const res = await request(app).get('/api/security/events');
    expect(res.status).toBe(200);
    const found = res.body.events.find((e: { message: string }) => e.message === 'Integration test anomaly detected');
    expect(found).toBeTruthy();
  });

  it('aktiviert den kill switch', async () => {
    const res = await request(app).post('/api/security/kill-switch/aktivieren').send({ reason: 'Integration test' });
    expect(res.status).toBe(200);
    expect(res.body.aktiv).toBe(true);
  });

  it('verifies kill switch is aktiv', async () => {
    const res = await request(app).get('/api/security/kill-switch');
    expect(res.status).toBe(200);
    expect(res.body.aktiv).toBe(true);
  });

  it('deaktiviert den kill switch', async () => {
    const res = await request(app).post('/api/security/kill-switch/deaktivieren').send();
    expect(res.status).toBe(200);
    expect(res.body.aktiv).toBe(false);
  });
});

describe('Integration: Chat Session Lifecycle', () => {
  let sessionId: string;
  let agentId: string;

  beforeAll(() => {
    initDatabase();
  });

  it('creates an agent for chat', async () => {
    const res = await request(app)
      .post('/api/agents')
      .send({ name: 'ChatBot', role: 'Assistant', category: 'support' });
    expect(res.status).toBe(201);
    agentId = res.body.id;
  });

  it('creates a chat session', async () => {
    const res = await request(app).post('/api/chat/sessions').send({ agentId, title: 'Integration Test Chat' });
    expect(res.status).toBe(201);
    sessionId = res.body.id;
  });

  it('sends messages to the session', async () => {
    const msg1 = await request(app)
      .post(`/api/chat/sessions/${sessionId}/messages`)
      .send({ content: 'Hello, ChatBot!' });
    expect(msg1.status).toBe(201);

    const msg2 = await request(app).post(`/api/chat/sessions/${sessionId}/messages`).send({ content: 'How are you?' });
    expect(msg2.status).toBe(201);
  });

  it('retrieves messages from the session', async () => {
    const res = await request(app).get(`/api/chat/sessions/${sessionId}/messages`);
    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBeGreaterThanOrEqual(2);
  });

  it('lists sessions for the agent', async () => {
    const res = await request(app).get(`/api/chat/sessions?agentId=${agentId}`);
    expect(res.status).toBe(200);
    const found = res.body.sessions.find((s: { id: string }) => s.id === sessionId);
    expect(found).toBeTruthy();
  });

  it('cleanup: delete chat session and agent', async () => {
    await request(app).delete(`/api/chat/sessions/${sessionId}`);
    await request(app).delete(`/api/agents/${agentId}`);
  });
});

describe('Integration: Analytics Pipeline', () => {
  beforeAll(() => {
    initDatabase();
  });

  it('dashboard returns complete analytics data', async () => {
    const res = await request(app).get('/api/analytics/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalAgents');
    expect(res.body).toHaveProperty('activeAgents');
    expect(res.body).toHaveProperty('tasksTrend');
    expect(res.body).toHaveProperty('categoryDistribution');
    expect(res.body).toHaveProperty('topPerformers');
  });

  it('performance endpoint returns trends', async () => {
    const res = await request(app).get('/api/analytics/performance');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('trends');
    expect(res.body.trends).toBeInstanceOf(Array);
  });

  it('SLA endpoint returns SLA data', async () => {
    const res = await request(app).get('/api/analytics/sla');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('slaMetrics');
  });

  it('export endpoint supports JSON format', async () => {
    const res = await request(app).get('/api/analytics/export?type=agents&format=json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('type');
    expect(res.body.type).toBe('agents');
  });

  it('export endpoint supports CSV format', async () => {
    const res = await request(app).get('/api/analytics/export?type=agents&format=csv');
    expect(res.status).toBe(200);
    // CSV is returned as text content
    expect(res.text).toBeTruthy();
  });
});

describe('Integration: Collaboration Session', () => {
  let sessionId: string;
  let agentIds: string[] = [];

  beforeAll(() => {
    initDatabase();
  });

  it('creates agents for collaboration', async () => {
    const a1 = await request(app)
      .post('/api/agents')
      .send({ name: 'CollabAgent1', role: 'Lead', category: 'development' });
    const a2 = await request(app).post('/api/agents').send({ name: 'CollabAgent2', role: 'Reviewer', category: 'qa' });
    expect(a1.status).toBe(201);
    expect(a2.status).toBe(201);
    agentIds = [a1.body.id, a2.body.id];
  });

  it('creates a collaboration session', async () => {
    const res = await request(app).post('/api/collaboration/sessions').send({
      name: 'Integration Collab',
      agents: agentIds,
      coordinatorPrompt: 'Coordinate the work',
      delegationStrategy: 'round-robin',
      conflictResolution: 'voting',
      consensusThreshold: 0.6,
      maxIterations: 10,
    });
    expect(res.status).toBe(201);
    sessionId = res.body.id;
  });

  it('agents exchange messages', async () => {
    const msg1 = await request(app)
      .post(`/api/collaboration/sessions/${sessionId}/messages`)
      .send({ senderId: agentIds[0], content: 'Starting work on feature', messageType: 'message' });
    expect(msg1.status).toBe(201);

    const msg2 = await request(app)
      .post(`/api/collaboration/sessions/${sessionId}/messages`)
      .send({ senderId: agentIds[1], content: 'Reviewing the approach', messageType: 'message' });
    expect(msg2.status).toBe(201);
  });

  it('retrieves collaboration messages', async () => {
    const res = await request(app).get(`/api/collaboration/sessions/${sessionId}/messages`);
    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBeGreaterThanOrEqual(2);
  });

  it('updates session status', async () => {
    const res = await request(app)
      .patch(`/api/collaboration/sessions/${sessionId}`)
      .send({ status: 'completed', synthesis: 'Feature implemented and reviewed' });
    expect(res.status).toBe(200);
  });

  it('cleanup', async () => {
    await request(app).delete(`/api/collaboration/sessions/${sessionId}`);
    for (const id of agentIds) {
      await request(app).delete(`/api/agents/${id}`);
    }
  });
});
