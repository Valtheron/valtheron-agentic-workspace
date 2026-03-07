import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/__tests__/**',
        'src/db/schema.ts',
        'src/db/seed.ts',
        'src/server.ts',
        'src/services/websocket.ts',          // WebSocket server — requires integration setup
        'src/services/killSwitchMonitor.ts',  // Timer-based monitor — integration only
      ],
      thresholds: {
        lines: 85,
        functions: 80,
        branches: 65,
        statements: 85,
      },
    },
  },
});
