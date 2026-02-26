// MFA Routes — Phase 4 Security
import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema.js';
import { generateMFASetup, validateTOTP, hashBackupCode, matchBackupCode } from '../services/mfa.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/mfa/setup — Begin MFA enrollment (requires authenticated user)
router.post('/setup', async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT mfaSecret FROM users WHERE id = ?').get(req.user.userId) as
    | { mfaSecret: string | null }
    | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.mfaSecret) {
    res.status(409).json({ error: 'MFA is already enabled. Disable it first to re-enroll.' });
    return;
  }

  const setup = await generateMFASetup(req.user.username);

  // Store the secret temporarily (not yet confirmed)
  db.prepare('UPDATE users SET mfaPendingSecret = ?, mfaBackupCodes = ? WHERE id = ?').run(
    setup.secret,
    JSON.stringify(setup.backupCodes.map(hashBackupCode)),
    req.user.userId,
  );

  res.json({
    secret: setup.secret,
    uri: setup.uri,
    qrDataUrl: setup.qrDataUrl,
    backupCodes: setup.backupCodes,
    message: 'Scan the QR code with your authenticator app, then confirm with /api/auth/mfa/confirm',
  });
});

// POST /api/auth/mfa/confirm — Confirm MFA enrollment by verifying a TOTP code
router.post('/confirm', (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: 'TOTP code is required' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT mfaPendingSecret FROM users WHERE id = ?').get(req.user.userId) as
    | { mfaPendingSecret: string | null }
    | undefined;

  if (!user?.mfaPendingSecret) {
    res.status(400).json({ error: 'No pending MFA setup. Call /api/auth/mfa/setup first.' });
    return;
  }

  if (!validateTOTP(user.mfaPendingSecret, code)) {
    res.status(400).json({ error: 'Invalid TOTP code. Please try again.' });
    return;
  }

  // Activate MFA
  db.prepare('UPDATE users SET mfaSecret = mfaPendingSecret, mfaPendingSecret = NULL, mfaEnabled = 1 WHERE id = ?').run(
    req.user.userId,
  );

  res.json({ success: true, message: 'MFA has been enabled successfully.' });
});

// POST /api/auth/mfa/verify — Verify TOTP during login (second factor)
router.post('/verify', (req: Request, res: Response) => {
  const { userId, code, backupCode } = req.body;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  if (!code && !backupCode) {
    res.status(400).json({ error: 'Either code or backupCode is required' });
    return;
  }

  const db = getDb();
  const user = db
    .prepare('SELECT id, username, role, mfaSecret, mfaBackupCodes FROM users WHERE id = ?')
    .get(userId) as
    | { id: string; username: string; role: string; mfaSecret: string; mfaBackupCodes: string }
    | undefined;

  if (!user?.mfaSecret) {
    res.status(400).json({ error: 'MFA is not enabled for this user' });
    return;
  }

  let verified = false;

  if (code) {
    verified = validateTOTP(user.mfaSecret, code);
  } else if (backupCode) {
    const hashedCodes: string[] = JSON.parse(user.mfaBackupCodes || '[]');
    const idx = matchBackupCode(backupCode, hashedCodes);
    if (idx >= 0) {
      // Remove the used backup code
      hashedCodes.splice(idx, 1);
      db.prepare('UPDATE users SET mfaBackupCodes = ? WHERE id = ?').run(JSON.stringify(hashedCodes), userId);
      verified = true;
    }
  }

  if (!verified) {
    res.status(401).json({ error: 'Invalid MFA code' });
    return;
  }

  // Issue full JWT token after successful 2FA
  const token = generateToken({ userId: user.id, username: user.username, role: user.role });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// POST /api/auth/mfa/disable — Disable MFA for the current user
router.post('/disable', (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: 'Current TOTP code is required to disable MFA' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT mfaSecret FROM users WHERE id = ?').get(req.user.userId) as
    | { mfaSecret: string | null }
    | undefined;

  if (!user?.mfaSecret) {
    res.status(400).json({ error: 'MFA is not enabled' });
    return;
  }

  if (!validateTOTP(user.mfaSecret, code)) {
    res.status(401).json({ error: 'Invalid TOTP code' });
    return;
  }

  db.prepare(
    'UPDATE users SET mfaSecret = NULL, mfaPendingSecret = NULL, mfaBackupCodes = NULL, mfaEnabled = 0 WHERE id = ?',
  ).run(req.user.userId);

  res.json({ success: true, message: 'MFA has been disabled.' });
});

// GET /api/auth/mfa/status — Check MFA status for current user
router.get('/status', (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT mfaEnabled FROM users WHERE id = ?').get(req.user.userId) as
    | { mfaEnabled: number }
    | undefined;

  res.json({ mfaEnabled: !!user?.mfaEnabled });
});

export default router;
