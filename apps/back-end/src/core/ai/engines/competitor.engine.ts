import { runAIPipeline } from "../pipeline/pipeline-runner.js";
import type { PipelineResult } from "../pipeline/pipeline-types.js";
import { getDbGateway } from "../../../bootstrap/db.js";
import { buildBrandContext, buildPricingContext, buildProductContext, type ContextBuilderOptions } from "../../../ai/context/context-builders.js";
import type { EngineRunOptions } from "./engine-types.js";

const AGENT_ID = "competitor-engine";

export interface EngineInput {
  productId: string;
  brandId?: string;
  tenantId?: string;
  market?: string;
  focusCompetitors?: string[];
}

export interface EngineOutput {
  positioning: string;
  recommendedActions: string[];
  priceMoves: { channel?: string | null; action: string; target?: number | null }[];
  confidence: number;
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
  positioning: string;
  recommendedActions: string[];
  priceMoves: { channel?: string | null; action: string; target?: number | null }[];
  confidence: number;
} {
  const fallback = {
    positioning: "Competitive position unknown",
    recommendedActions: [],
    priceMoves: [],
    confidence: 0.3,
  };

  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;

  const actions = Array.isArray(data.recommendedActions)
    ? data.recommendedActions.filter((item): item is string => typeof item === "string")
    : [];

  const moves: { channel?: string | null; action: string; target?: number | null }[] = [];
  if (Array.isArray(data.priceMoves)) {
    for (const move of data.priceMoves) {
      if (!move || typeof move !== "object") continue;
      const item = move as Record<string, unknown>;
      const action = typeof item.action === "string" ? item.action : null;
      if (!action) continue;
      moves.push({
        channel: typeof item.channel === "string" ? item.channel : null,
        action,
        target: toNumber(item.target),
      });
    }
  }

  return {
    positioning: typeof data.positioning === "string" ? data.positioning : fallback.positioning,
    recommendedActions: actions,
    priceMoves: moves,
    confidence: typeof data.confidence === "number" && Number.isFinite(data.confidence)
      ? Math.max(0, Math.min(1, data.confidence))
      : fallback.confidence,
  };
}

export async function runEngine(input: EngineInput, options?: EngineRunOptions): Promise<EngineOutput> {
  const contextOptions = buildContextOptions(input, options);
  const dbGateway = getDbGateway();
  const [productCtx, pricingCtx] = await Promise.all([
    buildProductContext(dbGateway, input.productId, contextOptions),
    buildPricingContext(dbGateway, input.productId, contextOptions),
  ]);

  const brandId = options?.brandId
    ?? input.brandId
    ?? (pricingCtx as { scope?: { brandId?: string } } | null | undefined)?.scope?.brandId
    ?? (productCtx as { scope?: { brandId?: string } } | null | undefined)?.scope?.brandId;
  const tenantId = options?.tenantId
    ?? input.tenantId
    ?? (pricingCtx as { scope?: { tenantId?: string } } | null | undefined)?.scope?.tenantId
    ?? (productCtx as { scope?: { tenantId?: string } } | null | undefined)?.scope?.tenantId;

  const brandCtx = brandId ? await buildBrandContext(dbGateway, brandId, contextOptions).catch(() => null) : null;

  const pipeline = await runAIPipeline({
    agentId: options?.agentIdOverride ?? AGENT_ID,
    task: {
      input: { ...input },
      message: options?.task ?? "ANALYZE_COMPETITORS",
    },
    actor: options?.actor,
    brandId: brandId ?? undefined,
    tenantId: tenantId ?? undefined,
    includeEmbeddings: options?.includeEmbeddings,
    dryRun: options?.dryRun,
  });

  const normalized = normalizeOutput(pipeline.output);

  return {
    ...normalized,
    pipeline,
    contexts: pipeline.contexts ?? {
      product: productCtx,
      pricing: pricingCtx,
      brand: brandCtx,
    },
  };
}
