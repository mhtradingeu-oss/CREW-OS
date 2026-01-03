import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Middleware to ensure every request has a correlationId.
 * - Reads x-correlation-id header if present
 * - Otherwise generates a new UUID
 * - Attaches to req.context.correlationId
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  // Ensure req.context exists
  const reqWithContext = req as Request & { context?: { correlationId?: string } };
  if (!reqWithContext.context) reqWithContext.context = {};
  const headerId = req.header('x-correlation-id');
  reqWithContext.context.correlationId = headerId || randomUUID();
  next();
}
