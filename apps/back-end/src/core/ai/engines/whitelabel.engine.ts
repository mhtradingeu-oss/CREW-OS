import { badRequest } from "../../http/errors.js";
import { runAIPipeline } from "../pipeline/pipeline-runner.js";
import type { PipelineResult } from "../pipeline/pipeline-types.js";
import { getDbGateway } from "../../../bootstrap/db.js";
import {
  buildBrandContext,
  buildMarketingContext,
  buildPricingContext,
  type ContextBuilderOptions,
} from "../../../ai/context/context-builders.js";
import type { EngineRunOptions } from "./engine-types.js";

const AGENT_ID = "whitelabel-engine";

export interface EngineInput {
  brandId: string;
  productId?: string;
  conceptHint?: string;
}

export interface EngineOutput {
  concept: string;
  pricing: { model: string; price?: number | null; currency?: string | null }[];
  profitability: string;
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
  concept: string;
  pricing: { model: string; price?: number | null; currency?: string | null }[];
  profitability: string;
} {
  const fallback = {
    concept: "White-label concept pending",
    pricing: [],
    profitability: "Profitability unknown; validate unit economics manually.",
  };

  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;

  const pricing: { model: string; price?: number | null; currency?: string | null }[] = [];
  if (Array.isArray(data.pricing)) {
    for (const row of data.pricing) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const model = typeof item.model === "string" ? item.model : null;
      if (!model) continue;
      pricing.push({
        model,
        price: toNumber(item.price),
        currency: typeof item.currency === "string" ? item.currency : null,
      });
    }
  }

  return {
    concept: typeof data.concept === "string" ? data.concept : fallback.concept,
    pricing,
    profitability: typeof data.profitability === "string" ? data.profitability : fallback.profitability,
  };
}

export async function runEngine(input: EngineInput, options?: EngineRunOptions): Promise<EngineOutput> {
  if (!input.brandId && !options?.brandId) {
    throw badRequest("brandId is required for white-label engine");
  }

  const contextOptions = buildContextOptions(input, options);
  const dbGateway = getDbGateway();
  const brandCtx = await buildBrandContext(dbGateway, contextOptions.brandId ?? input.brandId, contextOptions);
  const marketingCtx = await buildMarketingContext(
    dbGateway,
    contextOptions.brandId ?? input.brandId,
    contextOptions,
  ).catch(() => null);
  const pricingCtx = input.productId
    ? await buildPricingContext(dbGateway, input.productId, contextOptions).catch(() => null)
    : null;

  const pipeline = await runAIPipeline({
    agentId: options?.agentIdOverride ?? AGENT_ID,
    task: {
      input: { ...input },
      message: options?.task ?? "WHITE_LABEL_IDEATION",
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
      pricing: pricingCtx,
    },
  };
}
