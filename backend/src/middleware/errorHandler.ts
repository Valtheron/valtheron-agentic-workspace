import { Request, Response, NextFunction } from 'express';

/**
 * Centralized error-handling middleware.
 * Must be registered AFTER all routes so Express treats it as the error handler.
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Known application error
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // JSON parse errors (malformed request body)
  if ((err as unknown as { type?: string }).type === 'entity.parse.failed' || err instanceof SyntaxError) {
    res.status(400).json({ error: 'Invalid JSON in request body' });
    return;
  }

  // Unexpected errors
  console.error('[ErrorHandler]', err);
  res.status(500).json({ error: 'Internal server error' });
}
