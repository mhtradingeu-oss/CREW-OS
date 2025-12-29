export type AIReadOnlySnapshot = {
  snapshotHash: string;
  generatedAt: Date;
  events: {
    severityCounts: Record<string, number>;
    moduleBreakdown: Array<{ module: string }>;
    total: number;
  };
  metrics: {
    automationRuns: {
      successRate?: number;
      averageDurationMs?: number;
      total?: number;
    };
  };
  health: {
    database: {
      status: string;
    };
    uptimeSeconds?: number;
    readiness?: {
      checkedAt?: string;
    };
  };
  config: {
    featureFlags?: ReadonlyArray<{ aiInsights?: boolean }>;
  };
  window: {
    minutes: number;
  };
  data: Record<string, unknown>;
};
