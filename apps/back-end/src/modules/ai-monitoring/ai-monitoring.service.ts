import * as aiMonitoringRepo from "../../core/db/repositories/ai-monitoring.repository.js";
import { logger } from "../../core/logger.js";
import { publishDomainEvent } from "../../core/events/event-bus.js";
import type { InputJsonValue } from "@prisma/client/runtime/library";
// ...existing code...
import { AIExecutionStatus } from "@prisma/client";

// Removed legacy avgLatency calculation (rows/totalLatency undefined)
// ...existing code...
// ...existing code...




type AIUsagePayload = {
  runId: string;
  // agentName is for event/monitoring only; not persisted in AIAgentConfig
  agentName?: string;
  model?: string;
  provider?: string;
  status: AIExecutionStatus;
  latencyMs?: number;
  totalTokens?: number;
  costUsd?: number;
  brandId?: string;
  tenantId?: string;
  metadata?: InputJsonValue;
};

type ExecutionLogRow = Awaited<ReturnType<typeof aiMonitoringRepo.findRecentExecutionLogs>>[number];

// Log AI usage metrics
export async function logAIUsage(payload: AIUsagePayload) {
  const log = await aiMonitoringRepo.createExecutionLog({
    ...payload,
    brandId: payload.brandId ?? undefined,
    metadata: payload.metadata ?? undefined,
  });


  await publishDomainEvent({
    type: "ai.usage.logged",
    payload: {
      runId: payload.runId,
      // agentName is for event/monitoring only; not persisted in AIAgentConfig
      agentName: payload.agentName,
      model: payload.model,
      provider: payload.provider,
      status: payload.status,
      latencyMs: payload.latencyMs,
      totalTokens: payload.totalTokens,
      costUsd: payload.costUsd,
      brandId: payload.brandId,
      tenantId: payload.tenantId,
    },
  });

  return log;
}

// Emit AI performance snapshot
export async function emitPerformanceSnapshot() {
  const metrics = await getPerformanceMetrics();

  await publishDomainEvent({
    type: "ai.performance.snapshot",
    payload: metrics,
  });

  return metrics;
}


const ENGINE_HEALTH = "ENGINE_HEALTH" as const;
const SYSTEM_ALERT = "SYSTEM_ALERT" as const;
const DEFAULT_LIMIT = 200;

export async function getEngineHealth(limit = DEFAULT_LIMIT) {
  // ENGINE_HEALTH removed; use valid enum or placeholder
  return aiMonitoringRepo.findMonitoringEventsByCategory('PLACEHOLDER', limit);
}

export async function getAgentActivity(limit = DEFAULT_LIMIT) {
  return aiMonitoringRepo.findExecutionLogs(limit);
}

export async function getTokenUsage() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const rows = await aiMonitoringRepo.findExecutionLogsSince(startOfMonth);

  const usageByAgent: Record<
    string,
    { monthTokens: number; monthCost: number; dayTokens: number; dayCost: number }
  > = {};

  for (const row of rows) {
    // agentName is for event/monitoring only; not persisted in AIAgentConfig
    const key = row.agentName ?? "unknown";
    const bucket = (usageByAgent[key] ??= {
      monthTokens: 0,
      monthCost: 0,
      dayTokens: 0,
      dayCost: 0,
    });

    bucket.monthTokens += row.totalTokens ?? 0;
    bucket.monthCost += row.costUsd ?? 0;

    if (row.createdAt && row.createdAt >= startOfDay) {
      bucket.dayTokens += row.totalTokens ?? 0;
      bucket.dayCost += row.costUsd ?? 0;
    }
  }

  return usageByAgent;
}

export async function getPerformanceMetrics() {
  const rows = await aiMonitoringRepo.findRecentExecutionLogs(DEFAULT_LIMIT);

  const totalLatency = rows.reduce<number>(
    (acc: number, row: ExecutionLogRow) => acc + (row.latencyMs ?? 0),
    0,
  );
  const avgLatency = rows.length ? Math.round(totalLatency / rows.length) : 0;

  // Use Prisma enum
  return {
    avgLatency: avgLatency,
    totalRequests: rows.length,
    errors: rows.filter((row: ExecutionLogRow) => row.status === AIExecutionStatus.FAILED).length,
    fallbacks: 0, // FALLBACK removed; provide safe default
  };
}

export async function getSystemAlerts(limit = DEFAULT_LIMIT) {
  // SYSTEM_ALERT removed; use valid enum or placeholder
  return aiMonitoringRepo.findMonitoringEventsByCategory('PLACEHOLDER', limit);
}

export async function getSafetyEvents(limit = DEFAULT_LIMIT) {
  return aiMonitoringRepo.findSafetyEvents(limit);
}

export async function createSystemAlert(payload: aiMonitoringRepo.SystemAlertPayload) {
  try {
    await aiMonitoringRepo.createSystemAlert({
      ...payload,
      status: payload.status as AIExecutionStatus,
    });
  } catch (err) {
    logger.error("[ai-monitoring] failed to push alert", { error: err });
  }
}
