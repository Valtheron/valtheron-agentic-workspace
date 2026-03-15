import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp, initDatabase } from '../app.js';
import { getDb } from '../db/schema.js';
import { recordMetricsSnapshot, startMetricsRecorder, stopMetricsRecorder } from '../services/metricsRecorder.js';

vi.mock('../services/websocket.js', () => ({
  broadcast: vi.fn(),
}));

describe('metricsRecorder', () => {
  beforeEach(() => {
    createApp();
    initDatabase();
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopMetricsRecorder();
  });

  // ── recordMetricsSnapshot ─────────────────────────────────────────

  describe('recordMetricsSnapshot', () => {
    it('inserts a new row into metrics_history', () => {
      const db = getDb();
      const before = (db.prepare('SELECT COUNT(*) as c FROM metrics_history').get() as { c: number }).c;

      recordMetricsSnapshot();

      const after = (db.prepare('SELECT COUNT(*) as c FROM metrics_history').get() as { c: number }).c;
      expect(after).toBe(before + 1);
    });

    it('snapshot contains expected numeric fields', () => {
      const db = getDb();
      recordMetricsSnapshot();

      const row = db
        .prepare('SELECT * FROM metrics_history ORDER BY timestamp DESC LIMIT 1')
        .get() as Record<string, unknown>;

      expect(row).toBeTruthy();
      expect(typeof row.activeAgents).toBe('number');
      expect(typeof row.totalTasks).toBe('number');
      expect(typeof row.completedToday).toBe('number');
      expect(typeof row.errorRate).toBe('number');
      expect(typeof row.avgResponseTime).toBe('number');
      expect(typeof row.throughput).toBe('number');
      expect(typeof row.successRate).toBe('number');
    });

    it('snapshot has a valid ISO timestamp', () => {
      const db = getDb();
      recordMetricsSnapshot();

      const row = db
        .prepare('SELECT timestamp FROM metrics_history ORDER BY timestamp DESC LIMIT 1')
        .get() as { timestamp: string };

      expect(row.timestamp).toBeTruthy();
      expect(new Date(row.timestamp).toISOString()).toBeTruthy();
    });

    it('errorRate is >= 0', () => {
      const db = getDb();
      recordMetricsSnapshot();

      const row = db
        .prepare('SELECT errorRate FROM metrics_history ORDER BY timestamp DESC LIMIT 1')
        .get() as { errorRate: number };

      expect(row.errorRate).toBeGreaterThanOrEqual(0);
    });

    it('broadcasts metric_change event to analytics channel', async () => {
      const { broadcast } = await import('../services/websocket.js');
      recordMetricsSnapshot();

      expect(broadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'metric_change',
          payload: expect.objectContaining({
            activeAgents: expect.any(Number),
            totalTasks: expect.any(Number),
            errorRate: expect.any(Number),
          }),
        }),
        'analytics',
      );
    });

    it('can be called multiple times without error', () => {
      expect(() => {
        recordMetricsSnapshot();
        recordMetricsSnapshot();
        recordMetricsSnapshot();
      }).not.toThrow();
    });
  });

  // ── startMetricsRecorder / stopMetricsRecorder ────────────────────

  describe('startMetricsRecorder', () => {
    it('starts without throwing', () => {
      expect(() => startMetricsRecorder()).not.toThrow();
    });

    it('records a snapshot after initial delay using fake timers', async () => {
      vi.useFakeTimers();
      const db = getDb();
      const before = (db.prepare('SELECT COUNT(*) as c FROM metrics_history').get() as { c: number }).c;

      startMetricsRecorder();

      // Advance past the 3-second initial delay
      await vi.advanceTimersByTimeAsync(3100);

      const after = (db.prepare('SELECT COUNT(*) as c FROM metrics_history').get() as { c: number }).c;
      expect(after).toBeGreaterThan(before);

      stopMetricsRecorder();
      vi.useRealTimers();
    });
  });

  describe('stopMetricsRecorder', () => {
    it('stops without throwing even if not started', () => {
      expect(() => stopMetricsRecorder()).not.toThrow();
    });

    it('can be called multiple times safely', () => {
      expect(() => {
        stopMetricsRecorder();
        stopMetricsRecorder();
        stopMetricsRecorder();
      }).not.toThrow();
    });

    it('stops after start without error', () => {
      expect(() => {
        startMetricsRecorder();
        stopMetricsRecorder();
      }).not.toThrow();
    });
  });
});
