import { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { emitSecurityEvent, getRequestMeta } from "../security/security-events.js";

const DEFAULT_WINDOW_MS = env.API_RATE_LIMIT_WINDOW_MS;
const DEFAULT_LIMIT = env.API_RATE_LIMIT_MAX;
const STRICT_WINDOW_MS = env.API_RATE_LIMIT_STRICT_WINDOW_MS;
const STRICT_LIMIT = env.API_RATE_LIMIT_STRICT_MAX;

const DEFAULT_MESSAGE = "Too many requests, please try again later.";
const AUTH_MESSAGE = "Too many authentication attempts, please try again later.";

function buildRateLimitHandler(scope: string, message: string) {
  return (req: Request, res: Response, _next: NextFunction) => {
    const meta = getRequestMeta(req);
    emitSecurityEvent({
      type: "RATE_LIMITED",
      scope,
      path: meta.path,
      ip: meta.ip,
      time: meta.time,
    });
    res.status(429).json({
      success: false,
      error: { code: "RATE_LIMITED", message },
    });
  };
}

/**
 * Lightweight rate limiter wrapper. TODO: Phase 3 – move to Redis/multi-node store.
 */
export function createRateLimiter(options?: { windowMs?: number; limit?: number; onRateLimit?: (req: Request, res: Response, next: NextFunction) => void }) {
  return rateLimit({
    windowMs: options?.windowMs ?? DEFAULT_WINDOW_MS,
    limit: options?.limit ?? DEFAULT_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    handler: options?.onRateLimit,
  });
}

export const apiRateLimiter = createRateLimiter({
  onRateLimit: buildRateLimitHandler("api", DEFAULT_MESSAGE),
});

export function createStrictAuthRateLimiter() {
  return createRateLimiter({
    windowMs: STRICT_WINDOW_MS,
    limit: STRICT_LIMIT,
    onRateLimit: buildRateLimitHandler("auth", AUTH_MESSAGE),
  });
}
