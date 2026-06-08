import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const DEFAULT_JWT_SECRET = 'valtheron-dev-secret-change-in-production';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

if (JWT_SECRET === DEFAULT_JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    // Refuse to boot: using the shipped default in production would make every
    // session token forgeable. Operators must generate their own secret.
    throw new Error(
      'JWT_SECRET is set to the default value in production. ' +
        'Generate a strong secret (e.g. `openssl rand -hex 32`) and set JWT_SECRET before starting.',
    );
  } else if (process.env.NODE_ENV !== 'test') {
    console.warn(
      '[auth] JWT_SECRET is using the default development value. ' +
        'Set a unique JWT_SECRET before deploying to production.',
    );
  }
}

export interface AuthPayload {
  userId: string;
  username: string;
  role: string;
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  try {
    const token = authHeader.slice(7);
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      req.user = verifyToken(token);
    } catch {
      // Token invalid, continue without auth
    }
  }
  next();
}
