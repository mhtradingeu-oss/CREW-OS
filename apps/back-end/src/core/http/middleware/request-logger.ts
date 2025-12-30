import type { Request, Response, NextFunction } from "express";
import { logger } from "../../logger.js";
import { sanitizeRoute } from "./route-utils.js";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const label = sanitizeRoute(req.originalUrl);
  const correlationId = (req as any)?.context?.correlationId;
  // Log request start
  logger.info("request.start", {
    module: "core/http/middleware/request-logger",
    correlationId,
    method: req.method,
    route: label,
  });
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("request.end", {
      module: "core/http/middleware/request-logger",
      correlationId,
      method: req.method,
      route: label,
      status: res.statusCode,
      durationMs: duration,
    });
  });
  next();
}
