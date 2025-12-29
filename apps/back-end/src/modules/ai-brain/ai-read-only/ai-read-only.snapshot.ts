import type { AIReadOnlySnapshot } from "./ai-read-only.types.js";

export async function buildAIReadOnlySnapshot(): Promise<AIReadOnlySnapshot> {
  return {
    snapshotHash: "experimental",
    generatedAt: new Date(),
    events: {
      severityCounts: {},
      moduleBreakdown: [],
      total: 0,
    },
    metrics: {
      automationRuns: {
        successRate: 1,
        averageDurationMs: 0,
        total: 0,
      },
    },
    health: {
      database: {
        status: "ok",
      },
      uptimeSeconds: 0,
      readiness: {
        checkedAt: new Date().toISOString(),
      },
    },
    config: {
      featureFlags: [],
    },
    window: {
      minutes: 5,
    },
    data: {}
  };
}
