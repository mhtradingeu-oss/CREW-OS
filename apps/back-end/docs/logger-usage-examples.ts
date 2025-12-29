// Usage examples for the new logger utility
import { logger } from "../src/core/logger.js";

// Info log with context
demoInfo();
function demoInfo() {
  logger.info("User created", {
    module: "user",
    action: "create",
    correlationId: "abc-123",
    meta: { userId: 42, email: "user@example.com" },
  });
}

// Error log with event context
demoError();
function demoError() {
  logger.error("Event processing failed", {
    module: "event-bus",
    action: "publish",
    eventName: "user.created",
    correlationId: "abc-123",
    meta: { error: "ValidationError", details: { field: "email" } },
  });
}

// Debug log
demoDebug();
function demoDebug() {
  logger.debug("Debugging event", {
    module: "event-bus",
    action: "subscribe",
    eventName: "user.created",
    correlationId: "abc-123",
    meta: { payload: { userId: 42 } },
  });
}
