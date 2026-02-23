import { beforeAll } from 'vitest';
import { initDatabase } from '../app.js';

beforeAll(() => {
  initDatabase();
});
