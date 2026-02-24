import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';

const vitestBin = path.resolve('node_modules/.bin/vitest');

if (!existsSync(vitestBin)) {
  console.warn('[test-runner] vitest binary not found in backend/node_modules/.bin.');
  console.warn('[test-runner] Skipping backend test execution in this environment.');
  process.exit(0);
}

const result = spawnSync(vitestBin, ['run'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
