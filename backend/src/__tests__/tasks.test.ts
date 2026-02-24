import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('Tasks Endpoints', () => {
  let createdTaskId: string;

  // ── LIST ──────────────────────────────────────────────────────────────────
  describe('GET /api/tasks', () => {
    it('returns a list of tasks', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.tasks)).toBe(true);
    });

    it('supports status filter', async () => {
      const res = await request(app).get('/api/tasks?status=pending');
      expect(res.status).toBe(200);
      for (const task of res.body.tasks) {
        expect(task.status).toBe('pending');
      }
    });

    it('supports priority filter', async () => {
      const res = await request(app).get('/api/tasks?priority=high');
      expect(res.status).toBe(200);
      for (const task of res.body.tasks) {
        expect(task.priority).toBe('high');
      }
    });

    it('supports pagination', async () => {
      const res = await request(app).get('/api/tasks?limit=3&offset=0');
      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBeLessThanOrEqual(3);
    });
  });

  // ── CREATE ────────────────────────────────────────────────────────────────
  describe('POST /api/tasks', () => {
    it('creates a new task with required fields', async () => {
      const res = await request(app).post('/api/tasks').send({
        title: 'Test Task',
        category: 'qa',
        priority: 'medium',
      });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Task');
      expect(res.body.category).toBe('qa');
      expect(res.body.priority).toBe('medium');
      expect(res.body.id).toBeDefined();
      createdTaskId = res.body.id;
    });

    it('defaults kanbanColumn to backlog', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'Default Column Task', category: 'development' });

      expect(res.status).toBe(201);
      expect(res.body.kanbanColumn).toBe('backlog');
    });

    it('rejects missing required fields', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'No Category' });

      expect(res.status).toBe(400);
    });
  });

  // ── READ ONE ──────────────────────────────────────────────────────────────
  describe('GET /api/tasks/:id', () => {
    it('returns the task by id', async () => {
      const res = await request(app).get(`/api/tasks/${createdTaskId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdTaskId);
    });

    it('returns 404 for nonexistent id', async () => {
      const res = await request(app).get('/api/tasks/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  // ── UPDATE ────────────────────────────────────────────────────────────────
  describe('PATCH /api/tasks/:id', () => {
    it('updates allowed fields', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${createdTaskId}`)
        .send({ title: 'Updated Task', priority: 'high' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Task');
      expect(res.body.priority).toBe('high');
    });

    it('auto-sets completedAt when status → completed', async () => {
      const res = await request(app).patch(`/api/tasks/${createdTaskId}`).send({ status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
      expect(res.body.completedAt).not.toBeNull();
    });

    it('returns 404 for nonexistent task', async () => {
      const res = await request(app).patch('/api/tasks/nonexistent').send({ title: 'Ghost' });

      expect(res.status).toBe(404);
    });

    it('returns 400 when no valid fields sent', async () => {
      const res = await request(app).patch(`/api/tasks/${createdTaskId}`).send({ unknownField: 'x' });

      expect(res.status).toBe(400);
    });
  });

  // ── KANBAN MOVE ───────────────────────────────────────────────────────────
  describe('PATCH /api/tasks/:id/move', () => {
    it('moves task to a kanban column', async () => {
      const res = await request(app).patch(`/api/tasks/${createdTaskId}/move`).send({ kanbanColumn: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.kanbanColumn).toBe('in_progress');
      expect(res.body.status).toBe('in_progress');
    });

    it('returns 400 when kanbanColumn missing', async () => {
      const res = await request(app).patch(`/api/tasks/${createdTaskId}/move`).send({});

      expect(res.status).toBe(400);
    });
  });

  // ── STATS ─────────────────────────────────────────────────────────────────
  describe('GET /api/tasks/stats/overview', () => {
    it('returns task statistics', async () => {
      const res = await request(app).get('/api/tasks/stats/overview');
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThan(0);
      expect(res.body.byStatus).toBeDefined();
      expect(res.body.byPriority).toBeDefined();
    });
  });

  // ── DELETE ────────────────────────────────────────────────────────────────
  describe('DELETE /api/tasks/:id', () => {
    it('deletes a task', async () => {
      const res = await request(app).delete(`/api/tasks/${createdTaskId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for already-deleted task', async () => {
      const res = await request(app).delete(`/api/tasks/${createdTaskId}`);
      expect(res.status).toBe(404);
    });
  });
});
