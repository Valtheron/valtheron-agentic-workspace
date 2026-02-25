import { describe, it, expect, vi } from 'vitest';
import { requireRole, adminOnly } from '../middleware/rbac.js';
import type { Request, Response, NextFunction } from 'express';

function mockReqRes(user?: { userId: string; username: string; role: string }) {
  const req = { user } as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('RBAC Middleware', () => {
  it('requireRole allows matching role', () => {
    const { req, res, next } = mockReqRes({ userId: '1', username: 'admin', role: 'admin' });
    requireRole('admin')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('requireRole allows any of multiple roles', () => {
    const { req, res, next } = mockReqRes({ userId: '1', username: 'op', role: 'operator' });
    requireRole('admin', 'operator')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('requireRole rejects non-matching role', () => {
    const { req, res, next } = mockReqRes({ userId: '1', username: 'viewer', role: 'viewer' });
    requireRole('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('requireRole rejects unauthenticated user', () => {
    const { req, res, next } = mockReqRes(undefined);
    requireRole('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('adminOnly is a requireRole("admin") guard', () => {
    const { req, res, next } = mockReqRes({ userId: '1', username: 'admin', role: 'admin' });
    adminOnly(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('adminOnly rejects operator', () => {
    const { req, res, next } = mockReqRes({ userId: '1', username: 'op', role: 'operator' });
    adminOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
