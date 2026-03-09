// Backup / Disaster Recovery Routes — Phase 4
import { Router, Request, Response } from 'express';
import { createBackup, listBackups, rotateBackups, restoreFromBackup } from '../services/backup.js';

const router = Router();

// GET /api/backup — List available backups
router.get('/', (_req: Request, res: Response) => {
  const backups = listBackups();
  res.json({ backups, count: backups.length });
});

// POST /api/backup — Create a new backup
router.post('/', (_req: Request, res: Response) => {
  try {
    const result = createBackup();
    rotateBackups();
    res.json({ success: true, backup: result });
  } catch (err) {
    res.status(500).json({ error: 'Backup failed', details: String(err) });
  }
});

// POST /api/backup/restore — Restore from a backup (requires filename in body)
router.post('/restore', (req: Request, res: Response) => {
  const { filename } = req.body;
  if (!filename) {
    res.status(400).json({ error: 'filename is required' });
    return;
  }

  const backups = listBackups();
  const target = backups.find((b) => b.filename === filename);
  if (!target) {
    res.status(404).json({ error: 'Backup not found' });
    return;
  }

  try {
    restoreFromBackup(target.path);
    res.json({ success: true, restoredFrom: filename });
  } catch (err) {
    res.status(500).json({ error: 'Restore failed', details: String(err) });
  }
});

export default router;
