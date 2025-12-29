import { randomUUID } from "crypto";
import {
  aggregateExecutionCosts,
  createExecutionLog,
  createMonitoringEvent,
  createSafetyEvent,
  findActiveAgentBudgets,
} from "../db/repositories/ai-monitoring.repository.js";
import type { InputJsonValue } from "../db/repositories/ai-monitoring.repository.js";
import { logger } from "../logger.js";
import { forbidden } from "../http/errors.js";
import type { AIMessage } from "../ai-service/ai-client.js";
import type { AIAgentDefinition } from "../../ai/schema/ai-agents-manifest.js";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ExecutionStatus = "SUCCESS" | "ERROR" | "BLOCKED" | "FALLBACK" | "RETRY";
export type MonitoringCategory =
  | "ENGINE_HEALTH"
  | "AGENT_ACTIVITY"
  | "TOKEN_USAGE"
  | "PERFORMANCE_METRIC"
  | "SYSTEM_ALERT";

const TOKENS_PER_CHAR = 0.25;
const COST_PER_1K_TOKENS: Record<string, number> = {
  "gpt-4-turbo": 0.01,
  "gpt-4o": 0.005,
  "gpt-3.5-turbo": 0.001,
};

function pickCostPerToken(model?: string) {
  if (!model) return COST_PER_1K_TOKENS["gpt-4-turbo"];
  const key = model.toLowerCase();
  if (key in COST_PER_1K_TOKENS) return COST_PER_1K_TOKENS[key];
  return COST_PER_1K_TOKENS["gpt-4-turbo"];
}

export function estimateTokens(messages: AIMessage[]): number {
  const totalChars = messages.reduce((acc, msg) => acc + (msg.content?.length ?? 0), 0);
  return Math.ceil(totalChars * TOKENS_PER_CHAR);
}

export function estimateCostUsd(totalTokens: number, model?: string): number {
  const costPer1k = pickCostPerToken(model) ?? 0;
  return Number(((totalTokens / 1000) * costPer1k).toFixed(6));
}

export async function logExecution(params: {
  runId: string;
  namespace?: string;
  agentName?: string;
  model?: string;
  provider?: string;
  status: ExecutionStatus;
  riskLevel?: RiskLevel;
  latencyMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  promptPreview?: string;
  outputPreview?: string;
  errorMessage?: string;
  brandId?: string | null;
  tenantId?: string | null;
  metadata?: InputJsonValue;
}) {
  try {
    await createExecutionLog({
      runId: params.runId,
      namespace: params.namespace,
      agentName: params.agentName,
      model: params.model,
      provider: params.provider ?? "openai",
      status: params.status as any,
      riskLevel: params.riskLevel as any,
      latencyMs: params.latencyMs ?? undefined,
      promptTokens: params.promptTokens ?? undefined,
      completionTokens: params.completionTokens ?? undefined,
      totalTokens: params.totalTokens ?? undefined,
      costUsd: params.costUsd ?? undefined,
      promptPreview: params.promptPreview?.slice(0, 1000),
      outputPreview: params.outputPreview?.slice(0, 2000),
      errorMessage: params.errorMessage?.slice(0, 2000),
      brandId: params.brandId ?? null,
      tenantId: params.tenantId ?? null,
      metadata: params.metadata,
    });
  } catch (err) {
    logger.error(`[AI][monitoring] failed to log execution ${params.runId}: ${String(err)}`);
  }
}

export async function recordMonitoringEvent(params: {
  category: MonitoringCategory;
  status?: string;
  metric?: InputJsonValue;
  agentName?: string;
  engine?: string;
  namespace?: string;
  riskLevel?: RiskLevel;
  brandId?: string | null;
  tenantId?: string | null;
}) {
  try {
    await createMonitoringEvent({
      category: params.category as any,
      status: params.status,
      metric: params.metric,
      agentName: params.agentName,
      engine: params.engine,
      namespace: params.namespace,
      riskLevel: params.riskLevel as any,
      brandId: params.brandId ?? null,
      tenantId: params.tenantId ?? null,
    });
  } catch (err) {
    logger.error(`[AI][monitoring] failed to record event: ${String(err)}`);
  }
}

