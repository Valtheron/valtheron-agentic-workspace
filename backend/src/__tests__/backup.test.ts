import { describe, it, expect, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createBackup, listBackups, rotateBackups } from '../services/backup.js';

const TEST_BACKUP_DIR = path.join(os.tmpdir(), `valtheron-test-backup-${Date.now()}`);

describe('Backup Service', () => {
  afterAll(() => {
    if (fs.existsSync(TEST_BACKUP_DIR)) {
      fs.rmSync(TEST_BACKUP_DIR, { recursive: true });
    }
  });

  it('should create a backup', () => {
    const result = createBackup(TEST_BACKUP_DIR);
    expect(result.filename).toMatch(/^valtheron-backup-.*\.db$/);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(fs.existsSync(result.path)).toBe(true);
  });

  it('should list backups', () => {
    const backups = listBackups(TEST_BACKUP_DIR);
    expect(backups.length).toBeGreaterThanOrEqual(1);
    expect(backups[0].filename).toMatch(/^valtheron-backup-/);
  });

  it('should rotate backups (keep max)', () => {
    // Create a few more backups
    createBackup(TEST_BACKUP_DIR);
    createBackup(TEST_BACKUP_DIR);

    const before = listBackups(TEST_BACKUP_DIR).length;
    expect(before).toBeGreaterThanOrEqual(3);

    // Rotate to keep only 2
    const deleted = rotateBackups(2, TEST_BACKUP_DIR);
    expect(deleted).toBe(before - 2);

    const after = listBackups(TEST_BACKUP_DIR).length;
    expect(after).toBe(2);
  });

  it('should return empty list for nonexistent dir', () => {
    const backups = listBackups('/tmp/nonexistent-backup-dir-xyz');
    expect(backups).toEqual([]);
  });
});
