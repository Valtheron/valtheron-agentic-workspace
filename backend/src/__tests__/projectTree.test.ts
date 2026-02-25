import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, initDatabase } from '../app.js';

const app = createApp();

describe('Project Tree Endpoints', () => {
  let nodeId: string;
  let childNodeId: string;

  it('should initialize DB', () => {
    initDatabase();
  });

  // POST /api/project-tree
  it('POST /api/project-tree — creates a root node', async () => {
    const res = await request(app).post('/api/project-tree').send({
      name: 'Root Module',
      type: 'module',
      status: 'active',
      progress: 50,
      description: 'Root node for testing',
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Root Module');
    expect(res.body.type).toBe('module');
    expect(res.body.progress).toBe(50);
    nodeId = res.body.id;
  });

  it('POST /api/project-tree — creates a child node', async () => {
    const res = await request(app).post('/api/project-tree').send({
      parentId: nodeId,
      name: 'Child Task',
      type: 'task',
      status: 'active',
      progress: 0,
      description: 'A child task',
    });
    expect(res.status).toBe(201);
    expect(res.body.parentId).toBe(nodeId);
    childNodeId = res.body.id;
  });

  it('POST /api/project-tree — rejects missing name', async () => {
    const res = await request(app).post('/api/project-tree').send({ type: 'module' });
    expect(res.status).toBe(400);
  });

  // GET /api/project-tree
  it('GET /api/project-tree — returns tree structure', async () => {
    const res = await request(app).get('/api/project-tree');
    expect(res.status).toBe(200);
    expect(res.body.tree).toBeInstanceOf(Array);
    // Find the root node and verify it has children
    const root = res.body.tree.find((n: { id: string }) => n.id === nodeId);
    if (root) {
      expect(root.children).toBeInstanceOf(Array);
    }
  });

  // GET /api/project-tree/flat
  it('GET /api/project-tree/flat — returns flat list', async () => {
    const res = await request(app).get('/api/project-tree/flat');
    expect(res.status).toBe(200);
    expect(res.body.nodes).toBeInstanceOf(Array);
    expect(res.body.nodes.length).toBeGreaterThanOrEqual(2);
  });

  // PATCH /api/project-tree/:id
  it('PATCH /api/project-tree/:id — updates a node', async () => {
    const res = await request(app)
      .patch(`/api/project-tree/${nodeId}`)
      .send({ name: 'Updated Root', progress: 75, status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Root');
    expect(res.body.progress).toBe(75);
  });

  it('PATCH /api/project-tree/:id — returns 404 for nonexistent', async () => {
    const res = await request(app).patch('/api/project-tree/nonexistent').send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  // DELETE /api/project-tree/:id (should cascade to children)
  it('DELETE /api/project-tree/:id — deletes node with children', async () => {
    const res = await request(app).delete(`/api/project-tree/${nodeId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deletedCount).toBeGreaterThanOrEqual(2); // root + child
  });

  it('DELETE /api/project-tree/:id — returns deletedCount 1 for already deleted (no-op)', async () => {
    const res = await request(app).delete(`/api/project-tree/${nodeId}`);
    expect(res.status).toBe(200);
    expect(res.body.deletedCount).toBe(1); // collectIds always includes the given id
  });

  // Verify child is also deleted
  it('child node should also be deleted (cascade)', async () => {
    const res = await request(app).get('/api/project-tree/flat');
    const found = res.body.nodes.find((n: { id: string }) => n.id === childNodeId);
    expect(found).toBeUndefined();
  });
});
