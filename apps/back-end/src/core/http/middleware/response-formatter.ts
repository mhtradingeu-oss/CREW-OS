import type { NextFunction, Request, Response } from "express";

/**
 * Wrap JSON responses to always include { success, data } when the controller returned a bare payload.
 * Errors that already include a success flag remain untouched.
 */
export function responseFormatter(_req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = (body: unknown) => {
    if (body && typeof body === "object") {
      const typed = body as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(typed, "success")) {
        return originalJson(body);
      }
      return originalJson({ success: true, data: body });
    }
    return originalJson({ success: true, data: body });
  };

  next();
}
