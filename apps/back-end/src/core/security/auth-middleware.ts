import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "./jwt.js";
import { unauthorized, forbidden } from "../http/errors.js";
import { readSessionToken } from "./session-cookie.js";
import { emitSecurityEvent, getRequestMeta } from "./security-events.js";

const PUBLIC_PATH_PREFIXES = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/csrf",
  "/api/v1/auth/password/forgot",
  "/health",
] as const;

export function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (isPublicPath(req)) {
    return next();
  }

  const token = readSessionToken(req);
  if (!token) {
    emitSecurityEvent({
      type: "SESSION_INVALID",
      reason: "missing",
      ...getRequestMeta(req),
      path: req.path,
    });
    return next(unauthorized());
  }

  const payload = verifyToken(token);
  if (!payload) {
    emitSecurityEvent({
      type: "SESSION_INVALID",
      reason: "invalid",
      ...getRequestMeta(req),
      path: req.path,
    });
    return next(unauthorized());
  }

  (req as any).user = payload;
  return next();
}

function isPublicPath(req: Request) {
  const pathname = (req.path || req.originalUrl || "").split("?")[0] ?? "";
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