export async function recordSafetyEvent(params: {
  type: "PROMPT_FIREWALL" | "SAFETY_CONSTRAINT" | "BANNED_ACTION" | "OVERSIGHT" | "RED_TEAM";
  action?: string;
  ruleId?: string;
  runId?: string;
  agentName?: string;
  namespace?: string;
  riskLevel?: RiskLevel;
  decision?: string;
  detail?: InputJsonValue;
  brandId?: string | null;
  tenantId?: string | null;
}) {
  try {
    await createSafetyEvent({
      type: params.type as any,
      action: params.action,
      ruleId: params.ruleId,
      runId: params.runId,
      agentName: params.agentName,
      namespace: params.namespace,
      riskLevel: params.riskLevel as any,
      decision: params.decision,
      detail: params.detail,
      brandId: params.brandId ?? null,
      tenantId: params.tenantId ?? null,
    });
  } catch (err) {
    logger.error(`[AI][safety] failed to record safety event: ${String(err)}`);
  }
}

export async function enforceAgentBudget(params: {
  agentName?: string;
  brandId?: string | null;
  tenantId?: string | null;
  estimatedTokens?: number;
  estimatedCostUsd?: number;
}) {
  if (!params.agentName) return;
  const { agentName } = params;
  const brandId = params.brandId ?? null;
  const tenantId = params.tenantId ?? null;
  const [budget] = await findActiveAgentBudgets({ agentName, brandId, tenantId });
  if (!budget) return;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const daily = await aggregateExecutionCosts({
    agentName,
    brandId,
    tenantId,
    createdAt: { gte: startOfDay },
  });
  const monthly = await aggregateExecutionCosts({
    agentName,
    brandId,
    tenantId,
    createdAt: { gte: startOfMonth },
  });

  const projectedCostDaily = (daily._sum.costUsd ?? 0) + (params.estimatedCostUsd ?? 0);
  const projectedCostMonthly = (monthly._sum.costUsd ?? 0) + (params.estimatedCostUsd ?? 0);
  const projectedTokens = (daily._sum.totalTokens ?? 0) + (params.estimatedTokens ?? 0);

  const nearingThreshold = (value: number, limit?: number | null) =>
    limit ? value >= limit * (budget.alertThreshold ?? 0.8) : false;

  if (budget.dailyBudgetUsd && projectedCostDaily > budget.dailyBudgetUsd) {
    throw forbidden("AI daily budget exceeded for agent");
  }
  if (budget.monthlyBudgetUsd && projectedCostMonthly > budget.monthlyBudgetUsd) {
    throw forbidden("AI monthly budget exceeded for agent");
  }
  if (budget.tokenLimit && projectedTokens > budget.tokenLimit) {
    throw forbidden("AI token budget exceeded for agent");
  }

  if (
    nearingThreshold(projectedCostDaily, budget.dailyBudgetUsd) ||
    nearingThreshold(projectedCostMonthly, budget.monthlyBudgetUsd)
  ) {
    await recordMonitoringEvent({
      category: "TOKEN_USAGE",
      status: "COST_ALERT",
      agentName,
      metric: {
        projectedCostDaily,
        projectedCostMonthly,
        dailyBudgetUsd: budget.dailyBudgetUsd,
        monthlyBudgetUsd: budget.monthlyBudgetUsd,
      },
      brandId,
      tenantId,
      riskLevel: "MEDIUM",
    });
  }
}

export async function enforceManifestBudget(params: {
  agent?: Pick<AIAgentDefinition, "name" | "scope" | "budgetProfile"> | null;
  estimatedTokens?: number;
  estimatedCostUsd?: number;
  brandId?: string | null;
  tenantId?: string | null;
}) {
  const profile = params.agent?.budgetProfile;
  if (!profile) return;

  const alertThreshold = profile.alertThreshold ?? 0.8;
  const agentName = params.agent?.name ?? "unknown-agent";
  const brandId = params.brandId ?? null;
  const tenantId = params.tenantId ?? null;

  const near = (value?: number, limit?: number) => Boolean(limit && value !== undefined && value >= limit * alertThreshold);

  if (profile.dailyLimit && params.estimatedCostUsd && params.estimatedCostUsd > profile.dailyLimit) {
    throw forbidden("AI daily budget exceeded for agent profile");
  }

  if (profile.monthlyLimit && params.estimatedCostUsd && params.estimatedCostUsd > profile.monthlyLimit) {
    throw forbidden("AI monthly budget exceeded for agent profile");
  }

  if (profile.dailyLimit && near(params.estimatedCostUsd, profile.dailyLimit)) {
    await recordMonitoringEvent({
      category: "TOKEN_USAGE",
      status: "MANIFEST_BUDGET_ALERT",
      agentName,
      riskLevel: "MEDIUM",
      metric: {
        estimatedCostUsd: params.estimatedCostUsd,
        estimatedTokens: params.estimatedTokens,
        profileDailyLimit: profile.dailyLimit,
      },
      brandId,
      tenantId,
    });
  }
}

export function createRunId() {
  return randomUUID();
}
