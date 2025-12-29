import { createPricingHistory } from "../../db/repositories/ai-pricing-history.repository.js";
import { getDbGateway } from "../../../bootstrap/db.js";
import { runAIPipeline } from "../pipeline/pipeline-runner.js";
import type { PipelineResult } from "../pipeline/pipeline-types.js";
import {
  buildInventoryContext,
  buildPricingContext,
  buildProductContext,
  type ContextBuilderOptions,
} from "../../../ai/context/context-builders.js";
import type { EngineRunOptions } from "./engine-types.js";

const AGENT_ID = "pricing-strategist";

export type RecommendedPrice = {
  channel?: string | null;
  priceNet?: number | null;
  priceGross?: number | null;
  currency?: string | null;
  rationale?: string | null;
};

export interface EngineInput {
  productId: string;
  brandId?: string;
  tenantId?: string;
  channel?: string;
  currency?: string;
  targetMarginPct?: number;
}

export interface EngineOutput {
  recommendedPrices: RecommendedPrice[];
  reasoning: string;
  confidence: number;
  summary?: string;
  aiPricingHistoryId?: string;
  pipeline: PipelineResult;
  contexts: Record<string, unknown>;
}

function buildContextOptions(input: EngineInput, options?: EngineRunOptions): ContextBuilderOptions {
  return {
    brandId: options?.brandId ?? input.brandId,
    tenantId: options?.tenantId ?? input.tenantId,
    permissions: options?.actor?.permissions,
    role: options?.actor?.role ?? undefined,
    includeEmbeddings: options?.includeEmbeddings,
    requiredPermissions: undefined,
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

function normalizePricingOutput(raw: unknown): {
  recommendedPrices: RecommendedPrice[];
  reasoning: string;
  confidence: number;
  summary?: string;
} {
  const fallback = {
    recommendedPrices: [],
    reasoning: "Unable to compute pricing recommendation; using safe fallback.",
    confidence: 0.35,
    summary: "No AI output available",
  };

  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;

  const recs: RecommendedPrice[] = [];
  if (Array.isArray(data.recommendedPrices)) {
    for (const rec of data.recommendedPrices) {
      if (!rec || typeof rec !== "object") continue;
      const item = rec as Record<string, unknown>;
      recs.push({
        channel: typeof item.channel === "string" ? item.channel : null,
        priceNet: toNumber(item.priceNet),
        priceGross: toNumber(item.priceGross),
        currency: typeof item.currency === "string" ? item.currency : null,
        rationale: typeof item.rationale === "string" ? item.rationale : null,
      });
    }
  }

  if (!recs.length && data.recommendation && typeof data.recommendation === "object") {
    const item = data.recommendation as Record<string, unknown>;
    recs.push({
      channel: typeof item.channel === "string" ? item.channel : null,
      priceNet: toNumber(item.priceNet),
      priceGross: toNumber(item.priceGross),
      currency: typeof item.currency === "string" ? item.currency : null,
      rationale: typeof item.rationale === "string" ? item.rationale : null,
    });
  }

  return {
    recommendedPrices: recs,
    reasoning: typeof data.reasoning === "string" ? data.reasoning : fallback.reasoning,
    confidence: typeof data.confidence === "number" && Number.isFinite(data.confidence)
      ? Math.max(0, Math.min(1, data.confidence))
      : fallback.confidence,
    summary: typeof data.summary === "string" ? data.summary : fallback.summary,
  };
}

async function persistPricingHistory(
  input: EngineInput,
  pricingCtx: Awaited<ReturnType<typeof buildPricingContext>> | null,
  normalized: ReturnType<typeof normalizePricingOutput>,
  brandId?: string,
): Promise<string | undefined> {
  const next = normalized.recommendedPrices[0];
  if (!next) return undefined;

  const record = await createPricingHistory({
    productId: input.productId,
    brandId: brandId ?? pricingCtx?.scope?.brandId ?? null,
    channel: next.channel ?? null,
    oldNet: toNumber((pricingCtx?.entity as { b2cNet?: unknown } | undefined)?.b2cNet),
    newNet: next.priceNet ?? next.priceGross ?? null,
    summary: next.rationale ?? normalized.reasoning ?? "AI pricing recommendation",
  });

  return record.id;
}

export async function runEngine(input: EngineInput, options?: EngineRunOptions): Promise<EngineOutput> {
  const contextOptions = buildContextOptions(input, options);
  const dbGateway = getDbGateway();
  const [productCtx, pricingCtx, inventoryCtx] = await Promise.all([
    buildProductContext(dbGateway, input.productId, contextOptions),
    buildPricingContext(dbGateway, input.productId, contextOptions),
    buildInventoryContext(dbGateway, { productId: input.productId }, contextOptions).catch(() => null),
  ]);

  const brandId = options?.brandId
    ?? input.brandId
    ?? (pricingCtx as { scope?: { brandId?: string } } | null | undefined)?.scope?.brandId
    ?? (productCtx as { scope?: { brandId?: string } } | null | undefined)?.scope?.brandId;
  const tenantId = options?.tenantId
    ?? input.tenantId
    ?? (pricingCtx as { scope?: { tenantId?: string } } | null | undefined)?.scope?.tenantId
    ?? (productCtx as { scope?: { tenantId?: string } } | null | undefined)?.scope?.tenantId;

  const pipeline = await runAIPipeline({
    agentId: options?.agentIdOverride ?? AGENT_ID,
    task: {
      input: { ...input },
      message: options?.task ?? "RECOMMEND_PRICES",
    },
    actor: options?.actor,
    brandId: brandId ?? undefined,
    tenantId: tenantId ?? undefined,
    includeEmbeddings: options?.includeEmbeddings,
    dryRun: options?.dryRun,
  });

  const normalized = normalizePricingOutput(pipeline.output);
  const aiPricingHistoryId = options?.dryRun ? undefined : await persistPricingHistory(input, pricingCtx, normalized, brandId).catch(() => undefined);

  return {
    ...normalized,
    aiPricingHistoryId,
    pipeline,
    contexts: pipeline.contexts ?? {
      product: productCtx,
      pricing: pricingCtx,
      inventory: inventoryCtx,
    },
  };
}
