import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, initDatabase } from '../app.js';

const app = createApp();

describe('File Sharing Endpoints', () => {
  let sessionId: string;
  let fileId: string;

  it('should initialize DB and create a collaboration session', async () => {
    initDatabase();
    const res = await request(app)
      .post('/api/collaboration/sessions')
      .send({
        name: 'File Test Session',
        agents: ['agent-1'],
      });
    sessionId = res.body.id;
    expect(sessionId).toBeTruthy();
  });

  // POST /api/collaboration/sessions/:id/files
  it('POST — uploads a file', async () => {
    const res = await request(app).post(`/api/collaboration/sessions/${sessionId}/files`).send({
      filename: 'test-file.txt',
      content: 'Hello, World!',
      mimeType: 'text/plain',
    });
    expect(res.status).toBe(201);
    expect(res.body.filename).toBe('test-file.txt');
    expect(res.body.size).toBeGreaterThan(0);
    expect(res.body.version).toBe(1);
    fileId = res.body.id;
  });

  it('POST — rejects missing filename', async () => {
    const res = await request(app)
      .post(`/api/collaboration/sessions/${sessionId}/files`)
      .send({ content: 'no filename' });
    expect(res.status).toBe(400);
  });

  // GET /api/collaboration/sessions/:id/files
  it('GET — lists files in session', async () => {
    const res = await request(app).get(`/api/collaboration/sessions/${sessionId}/files`);
    expect(res.status).toBe(200);
    expect(res.body.files).toBeInstanceOf(Array);
    expect(res.body.files.length).toBeGreaterThanOrEqual(1);
  });

  // GET /api/collaboration/files/:fileId
  it('GET /files/:fileId — returns file with content', async () => {
    const res = await request(app).get(`/api/collaboration/files/${fileId}`);
    expect(res.status).toBe(200);
    expect(res.body.filename).toBe('test-file.txt');
    expect(res.body.content).toBe('Hello, World!');
  });

  it('GET /files/:fileId — returns 404 for nonexistent', async () => {
    const res = await request(app).get('/api/collaboration/files/nonexistent');
    expect(res.status).toBe(404);
  });

  // PUT /api/collaboration/files/:fileId
  it('PUT /files/:fileId — updates file content', async () => {
    const res = await request(app)
      .put(`/api/collaboration/files/${fileId}`)
      .send({ content: 'Updated content!', changeDescription: 'Updated text' });
    expect(res.status).toBe(200);
    expect(res.body.version).toBe(2);
  });

  it('PUT /files/:fileId — rejects missing content', async () => {
    const res = await request(app).put(`/api/collaboration/files/${fileId}`).send({ changeDescription: 'no content' });
    expect(res.status).toBe(400);
  });

  // GET /api/collaboration/files/:fileId/versions
  it('GET /files/:fileId/versions — returns version history', async () => {
    const res = await request(app).get(`/api/collaboration/files/${fileId}/versions`);
    expect(res.status).toBe(200);
    expect(res.body.versions).toBeInstanceOf(Array);
    expect(res.body.versions.length).toBeGreaterThanOrEqual(1);
  });

  // GET /api/collaboration/files/:fileId/versions/:version
  it('GET /files/:fileId/versions/1 — returns specific version', async () => {
    const res = await request(app).get(`/api/collaboration/files/${fileId}/versions/1`);
    expect(res.status).toBe(200);
    expect(res.body.version).toBe(1);
  });

  it('GET /files/:fileId/versions/999 — returns 404 for nonexistent version', async () => {
    const res = await request(app).get(`/api/collaboration/files/${fileId}/versions/999`);
    expect(res.status).toBe(404);
  });

  // DELETE /api/collaboration/files/:fileId
  it('DELETE /files/:fileId — deletes a file', async () => {
    const res = await request(app).delete(`/api/collaboration/files/${fileId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /files/:fileId — returns 404 for already deleted', async () => {
    const res = await request(app).delete(`/api/collaboration/files/${fileId}`);
    expect(res.status).toBe(404);
  });
});
