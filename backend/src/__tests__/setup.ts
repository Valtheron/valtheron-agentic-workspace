import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll } from 'vitest';
import { initDatabase } from '../app.js';
import { closeDb } from '../db/schema.js';

let testDbDir = '';

beforeAll(() => {
  testDbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'valtheron-test-db-'));
  process.env.VALTHERON_DB_PATH = path.join(testDbDir, 'valtheron.test.db');
  initDatabase();
});

afterAll(() => {
  closeDb();
  delete process.env.VALTHERON_DB_PATH;
  fs.rmSync(testDbDir, { recursive: true, force: true });
});
