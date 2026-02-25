import { describe, it, expect, vi } from 'vitest';
import { rateLimiter } from '../middleware/rateLimiter.js';
import type { Request, Response, NextFunction } from 'express';

function mockReqRes(ip = '127.0.0.1', baseUrl = '/api/auth') {
  const req = {
    ip,
    baseUrl,
    socket: { remoteAddress: ip },
  } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    set: vi.fn(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('Rate Limiter Middleware', () => {
  it('skips rate limiting in test mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const limiter = rateLimiter(1, 1);
    const { req, res, next } = mockReqRes();
    limiter(req, res, next);
    expect(next).toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  it('allows requests within the limit', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const limiter = rateLimiter(60, 5);
    for (let i = 0; i < 5; i++) {
      const { req, res, next } = mockReqRes(`10.0.0.${i}`);
      limiter(req, res, next);
      expect(next).toHaveBeenCalled();
    }

    process.env.NODE_ENV = originalEnv;
  });

  it('blocks requests exceeding the limit', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const limiter = rateLimiter(60, 2);
    const ip = '192.168.99.99';

    // First 2 requests should pass
    for (let i = 0; i < 2; i++) {
      const { req, res, next } = mockReqRes(ip, '/api/test-rate');
      limiter(req, res, next);
      expect(next).toHaveBeenCalled();
    }

    // 3rd request should be rate-limited
    const { req, res, next } = mockReqRes(ip, '/api/test-rate');
    limiter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(next).not.toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });
});
