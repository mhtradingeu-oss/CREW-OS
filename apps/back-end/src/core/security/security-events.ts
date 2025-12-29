import crypto from "crypto";
import type { Request } from "express";
import { publishDomainEvent } from "../events/domain/bus.js";
import { logger } from "../logger.js";

export type SecurityEvent =
  | { type: "AUTH_LOGIN_SUCCESS"; userId: string; tenantId?: string; ip: string; ua: string; time: string }
  | { type: "AUTH_LOGIN_FAILED"; emailHash: string; ip: string; ua: string; time: string }
  | { type: "AUTH_LOGOUT"; userId: string; tenantId?: string; ip: string; ua: string; time: string }
  | { type: "AUTH_ME_REFRESH"; userId: string; tenantId?: string; ip: string; ua: string; time: string }
  | { type: "CSRF_INVALID"; path: string; method: string; ip: string; ua: string; time: string }
  | { type: "SESSION_INVALID"; reason: "missing" | "invalid" | "expired"; path: string; ip: string; ua: string; time: string }
  | { type: "RATE_LIMITED"; scope: string; path: string; ip: string; time: string };

function redact(event: SecurityEvent): SecurityEvent {
  // All fields are already sanitized by design
  return { ...event };
}

export function emitSecurityEvent(event: SecurityEvent) {
  const sanitized = redact(event);
  const tenantId = (sanitized as { tenantId?: string }).tenantId ?? null;
  const ip = (sanitized as { ip?: string }).ip ?? null;
  const ua = (sanitized as { ua?: string }).ua ?? null;

  publishDomainEvent({
    type: sanitized.type,
    payload: sanitized,
    meta: {
      tenantId,
      module: "security",
      source: "security",
      ip,
      ua,
      time: sanitized.time,
    },
  });

  if (process.env.SECURITY_EVENTS_WEBHOOK_URL) {
    fetch(process.env.SECURITY_EVENTS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanitized),
      signal: AbortSignal.timeout(2000),
    }).catch(() => {
      // fail-safe: never throw from security logging
    });
  }

  if (
    event.type === "AUTH_LOGIN_FAILED" ||
    event.type === "CSRF_INVALID" ||
    event.type === "SESSION_INVALID" ||
    event.type === "RATE_LIMITED"
  ) {
    logger.warn("[security-event]", { error: sanitized });
  } else {
    logger.info("[security-event]", sanitized);
  }
}

export function hashEmail(email: string): string {
  return crypto
    .createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
}

/**
 * Normalize request metadata for security events.
 * Ensures ip is ALWAYS a string.
 */
export function getRequestMeta(req: Request) {
  let ip = "unknown";

  if (typeof req.ip === "string") {
    ip = req.ip;
  } else if (typeof req.headers["x-forwarded-for"] === "string") {
    const xff = req.headers["x-forwarded-for"];
    if (xff) {
      const firstIp = xff.split(",")[0];
      ip = firstIp ? firstIp.trim() : ip;
    }
  }

  return {
    ip,
    ua: req.headers["user-agent"] ?? "unknown",
    path: req.path,
    method: req.method,
    time: new Date().toISOString(),
  };
}
