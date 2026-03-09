import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/schema.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as
    | { id: string; username: string; passwordHash: string; role: string }
    | undefined;

  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // Check if MFA is enabled — require second factor
  const mfaRow = db.prepare('SELECT mfaEnabled FROM users WHERE id = ?').get(user.id) as
    | { mfaEnabled?: number }
    | undefined;
  if (mfaRow?.mfaEnabled) {
    res.json({
      mfaRequired: true,
      userId: user.id,
      message: 'MFA verification required. Call POST /api/auth/mfa/verify with userId and code.',
    });
    return;
  }

  const token = generateToken({ userId: user.id, username: user.username, role: user.role });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  const { username, password, role = 'operator' } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(409).json({ error: 'Username already exists' });
    return;
  }

  // First user ever becomes admin, regardless of requested role
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  const assignedRole = userCount === 0 ? 'admin' : role;

  const id = uuid();
  db.prepare('INSERT INTO users (id, username, passwordHash, role) VALUES (?, ?, ?, ?)').run(
    id,
    username,
    hashPassword(password),
    assignedRole,
  );

  const token = generateToken({ userId: id, username, role: assignedRole });
  res.json({ token, user: { id, username, role: assignedRole } });
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user: req.user });
});

// POST /api/auth/logout  (stateless JWT — just acknowledge; client drops the token)
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// POST /api/auth/refresh  (issue a fresh 24h token from the current one)
router.post('/refresh', (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { userId, username, role } = req.user;
  const token = generateToken({ userId, username, role });
  res.json({ token });
});

export default router;
