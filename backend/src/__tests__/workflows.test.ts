import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, initDatabase } from '../app.js';

const app = createApp();

describe('Workflows Endpoints', () => {
  let workflowId: string;

  it('should initialize DB', () => {
    initDatabase();
  });

  // GET /api/workflows
  it('GET /api/workflows — returns a list of workflows', async () => {
    const res = await request(app).get('/api/workflows');
    expect(res.status).toBe(200);
    expect(res.body.workflows).toBeInstanceOf(Array);
  });

  // POST /api/workflows
  it('POST /api/workflows — creates a new workflow', async () => {
    const res = await request(app)
      .post('/api/workflows')
      .send({
        name: 'Test Workflow',
        description: 'A test workflow',
        steps: [
          { name: 'Step 1', description: 'First step' },
          { name: 'Step 2', description: 'Second step', dependsOn: [] },
        ],
        tags: ['test', 'ci'],
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Workflow');
    expect(res.body.id).toBeTruthy();
    expect(res.body.steps).toHaveLength(2);
    expect(res.body.tags).toContain('test');
    workflowId = res.body.id;
  });

  it('POST /api/workflows — rejects missing name', async () => {
    const res = await request(app).post('/api/workflows').send({ description: 'no name' });
    expect(res.status).toBe(400);
  });

  // GET /api/workflows/:id
  it('GET /api/workflows/:id — returns a single workflow', async () => {
    const res = await request(app).get(`/api/workflows/${workflowId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(workflowId);
    expect(res.body.name).toBe('Test Workflow');
  });

  it('GET /api/workflows/:id — returns 404 for nonexistent', async () => {
    const res = await request(app).get('/api/workflows/nonexistent-id');
    expect(res.status).toBe(404);
  });

  // PATCH /api/workflows/:id
  it('PATCH /api/workflows/:id — updates workflow fields', async () => {
    const res = await request(app)
      .patch(`/api/workflows/${workflowId}`)
      .send({ name: 'Updated Workflow', description: 'Updated desc' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Workflow');
  });

  it('PATCH /api/workflows/:id — returns 404 for nonexistent', async () => {
    const res = await request(app).patch('/api/workflows/nonexistent').send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  // POST /api/workflows/:id/start
  it('POST /api/workflows/:id/start — starts a workflow', async () => {
    const res = await request(app).post(`/api/workflows/${workflowId}/start`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('running');
    expect(res.body.startedAt).toBeTruthy();
  });

  it('POST /api/workflows/:id/start — returns 404 for nonexistent', async () => {
    const res = await request(app).post('/api/workflows/nonexistent/start');
    expect(res.status).toBe(404);
  });

  // POST /api/workflows/:id/pause
  it('POST /api/workflows/:id/pause — pauses a running workflow', async () => {
    const res = await request(app).post(`/api/workflows/${workflowId}/pause`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paused');
  });

  // POST /api/workflows/:id/steps/:stepId/complete
  it('POST /api/workflows/:id/steps/:stepId/complete — completes a step', async () => {
    // Re-start the workflow first
    await request(app).post(`/api/workflows/${workflowId}/start`);
    // Get the workflow to find a step ID
    const wf = await request(app).get(`/api/workflows/${workflowId}`);
    const stepId = wf.body.steps[0].id;

    const res = await request(app)
      .post(`/api/workflows/${workflowId}/steps/${stepId}/complete`)
      .send({ output: 'Step completed successfully' });
    expect(res.status).toBe(200);
  });

  it('POST /api/workflows/:id/steps/:stepId/complete — returns 404 for bad step', async () => {
    const res = await request(app)
      .post(`/api/workflows/${workflowId}/steps/nonexistent/complete`)
      .send({ output: 'x' });
    expect(res.status).toBe(404);
  });

  // DELETE /api/workflows/:id
  it('DELETE /api/workflows/:id — deletes a workflow', async () => {
    const res = await request(app).delete(`/api/workflows/${workflowId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/workflows/:id — returns 404 for already deleted', async () => {
    const res = await request(app).delete(`/api/workflows/${workflowId}`);
    expect(res.status).toBe(404);
  });
});
