import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';
import { broadcast } from '../services/websocket.js';

const router = Router();

// GET /api/collaboration/sessions/:id/files — list files for a session
router.get('/sessions/:id/files', (req, res) => {
  const db = getDb();
  const files = db.prepare(
    'SELECT id, sessionId, filename, mimeType, size, version, uploadedBy, createdAt, updatedAt FROM shared_files WHERE sessionId = ? ORDER BY updatedAt DESC'
  ).all(req.params.id);
  res.json({ files });
});

// POST /api/collaboration/sessions/:id/files — upload a file
router.post('/sessions/:id/files', (req, res) => {
  const db = getDb();
  const { filename, content, mimeType } = req.body;
  if (!filename || content === undefined) {
    return res.status(400).json({ error: 'filename and content are required' });
  }

  const id = uuid();
  const now = new Date().toISOString();
  const uploadedBy = req.user?.username || 'system';
  const size = Buffer.byteLength(content, 'utf8');

  db.prepare(
    'INSERT INTO shared_files (id, sessionId, filename, content, mimeType, size, version, uploadedBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)'
  ).run(id, req.params.id, filename, content, mimeType || 'text/plain', size, uploadedBy, now, now);

  // Save initial version
  db.prepare(
    'INSERT INTO file_versions (id, fileId, version, content, size, editedBy, changeDescription, createdAt) VALUES (?, ?, 1, ?, ?, ?, ?, ?)'
  ).run(uuid(), id, content, size, uploadedBy, 'Initial upload', now);

  // Update session sharedFiles list
  const session = db.prepare('SELECT sharedFiles FROM collaboration_sessions WHERE id = ?').get(req.params.id) as { sharedFiles: string } | undefined;
  if (session) {
    const files = JSON.parse(session.sharedFiles || '[]');
    files.push(filename);
    db.prepare('UPDATE collaboration_sessions SET sharedFiles = ?, updatedAt = ? WHERE id = ?').run(JSON.stringify(files), now, req.params.id);
  }

  broadcast({
    type: 'collaboration_message',
    payload: { sessionId: req.params.id, fileEvent: 'uploaded', filename, fileId: id },
    timestamp: now,
  }, 'collaboration');

  const file = db.prepare('SELECT id, sessionId, filename, mimeType, size, version, uploadedBy, createdAt, updatedAt FROM shared_files WHERE id = ?').get(id);
  res.status(201).json(file);
});

// GET /api/collaboration/files/:fileId — download file content
router.get('/files/:fileId', (req, res) => {
  const db = getDb();
  const file = db.prepare('SELECT * FROM shared_files WHERE id = ?').get(req.params.fileId) as Record<string, unknown> | undefined;
  if (!file) return res.status(404).json({ error: 'File not found' });
  res.json(file);
});

// PUT /api/collaboration/files/:fileId — update file content (creates new version)
router.put('/files/:fileId', (req, res) => {
  const db = getDb();
  const { content, changeDescription } = req.body;
  if (content === undefined) return res.status(400).json({ error: 'content is required' });

  const file = db.prepare('SELECT * FROM shared_files WHERE id = ?').get(req.params.fileId) as Record<string, unknown> | undefined;
  if (!file) return res.status(404).json({ error: 'File not found' });

  const now = new Date().toISOString();
  const editedBy = req.user?.username || 'system';
  const newVersion = (file.version as number) + 1;
  const size = Buffer.byteLength(content, 'utf8');

  // Save new version
  db.prepare(
    'INSERT INTO file_versions (id, fileId, version, content, size, editedBy, changeDescription, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(uuid(), req.params.fileId, newVersion, content, size, editedBy, changeDescription || '', now);

  // Update current file
  db.prepare(
    'UPDATE shared_files SET content = ?, size = ?, version = ?, updatedAt = ? WHERE id = ?'
  ).run(content, size, newVersion, now, req.params.fileId);

  broadcast({
    type: 'collaboration_message',
    payload: { sessionId: file.sessionId, fileEvent: 'updated', filename: file.filename, fileId: req.params.fileId, version: newVersion },
    timestamp: now,
  }, 'collaboration');

  const updated = db.prepare('SELECT id, sessionId, filename, mimeType, size, version, uploadedBy, createdAt, updatedAt FROM shared_files WHERE id = ?').get(req.params.fileId);
  res.json(updated);
});

// GET /api/collaboration/files/:fileId/versions — list all versions
router.get('/files/:fileId/versions', (req, res) => {
  const db = getDb();
  const versions = db.prepare(
    'SELECT id, fileId, version, size, editedBy, changeDescription, createdAt FROM file_versions WHERE fileId = ? ORDER BY version DESC'
  ).all(req.params.fileId);
  res.json({ versions });
});

// GET /api/collaboration/files/:fileId/versions/:version — get specific version content
router.get('/files/:fileId/versions/:version', (req, res) => {
  const db = getDb();
  const version = db.prepare(
    'SELECT * FROM file_versions WHERE fileId = ? AND version = ?'
  ).get(req.params.fileId, Number(req.params.version));
  if (!version) return res.status(404).json({ error: 'Version not found' });
  res.json(version);
});

// DELETE /api/collaboration/files/:fileId
router.delete('/files/:fileId', (req, res) => {
  const db = getDb();
  const file = db.prepare('SELECT sessionId, filename FROM shared_files WHERE id = ?').get(req.params.fileId) as { sessionId: string; filename: string } | undefined;
  if (!file) return res.status(404).json({ error: 'File not found' });

  db.prepare('DELETE FROM file_versions WHERE fileId = ?').run(req.params.fileId);
  db.prepare('DELETE FROM shared_files WHERE id = ?').run(req.params.fileId);

  // Update session sharedFiles list
  const session = db.prepare('SELECT sharedFiles FROM collaboration_sessions WHERE id = ?').get(file.sessionId) as { sharedFiles: string } | undefined;
  if (session) {
    const files = JSON.parse(session.sharedFiles || '[]').filter((f: string) => f !== file.filename);
    db.prepare('UPDATE collaboration_sessions SET sharedFiles = ? WHERE id = ?').run(JSON.stringify(files), file.sessionId);
  }

  res.json({ success: true });
});

export default router;
