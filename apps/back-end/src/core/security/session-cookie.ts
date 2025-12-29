import type { Request, Response, CookieOptions } from "express";
import { SESSION_COOKIE_MAX_AGE_SECONDS, SESSION_COOKIE_NAME } from "@mh-os/shared";
import { logger } from "../logger.js";
import { readCookie } from "./cookies.js";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Base cookie options shared by issue & clear.
 * - httpOnly: protects against XSS
 * - secure: only over HTTPS in production
 * - sameSite: Lax allows top-level navigation + blocks CSRF
 */
const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
};

export function issueSessionCookie(res: Response, token: string) {
  if (!token) {
    logger.error("[auth] Session token is missing", { });
    throw new Error("Session token is missing");
  }
  try {
    res.cookie(SESSION_COOKIE_NAME, token, {
      ...baseCookieOptions,
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS * 1000,
    });
  } catch (err) {
    // This should never fail silently  session auth depends on it
    logger.error("[auth] Failed to set session cookie", { error: err });
    throw err;
  }
}

export function clearSessionCookie(res: Response) {
  try {
    res.cookie(SESSION_COOKIE_NAME, "", {
      ...baseCookieOptions,
      maxAge: 0,
    });
  } catch (err) {
     
    logger.error("[auth] Failed to clear session cookie", { error: err });
    throw err;
  }
}

export function readSessionToken(req: Request): string | null {
  return readCookie(req, SESSION_COOKIE_NAME);
}
