import { badRequest } from "../../http/errors.js";
import { runAIPipeline } from "../pipeline/pipeline-runner.js";
import type { PipelineResult } from "../pipeline/pipeline-types.js";
import { getDbGateway } from "../../../bootstrap/db.js";
import { buildBrandContext, buildMarketingContext, type ContextBuilderOptions } from "../../../ai/context/context-builders.js";
import type { EngineRunOptions } from "./engine-types.js";

const AGENT_ID = "campaign-engine";

export interface EngineInput {
  brandId: string;
  campaignGoal?: string;
  budget?: number;
}

export interface EngineOutput {
  summary: string;
  experiments: { channel: string; hypothesis: string; metric: string }[];
  budgetMoves: { channel: string; delta: number }[];
  creativeIdeas: string[];
  pipeline: PipelineResult;
  contexts: Record<string, unknown>;
}

function buildContextOptions(input: EngineInput, options?: EngineRunOptions): ContextBuilderOptions {
  return {
    brandId: options?.brandId ?? input.brandId,
    permissions: options?.actor?.permissions,
    role: options?.actor?.role ?? undefined,
    includeEmbeddings: options?.includeEmbeddings,
  };
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeOutput(raw: unknown): {
  summary: string;
  experiments: { channel: string; hypothesis: string; metric: string }[];
  budgetMoves: { channel: string; delta: number }[];
  creativeIdeas: string[];
} {
  const fallback = {
    summary: "Marketing plan unavailable; keep existing campaigns steady.",
    experiments: [],
    budgetMoves: [],
    creativeIdeas: [],
  };

  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;

  const experiments: { channel: string; hypothesis: string; metric: string }[] = [];
  if (Array.isArray(data.experiments)) {
    for (const row of data.experiments) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const channel = typeof item.channel === "string" ? item.channel : null;
      const hypothesis = typeof item.hypothesis === "string" ? item.hypothesis : null;
      const metric = typeof item.metric === "string" ? item.metric : null;
      if (channel && hypothesis && metric) {
        experiments.push({ channel, hypothesis, metric });
      }
    }
  }

  const budgetMoves: { channel: string; delta: number }[] = [];
  if (Array.isArray(data.budgetMoves)) {
    for (const row of data.budgetMoves) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const channel = typeof item.channel === "string" ? item.channel : null;
      const delta = toNumber(item.delta);
      if (channel && delta !== null) {
        budgetMoves.push({ channel, delta });
      }
    }
  }

  const creativeIdeas = Array.isArray(data.creativeIdeas)
    ? data.creativeIdeas.filter((idea): idea is string => typeof idea === "string")
    : [];

  return {
    summary: typeof data.summary === "string" ? data.summary : fallback.summary,
    experiments,
    budgetMoves,
    creativeIdeas,
  };
}

export async function runEngine(input: EngineInput, options?: EngineRunOptions): Promise<EngineOutput> {
  if (!input.brandId && !options?.brandId) {
    throw badRequest("brandId is required for marketing engine");
  }

  const contextOptions = buildContextOptions(input, options);
  const dbGateway = getDbGateway();
  const brandCtx = await buildBrandContext(dbGateway, contextOptions.brandId ?? input.brandId, contextOptions);
  const marketingCtx = await buildMarketingContext(dbGateway, contextOptions.brandId ?? input.brandId, contextOptions);

  const pipeline = await runAIPipeline({
    agentId: options?.agentIdOverride ?? AGENT_ID,
    task: {
      input: { ...input },
      message: options?.task ?? "CAMPAIGN_PLAN",
    },
    actor: options?.actor,
    brandId: contextOptions.brandId ?? input.brandId,
    tenantId: options?.tenantId,
    includeEmbeddings: options?.includeEmbeddings,
    dryRun: options?.dryRun,
  });

  const normalized = normalizeOutput(pipeline.output);

  return {
    ...normalized,
    pipeline,
    contexts: pipeline.contexts ?? {
      brand: brandCtx,
      marketing: marketingCtx,
    },
  };
}
