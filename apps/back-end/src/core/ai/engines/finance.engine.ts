import { badRequest } from "../../http/errors.js";
import { runAIPipeline } from "../pipeline/pipeline-runner.js";
import type { PipelineResult } from "../pipeline/pipeline-types.js";
import { getDbGateway } from "../../../bootstrap/db.js";
import {
  buildBrandContext,
  buildFinanceContext,
  buildInventoryContext,
  buildPricingContext,
  type ContextBuilderOptions,
} from "../../../ai/context/context-builders.js";
import type { EngineRunOptions } from "./engine-types.js";

const AGENT_ID = "margin-engine";

export interface EngineInput {
  brandId: string;
  productId?: string;
}

export interface EngineOutput {
  summary: string;
  risks: string[];
  allocations: { channel: string; action: string }[];
  cashflow?: { runwayMonths?: number | null; burnRate?: number | null };
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
  risks: string[];
  allocations: { channel: string; action: string }[];
  cashflow?: { runwayMonths?: number | null; burnRate?: number | null };
} {
  const fallback = {
    summary: "Finance snapshot unavailable; maintain current budget mix.",
    risks: [],
    allocations: [],
    cashflow: undefined as { runwayMonths?: number | null; burnRate?: number | null } | undefined,
  };

  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;

  const allocations: { channel: string; action: string }[] = [];
  if (Array.isArray(data.allocations)) {
    for (const row of data.allocations) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const channel = typeof item.channel === "string" ? item.channel : null;
      const action = typeof item.action === "string" ? item.action : null;
      if (channel && action) allocations.push({ channel, action });
    }
  }

  const risks = Array.isArray(data.risks)
    ? data.risks.filter((r): r is string => typeof r === "string")
    : [];

  const cashflow = data.cashflow && typeof data.cashflow === "object"
    ? {
        runwayMonths: toNumber((data.cashflow as Record<string, unknown>).runwayMonths),
        burnRate: toNumber((data.cashflow as Record<string, unknown>).burnRate),
      }
    : fallback.cashflow;

  return {
    summary: typeof data.summary === "string" ? data.summary : fallback.summary,
    risks,
    allocations,
    cashflow,
  };
}

export async function runEngine(input: EngineInput, options?: EngineRunOptions): Promise<EngineOutput> {
  if (!input.brandId && !options?.brandId) {
    throw badRequest("brandId is required for finance engine");
  }

  const contextOptions = buildContextOptions(input, options);
  const dbGateway = getDbGateway();
  const brandCtx = await buildBrandContext(dbGateway, contextOptions.brandId ?? input.brandId, contextOptions);
  const financeCtx = await buildFinanceContext(dbGateway, contextOptions.brandId ?? input.brandId, contextOptions);
  const pricingCtx = input.productId
    ? await buildPricingContext(dbGateway, input.productId, contextOptions).catch(() => null)
    : null;
  const inventoryCtx = input.productId
    ? await buildInventoryContext(dbGateway, { productId: input.productId }, contextOptions).catch(() => null)
    : null;

  const pipeline = await runAIPipeline({
    agentId: options?.agentIdOverride ?? AGENT_ID,
    task: {
      input: { ...input },
      message: options?.task ?? "FINANCE_MARGIN_REVIEW",
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
      finance: financeCtx,
      pricing: pricingCtx,
      inventory: inventoryCtx,
    },
  };
}
