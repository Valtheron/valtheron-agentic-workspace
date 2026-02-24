import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db/schema.js';
import { v4 as uuid } from 'uuid';

// Determine risk level based on HTTP method and path
function getRiskLevel(method: string, path: string): string {
  if (method === 'DELETE') return 'high';
  if (path.includes('kill-switch') && method === 'POST') return 'critical';
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') return 'medium';
  return 'info';
}

// Extract the agent or entity ID from request
function extractEntityId(req: Request): string {
  return req.params.id || req.body?.agentId || req.user?.userId || 'system';
}

export function auditLogger(req: Request, res: Response, next: NextFunction) {
  // Only log mutating operations
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // Skip auth routes (login/register generate their own context)
  if (req.path.startsWith('/api/auth')) {
    return next();
  }

  const startTime = Date.now();

  // Capture original end to log after response
  const originalEnd = res.end.bind(res);
  res.end = function (...args: Parameters<Response['end']>) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log asynchronously to not block response
    setImmediate(() => {
      try {
        const db = getDb();
        const agentId = extractEntityId(req);
        const action = `${req.method} ${req.baseUrl}${req.path}`;
        const riskLevel = getRiskLevel(req.method, req.originalUrl);
        const details = JSON.stringify({
          statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('user-agent')?.slice(0, 100),
          user: req.user?.username,
        });

        db.prepare(
          'INSERT INTO audit_log (id, agentId, action, details, riskLevel) VALUES (?, ?, ?, ?, ?)'
        ).run(uuid(), agentId, action, details, riskLevel);
      } catch {
        // Don't crash on audit failures
      }
    });

    return originalEnd(...args);
  } as Response['end'];

  next();
}
