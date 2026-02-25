import { describe, it, expect, vi } from 'vitest';
import { AppError, errorHandler } from '../middleware/errorHandler.js';
import type { Request, Response, NextFunction } from 'express';

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('Error Handler Middleware', () => {
  const req = {} as Request;
  const next = vi.fn() as NextFunction;

  it('handles AppError with correct status code', () => {
    const res = mockRes();
    const err = new AppError(422, 'Validation failed');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ error: 'Validation failed' });
  });

  it('handles SyntaxError as 400 JSON parse error', () => {
    const res = mockRes();
    const err = new SyntaxError('Unexpected token');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid JSON in request body' });
  });

  it('handles entity.parse.failed error', () => {
    const res = mockRes();
    const err = new Error('parse failed') as Error & { type: string };
    err.type = 'entity.parse.failed';
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles unknown errors as 500', () => {
    const res = mockRes();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('Something went wrong');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    consoleSpy.mockRestore();
  });

  it('AppError has correct properties', () => {
    const err = new AppError(404, 'Not found');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.name).toBe('AppError');
    expect(err instanceof Error).toBe(true);
  });
});
