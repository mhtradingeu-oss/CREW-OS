import express from "express";
import { env, isProdLikeEnv } from "../config/env.js";
import { logger } from "../logger.js";
import { prisma } from "../prisma.js";

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    environment: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

router.get("/liveness", (_req, res) => {
  res.json({
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

router.get("/readiness", async (_req, res) => {
  const dbCheck = await runDatabaseCheck();
  if (!dbCheck.ok) {
    return res.status(503).json({
      status: "error",
      checks: {
        database: {
          status: "unreachable",
          message: dbCheck.message,
        },
      },
    });
  }

  res.json({
    status: "ok",
    checks: {
      database: {
        status: "ok",
      },
    },
  });
});

async function runDatabaseCheck(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await prisma.$queryRaw`SELECT 1 AS result`;
    return { ok: true };
  } catch (error) {
    logger.warn("Health check detected an unhealthy Prisma connection", { error });
    return {
      ok: false,
      message: isProdLikeEnv ? "database unavailable" : (error instanceof Error ? error.message : "database unavailable"),
    };
  }
}

export { router as healthRouter };
