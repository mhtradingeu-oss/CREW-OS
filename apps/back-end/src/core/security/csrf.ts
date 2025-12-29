import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@mh-os/shared";
import { csrfInvalid } from "../http/errors.js";
import { logger } from "../logger.js";
import { readCookie } from "./cookies.js";

const CSRF_REQUIRED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const AUTH_PATH_PREFIX = "/api/v1/auth";
const AUTH_ROUTES_REQUIRING_CSRF = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/register",
]);

const isProduction = process.env.NODE_ENV === "production";
const csrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: "strict" as const,
  path: "/",
};

export function issueCsrfCookie(res: Response) {
  const token = randomBytes(32).toString("hex");
  try {
    res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions);
  } catch (err) {
     
    logger.error("Failed to set CSRF cookie", { error: err });
    throw err;
  }
}

export function csrfProtectionMiddleware(req: Request, res: Response, next: NextFunction) {

  // Explicitly skip CSRF for GET /api/v1/auth/csrf (public bootstrap endpoint)
  const path = normalizePath(req);
  if (
    req.method.toUpperCase() === "GET" &&
    path === "/api/v1/auth/csrf"
  ) {
    return next();
  }

  if (!CSRF_REQUIRED_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  if (isAuthPath(path) && !AUTH_ROUTES_REQUIRING_CSRF.has(path)) {
    return next();
  }

  const cookieToken = readCookie(req, CSRF_COOKIE_NAME);
  const headerToken =
    req.get(CSRF_HEADER_NAME) ?? req.get(CSRF_HEADER_NAME.toLowerCase()) ?? null;


  if (!cookieToken || !headerToken) {
    return next(csrfInvalid("CSRF token missing"));
  }

  const headerTokenNormalized = Array.isArray(headerToken) ? headerToken[0] : headerToken;
  if (!tokensMatch(cookieToken, headerTokenNormalized)) {
    return next(csrfInvalid("CSRF token mismatch"));
  }

  return next();
}

function normalizePath(req: Request): string {
  const url = req.path || req.originalUrl || "";
  const [pathname] = url.split("?");
  return pathname ?? "";
}

function isAuthPath(path: string) {
  return path.startsWith(AUTH_PATH_PREFIX);
}

function tokensMatch(expected: string, received: string) {
  if (expected.length !== received.length) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  try {
    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}
