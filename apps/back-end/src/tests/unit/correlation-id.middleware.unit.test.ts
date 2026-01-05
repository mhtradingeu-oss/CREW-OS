
import { correlationIdMiddleware } from '../../core/http/middleware/correlation-id.js';

describe('correlationIdMiddleware', () => {
  it('generates a correlationId if not present', () => {
    const req = { header: jest.fn().mockReturnValue(undefined) };
    const res = {};
    const next = jest.fn();
    correlationIdMiddleware(req, res, next);
    expect(req.context?.correlationId).toMatch(/[0-9a-fA-F-]{36}/);
    expect(next).toHaveBeenCalled();
  });

  it('uses x-correlation-id header if present', () => {
    const req = { header: jest.fn().mockReturnValue('abc-123') };
    const res = {};
    const next = jest.fn();
    correlationIdMiddleware(req, res, next);
    expect(req.context?.correlationId).toBe('abc-123');
    expect(next).toHaveBeenCalled();
  });

  it('does not overwrite existing req.context', () => {
    const req = { header: jest.fn().mockReturnValue(undefined), context: { foo: 'bar' } };
    const res = {};
    const next = jest.fn();
    correlationIdMiddleware(req, res, next);
    expect(req.context.foo).toBe('bar');
    expect(req.context.correlationId).toBeDefined();
    expect(next).toHaveBeenCalled();
  });
});
