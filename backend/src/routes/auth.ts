import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/schema.js';
import { generateToken } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Strict per-endpoint limiter for /login: 5 attempts per 15 min per IP. Layered
// on top of the broader /api/auth limiter (20 req/min) in app.ts. This is the
// gate that blocks online brute-force against weak passwords; OWASP ASVS 2.2.1.
const loginRateLimiter = rateLimiter(15 * 60, 5, 'auth:login');

// bcrypt cost factor — 12 rounds is the 2024+ baseline (~250 ms on modern
// hardware, exponentially harder for attackers). Test runs use a lower cost
// so the suite stays interactive; security-pentest.test.ts in particular
// fires 30 parallel hash operations.
const BCRYPT_ROUNDS = process.env.NODE_ENV === 'test' ? 4 : 12;

/** Hash a fresh password with bcrypt. */
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

/**
 * Verify a candidate password against a stored hash. Supports two formats so
 * users seeded under the old SHA-256-without-salt scheme keep working until
 * their next login, at which point we transparently upgrade them.
 *
 * Returns { ok, needsRehash }:
 *   - ok: whether the password is correct
 *   - needsRehash: true when the stored hash uses the legacy SHA-256 scheme
 *     and should be replaced with a bcrypt hash on success.
 */
function verifyPassword(password: string, storedHash: string): { ok: boolean; needsRehash: boolean } {
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    return { ok: bcrypt.compareSync(password, storedHash), needsRehash: false };
  }
  // Legacy SHA-256 hex format — compute the old hash and compare in constant time.
  const legacy = crypto.createHash('sha256').update(password).digest('hex');
  let ok: boolean;
  try {
    ok = legacy.length === storedHash.length && crypto.timingSafeEqual(Buffer.from(legacy), Buffer.from(storedHash));
  } catch {
    ok = false;
  }
  return { ok, needsRehash: ok };
}

// POST /api/auth/login
router.post('/login', loginRateLimiter, (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as
    | { id: string; username: string; passwordHash: string; role: string }
    | undefined;

  // Avoid user-enumeration via timing: always run the bcrypt cost path even
  // when the user is missing.
  const reference = user?.passwordHash ?? '$2b$12$KIXxqg1g1xRT5DnFRgkAVeqK3Y9MJfRyq6OJB2.cqDgaXM7lYf6ZK';
  const { ok, needsRehash } = verifyPassword(password, reference);

  if (!user || !ok) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // Transparent upgrade: rewrite legacy SHA-256 hashes with a fresh bcrypt
  // hash on successful login. Single statement, no migration script needed.
  if (needsRehash) {
    db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(hashPassword(password), user.id);
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
