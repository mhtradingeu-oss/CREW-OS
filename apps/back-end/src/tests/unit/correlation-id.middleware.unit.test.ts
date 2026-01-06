import { correlationIdMiddleware } from "../../core/http/middleware/correlation-id.js";
import { Request, Response, NextFunction } from "express";

describe("correlationIdMiddleware", () => {
  it("generates a correlationId if not present", () => {
      const req = {
        header: jest.fn().mockImplementation((name: string) => undefined),
        context: {},
      } as unknown as Request & { context: { correlationId?: string } };

    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    correlationIdMiddleware(req, res, next);

    expect(req.context?.correlationId).toMatch(
      /^[0-9a-fA-F-]{36}$/
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("uses x-correlation-id header if present", () => {
    const req = {
      header: jest.fn().mockImplementation((name: string) =>
        name.toLowerCase() === "x-correlation-id" ? "abc-123" : undefined
      ),
      context: {},
    } as unknown as Request & { context: { correlationId?: string } };

    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    correlationIdMiddleware(req, res, next);

    expect(req.context?.correlationId).toBe("abc-123");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("does not overwrite existing req.context", () => {
    const req = {
      header: jest.fn().mockImplementation((name: string) => undefined),
      context: { foo: "bar" },
    } as unknown as Request & { context: { foo: string; correlationId?: string } };

    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    correlationIdMiddleware(req, res, next);

    expect(req.context.foo).toBe("bar");
    expect(req.context.correlationId).toBeDefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
