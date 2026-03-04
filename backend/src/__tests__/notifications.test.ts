import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, initDatabase } from '../app.js';

const app = createApp();

describe('Notifications Endpoints', () => {
  let notificationId: string;

  it('should initialize DB', () => {
    initDatabase();
  });

  // POST /api/notifications
  it('POST /api/notifications — creates a notification', async () => {
    const res = await request(app).post('/api/notifications').send({
      type: 'alert',
      title: 'Test Notification',
      message: 'This is a test notification',
      severity: 'warning',
    });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Notification');
    expect(res.body.read).toBe(0);
    notificationId = res.body.id;
  });

  it('POST /api/notifications — rejects missing fields', async () => {
    const res = await request(app).post('/api/notifications').send({ type: 'alert' });
    expect(res.status).toBe(400);
  });

  // Create extra notifications for filtering
  it('POST — creates additional notifications', async () => {
    await request(app).post('/api/notifications').send({
      type: 'info',
      title: 'Info Note',
      message: 'Informational',
      severity: 'info',
    });
    await request(app).post('/api/notifications').send({
      type: 'error',
      title: 'Error Note',
      message: 'An error occurred',
      severity: 'error',
    });
  });

  // GET /api/notifications
  it('GET /api/notifications — returns notifications list', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(200);
    expect(res.body.notifications).toBeInstanceOf(Array);
    expect(res.body.notifications.length).toBeGreaterThanOrEqual(3);
    expect(typeof res.body.unreadCount).toBe('number');
  });

  it('GET /api/notifications — supports severity filter', async () => {
    const res = await request(app).get('/api/notifications?severity=warning');
    expect(res.status).toBe(200);
    expect(res.body.notifications.every((n: { severity: string }) => n.severity === 'warning')).toBe(true);
  });

  it('GET /api/notifications — supports limit', async () => {
    const res = await request(app).get('/api/notifications?limit=1');
    expect(res.status).toBe(200);
    expect(res.body.notifications.length).toBeLessThanOrEqual(1);
  });

  // PATCH /api/notifications/:id/read
  it('PATCH /api/notifications/:id/read — marks notification as read', async () => {
    const res = await request(app).patch(`/api/notifications/${notificationId}/read`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('PATCH /api/notifications/:id/read — returns 404 for nonexistent', async () => {
    const res = await request(app).patch('/api/notifications/nonexistent/read');
    expect(res.status).toBe(404);
  });

  // GET with read filter (uses 'true'/'false' not '1'/'0')
  it('GET /api/notifications — supports read filter', async () => {
    const res = await request(app).get('/api/notifications?read=true');
    expect(res.status).toBe(200);
    expect(res.body.notifications.every((n: { read: number }) => n.read === 1)).toBe(true);
  });

  // POST /api/notifications/read-all
  it('POST /api/notifications/read-all — marks all as read', async () => {
    const res = await request(app).post('/api/notifications/read-all');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // DELETE /api/notifications/:id
  it('DELETE /api/notifications/:id — deletes a notification', async () => {
    const res = await request(app).delete(`/api/notifications/${notificationId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/notifications/:id — returns 404 for already deleted', async () => {
    const res = await request(app).delete(`/api/notifications/${notificationId}`);
    expect(res.status).toBe(404);
  });
});
