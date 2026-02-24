import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queryCache } from '../services/cache.js';

describe('MemoryCache', () => {
  beforeEach(() => {
    queryCache.clear();
  });

  it('should set and get a value', () => {
    queryCache.set('key1', { name: 'test' });
    expect(queryCache.get('key1')).toEqual({ name: 'test' });
  });

  it('should return undefined for missing key', () => {
    expect(queryCache.get('nonexistent')).toBeUndefined();
  });

  it('should expire entries after TTL', () => {
    vi.useFakeTimers();
    queryCache.set('expire-test', 'value', 100);
    expect(queryCache.get('expire-test')).toBe('value');

    vi.advanceTimersByTime(150);
    expect(queryCache.get('expire-test')).toBeUndefined();
    vi.useRealTimers();
  });

  it('should invalidate a specific key', () => {
    queryCache.set('del-key', 'data');
    expect(queryCache.invalidate('del-key')).toBe(true);
    expect(queryCache.get('del-key')).toBeUndefined();
  });

  it('should invalidate keys by prefix', () => {
    queryCache.set('agents:list', [1, 2, 3]);
    queryCache.set('agents:detail:1', { id: 1 });
    queryCache.set('tasks:list', [4, 5, 6]);

    const count = queryCache.invalidatePrefix('agents:');
    expect(count).toBe(2);
    expect(queryCache.get('agents:list')).toBeUndefined();
    expect(queryCache.get('tasks:list')).toEqual([4, 5, 6]);
  });

  it('should track cache statistics', () => {
    queryCache.set('stat-key', 'val');
    queryCache.get('stat-key'); // hit
    queryCache.get('missing'); // miss

    const stats = queryCache.stats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(0.5);
    expect(stats.size).toBe(1);
  });

  it('should clear all entries', () => {
    queryCache.set('a', 1);
    queryCache.set('b', 2);
    queryCache.clear();
    expect(queryCache.stats().size).toBe(0);
  });
});
