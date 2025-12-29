import "../../../../types/express-request-context.d.ts";

import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../errors.js";
import { isProdLikeEnv } from "../../config/env.js";
import { logger } from "../../logger.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const correlationId = (typeof _req === 'object' && (_req as any)?.context?.correlationId) ? (_req as any).context.correlationId : undefined;
  if (err instanceof ApiError) {
    const sanitizedDetails = isProdLikeEnv ? null : err.details ?? null;
    logger.error("ApiError", {
      module: "core/http/middleware/error-handler",
      action: "errorHandler",
      correlationId,
      meta: {
        code: err.code,
        message: err.message,
        details: sanitizedDetails,
      },
    });
    return res.status(err.status).json({
      success: false,
      error: {
        code: err.code ?? "ERROR",
        message: err.message,
        details: sanitizedDetails,
      },
    });
  }

  logger.error("Unhandled error", {
    module: "core/http/middleware/error-handler",
    action: "errorHandler",
    correlationId,
    meta: err,
  });
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal Server Error",
    },
  });
}
