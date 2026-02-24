import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll } from 'vitest';

const testDbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'valtheron-test-'));
const testDbPath = path.join(testDbDir, 'test.db');

let closeDb: (() => void) | undefined;

beforeAll(async () => {
  process.env.VALTHERON_DB_PATH = testDbPath;

  const [{ initDatabase }, schemaModule] = await Promise.all([
    import('../app.js'),
    import('../db/schema.js'),
  ]);

  closeDb = schemaModule.closeDb;
  initDatabase();
});

afterAll(() => {
  closeDb?.();
  fs.rmSync(testDbDir, { recursive: true, force: true });
  delete process.env.VALTHERON_DB_PATH;
});
