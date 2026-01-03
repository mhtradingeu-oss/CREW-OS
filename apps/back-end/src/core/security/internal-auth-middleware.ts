import type { NextFunction, Request, Response } from "express";
import { forbidden, unauthorized } from "../http/errors.js";
import { verifyToken } from "./jwt.js";

const INTERNAL_ROLES = new Set(["ADMIN", "INTERNAL"]);

function parseBearerToken(header?: string) {
  if (!header) {
    return null;
  }
  const trimmed = header.trim();
  if (!trimmed) {
    return null;
  }
  const [scheme, token] = trimmed.split(/\s+/);
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }
  return token.trim();
}

export function requireInternalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = parseBearerToken(req.headers.authorization);
  if (!token) {
    return next(unauthorized());
  }

  const payload = verifyToken(token);
  if (!payload) {
    return next(unauthorized());
  }

  const role = payload.role;
  if (role && INTERNAL_ROLES.has(role)) {
    console.debug("[internal-auth] access granted");
    return next();
  }

  return next(forbidden());
}

export { requireInternalAuth as requireInternalAdmin };
