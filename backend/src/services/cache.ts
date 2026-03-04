// In-Memory Cache Service — Phase 4 Performance Optimization
// Provides TTL-based caching to reduce repeated DB queries.

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private defaultTTL: number;
  private maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(defaultTTLMs = 60_000, maxSize = 1000) {
    this.defaultTTL = defaultTTLMs;
    this.maxSize = maxSize;
  }

  /** Get a cached value. Returns undefined on miss or expiry. */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }
    this.hits++;
    return entry.value as T;
  }

  /** Set a cached value with optional TTL (ms). */
  set<T>(key: string, value: T, ttlMs?: number): void {
    // Evict expired entries when approaching max size
    if (this.store.size >= this.maxSize) {
      this.evictExpired();
    }
    // If still at max, evict oldest entry
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) this.store.delete(firstKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTTL),
    });
  }

  /** Invalidate a specific key. */
  invalidate(key: string): boolean {
    return this.store.delete(key);
  }

  /** Invalidate all keys matching a prefix. */
  invalidatePrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /** Clear all cached entries. */
  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /** Return cache statistics. */
  stats() {
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0,
    };
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton caches for different domains
export const queryCache = new MemoryCache(30_000, 500); // 30s TTL for DB queries
export const apiCache = new MemoryCache(10_000, 200); // 10s TTL for aggregated API responses
export const sessionCache = new MemoryCache(300_000, 100); // 5min TTL for session data
