import { correlationIdMiddleware } from '../../core/http/middleware/correlation-id.js';
import { Request, Response, NextFunction } from 'express';

describe('correlationIdMiddleware', () => {
  it('generates a correlationId if not present', () => {
    const req: Partial<Request> = { header: jest.fn().mockReturnValue(undefined) };
    const res = {} as Response;
    const next = jest.fn();
    correlationIdMiddleware(req as Request, res, next);
    expect((req as any).context.correlationId).toMatch(/[0-9a-fA-F-]{36}/);
    expect(next).toHaveBeenCalled();
  });

  it('uses x-correlation-id header if present', () => {
    const req: Partial<Request> = { header: jest.fn().mockReturnValue('abc-123') };
    const res = {} as Response;
    const next = jest.fn();
    correlationIdMiddleware(req as Request, res, next);
    expect((req as any).context.correlationId).toBe('abc-123');
    expect(next).toHaveBeenCalled();
  });

  it('does not overwrite existing req.context', () => {
    const req: any = { header: jest.fn().mockReturnValue(undefined), context: { foo: 'bar' } };
    const res = {} as Response;
    const next = jest.fn();
    correlationIdMiddleware(req as Request, res, next);
    expect(req.context.foo).toBe('bar');
    expect(req.context.correlationId).toBeDefined();
    expect(next).toHaveBeenCalled();
  });
});
