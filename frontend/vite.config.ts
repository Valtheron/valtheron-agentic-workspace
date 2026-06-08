import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Only prefix assets with the GitHub-Pages subpath for production builds.
  // Dev server uses `/` so `http://localhost:3055/` works without redirects.
  base: command === 'build' ? '/valtheron-agentic-workspace/' : '/',
  server: {
    port: 3055,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.tsx', 'src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/__tests__/**', 'src/main.tsx', 'src/vite-env.d.ts'],
      thresholds: {
        lines: 17,
        functions: 17,
        branches: 17,
        statements: 17,
      },
    },
  },
}))
