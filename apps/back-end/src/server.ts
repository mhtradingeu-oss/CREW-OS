
import express, { type Express } from "express";
import { createApp } from "./app.js";
import { env } from "./core/config/env.js";
import { initEventHub } from "./bootstrap/event-hub.js";
import { initPrisma, shutdownPrisma } from "./bootstrap/prisma-runtime.js";
import { logger } from "./core/logger.js";
import { healthRouter } from "./core/health/router.js";
import { dbCheck } from "./modules/health/readiness-checks.js";
import http from "http";

// --- Startup Gating ---
const bootstrapApp = express();
bootstrapApp.use("/health", healthRouter);
// Fallback: all other routes 503
bootstrapApp.use((req, res) => {
  res.status(503).json({ status: "not_ready", reason: "Service not ready" });
});

const port = env.PORT ?? 4000;
const host = env.SERVER_HOST ?? (env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

const server = http.createServer(bootstrapApp);
let currentHandler = bootstrapApp;

// Helper to swap handler
function swapHandler(newApp: Express) {
  currentHandler = newApp;
  server.removeAllListeners("request");
  server.on("request", currentHandler);
  logger.info("Business routes are now live (READY)");
}

// Attach initial handler
server.on("request", currentHandler);

server.listen(port, host, () => {
  logger.info(`🚀 API running at http://${host}:${port}`);
});

// --- Readiness Polling ---
async function pollReadinessAndSwap() {
  await initPrisma();
  initEventHub();
  const fullApp = createApp();
  const timeoutMs = 30000;
  const intervalMs = 1000;
  const strict = process.env.READINESS_STRICT === "true";
  const start = Date.now();
  let ready = false;
  while (Date.now() - start < timeoutMs) {
    try {
      const db = await dbCheck({ strict: true });
      if (db.ok) {
        ready = true;
        break;
      }
      logger.warn("DB not ready: " + (db.reason || "unknown"));
    } catch (e) {
      logger.warn("Readiness check failed", { error: e });
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  if (ready) {
    swapHandler(fullApp);
  } else {
    logger.error("Startup readiness checks failed: dependencies not ready after 30s");
    if (strict) {
      logger.error("STRICT readiness: exiting");
      process.exit(1);
    }
    // else: remain serving bootstrapApp (liveness OK, readiness 503)
  }
}
pollReadinessAndSwap();

// --- Crash Safety ---
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { error: err });
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", { error: reason });
  process.exit(1);
});

// --- Graceful Shutdown ---
let shuttingDown = false;
function gracefulShutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("Received shutdown signal, draining connections...");
  server.close(async () => {
    logger.info("HTTP server closed. Disconnecting resources...");
    try {
      await shutdownPrisma();
    } catch (error) {
      logger.error("Failed to shutdown Prisma", { error });
    }
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => {
    logger.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10000);
}
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
