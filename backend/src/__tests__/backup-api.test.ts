import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, initDatabase } from '../app.js';

const app = createApp();

describe('Backup API Endpoints', () => {
  let token: string;

  it('should initialize DB and get admin token', async () => {
    initDatabase();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'backup_admin', password: 'testpass123', role: 'admin' });
    token = res.body.token;
    expect(token).toBeTruthy();
  });

  // POST /api/backup — create a backup
  it('POST /api/backup — creates a backup', async () => {
    const res = await request(app).post('/api/backup').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.backup.filename).toMatch(/^valtheron-backup-/);
    expect(res.body.backup.sizeBytes).toBeGreaterThan(0);
  });

  // GET /api/backup — list backups
  it('GET /api/backup — lists backups', async () => {
    const res = await request(app).get('/api/backup').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.backups).toBeInstanceOf(Array);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  // POST /api/backup/restore — missing filename
  it('POST /api/backup/restore — rejects missing filename', async () => {
    const res = await request(app).post('/api/backup/restore').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
  });

  // POST /api/backup/restore — nonexistent backup
  it('POST /api/backup/restore — returns 404 for nonexistent backup', async () => {
    const res = await request(app)
      .post('/api/backup/restore')
      .set('Authorization', `Bearer ${token}`)
      .send({ filename: 'nonexistent-backup.db' });
    expect(res.status).toBe(404);
  });

  // In dev/test mode, adminGuard = optionalAuth, so all users can access
  it('GET /api/backup — accessible in dev mode', async () => {
    const res = await request(app).get('/api/backup');
    expect(res.status).toBe(200);
  });
});
