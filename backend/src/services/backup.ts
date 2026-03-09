// Disaster Recovery — Backup Service — Phase 4
// Provides automated SQLite database backups with rotation.

import fs from 'fs';
import path from 'path';
import { getDb, closeDb } from '../db/schema.js';

const DEFAULT_BACKUP_DIR = path.resolve(process.cwd(), 'data/backups');
const MAX_BACKUPS = 10; // Keep the last 10 backups

export interface BackupResult {
  filename: string;
  path: string;
  sizeBytes: number;
  createdAt: string;
}

/** Ensure the backup directory exists. */
function ensureBackupDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Create a full backup of the SQLite database by copying the DB file. */
export function createBackup(backupDir?: string): BackupResult {
  const dir = backupDir ?? DEFAULT_BACKUP_DIR;
  ensureBackupDir(dir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `valtheron-backup-${timestamp}.db`;
  const backupPath = path.join(dir, filename);

  const db = getDb();
  // Checkpoint WAL to ensure the main DB file is up to date
  db.pragma('wal_checkpoint(TRUNCATE)');

  const mainDbPath = (db as unknown as { name: string }).name;
  fs.copyFileSync(mainDbPath, backupPath);

  const stat = fs.statSync(backupPath);
  return {
    filename,
    path: backupPath,
    sizeBytes: stat.size,
    createdAt: new Date().toISOString(),
  };
}

/** List existing backups sorted newest-first. */
export function listBackups(backupDir?: string): BackupResult[] {
  const dir = backupDir ?? DEFAULT_BACKUP_DIR;
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('valtheron-backup-') && f.endsWith('.db'))
    .map((filename) => {
      const filePath = path.join(dir, filename);
      const stat = fs.statSync(filePath);
      return {
        filename,
        path: filePath,
        sizeBytes: stat.size,
        createdAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Rotate backups: keep only the latest `maxBackups` files. */
export function rotateBackups(maxBackups = MAX_BACKUPS, backupDir?: string): number {
  const backups = listBackups(backupDir);
  let deleted = 0;
  if (backups.length > maxBackups) {
    const toDelete = backups.slice(maxBackups);
    for (const backup of toDelete) {
      try {
        fs.unlinkSync(backup.path);
        deleted++;
      } catch {
        // Ignore deletion errors
      }
    }
  }
  return deleted;
}

/** Restore the database from a backup file. Returns true on success. */
export function restoreFromBackup(backupPath: string): boolean {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  const db = getDb();
  const mainDbPath = (db as unknown as { name: string }).name;

  // Close existing connection and reset singleton so next getDb() opens the restored DB
  closeDb();
  fs.copyFileSync(backupPath, mainDbPath);
  return true;
}

// ---- Scheduled Backup Timer ----

let backupInterval: ReturnType<typeof setInterval> | null = null;

/** Start automated backups at a given interval (default: every 6 hours). */
export function startScheduledBackups(intervalMs = 6 * 60 * 60 * 1000): void {
  if (backupInterval) return; // Already running

  // Perform initial backup
  try {
    createBackup();
    rotateBackups();
    console.log('[Backup] Initial backup created');
  } catch (err) {
    console.error('[Backup] Initial backup failed:', err);
  }

  backupInterval = setInterval(() => {
    try {
      const result = createBackup();
      rotateBackups();
      console.log(`[Backup] Scheduled backup created: ${result.filename} (${result.sizeBytes} bytes)`);
    } catch (err) {
      console.error('[Backup] Scheduled backup failed:', err);
    }
  }, intervalMs);
}

/** Stop automated backups. */
export function stopScheduledBackups(): void {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
  }
}
