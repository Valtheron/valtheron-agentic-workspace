// Secrets Management Routes — Phase 4 Security
import { Router, Request, Response } from 'express';
import { setSecret, getSecret, rotateSecret, listSecrets, deleteSecret, generateKey } from '../services/encryption.js';

const router = Router();

// GET /api/secrets — List all secrets (names only, no values)
router.get('/', (_req: Request, res: Response) => {
  res.json({ secrets: listSecrets() });
});

// POST /api/secrets — Store a new secret
router.post('/', (req: Request, res: Response) => {
  const { name, value } = req.body;
  if (!name || !value) {
    res.status(400).json({ error: 'name and value are required' });
    return;
  }

  const entry = setSecret(name, value);
  res.json({ success: true, name: entry.name, createdAt: entry.createdAt });
});

// GET /api/secrets/:name — Retrieve a secret value
router.get('/:name', (req: Request, res: Response) => {
  const name = String(req.params.name);
  const value = getSecret(name);
  if (value === null) {
    res.status(404).json({ error: 'Secret not found' });
    return;
  }
  res.json({ name, value });
});

// PUT /api/secrets/:name — Rotate a secret's value
router.put('/:name', (req: Request, res: Response) => {
  const name = String(req.params.name);
  const { value } = req.body;
  if (!value) {
    res.status(400).json({ error: 'New value is required' });
    return;
  }

  const entry = rotateSecret(name, value);
  if (!entry) {
    res.status(404).json({ error: 'Secret not found' });
    return;
  }
  res.json({ success: true, name: entry.name, rotatedAt: entry.rotatedAt });
});

// DELETE /api/secrets/:name — Delete a secret
router.delete('/:name', (req: Request, res: Response) => {
  const name = String(req.params.name);
  const deleted = deleteSecret(name);
  if (!deleted) {
    res.status(404).json({ error: 'Secret not found' });
    return;
  }
  res.json({ success: true });
});

// POST /api/secrets/generate-key — Generate a new random encryption key
router.post('/generate-key', (_req: Request, res: Response) => {
  res.json({ key: generateKey() });
});

export default router;
