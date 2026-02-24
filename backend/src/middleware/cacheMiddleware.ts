// Cache Middleware — Phase 4 Performance Optimization
// Caches GET responses in-memory for configurable TTL.

import { Request, Response, NextFunction } from 'express';
import { apiCache } from '../services/cache.js';

/**
 * Express middleware that caches JSON responses for GET requests.
 * @param ttlMs Cache TTL in milliseconds (default 15s)
 * @param keyPrefix Optional prefix for cache keys
 */
export function cacheResponse(ttlMs = 15_000, keyPrefix = 'api') {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    const cacheKey = `${keyPrefix}:${req.originalUrl}`;
    const cached = apiCache.get<{ body: unknown; status: number }>(cacheKey);

    if (cached) {
      res.set('X-Cache', 'HIT');
      res.status(cached.status).json(cached.body);
      return;
    }

    // Intercept res.json to capture the response for caching
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        apiCache.set(cacheKey, { body, status: res.statusCode }, ttlMs);
      }
      res.set('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}
