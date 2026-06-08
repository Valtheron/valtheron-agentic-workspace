// Rate Limiter Middleware — Phase 4 Security
// Simple in-memory sliding-window rate limiter.

import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 120_000);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 60_000);

/**
 * Create a rate-limiting middleware.
 * @param windowSec   Time window in seconds
 * @param maxRequests Maximum requests allowed in the window
 * @param keyScope    Optional bucket name. Two limiters mounted on the same
 *                    baseUrl (broad `/api/auth` 20/min vs. strict
 *                    `/api/auth/login` 5/15min) would otherwise share a bucket
 *                    keyed only by IP+baseUrl. Pass a unique scope to isolate.
 */
export function rateLimiter(windowSec: number, maxRequests: number, keyScope?: string) {
  const windowMs = windowSec * 1000;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip rate limiting in test mode
    if (process.env.NODE_ENV === 'test') {
      next();
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const bucket = keyScope ?? req.baseUrl;
    const key = `${ip}:${bucket}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(key, entry);
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

    if (entry.timestamps.length >= maxRequests) {
      const retryAfter = Math.ceil((entry.timestamps[0]! + windowMs - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfterSeconds: retryAfter,
      });
      return;
    }

    entry.timestamps.push(now);
    next();
  };
}
