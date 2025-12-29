import { runAIPipeline } from "../pipeline/pipeline-runner.js";
import type { PipelineResult } from "../pipeline/pipeline-types.js";
import { getDbGateway } from "../../../bootstrap/db.js";
import { buildBrandContext, buildPartnerContext, type ContextBuilderOptions } from "../../../ai/context/context-builders.js";
import type { EngineRunOptions } from "./engine-types.js";

const AGENT_ID = "partner-ops";

export interface EngineInput {
  partnerUserId: string;
  brandId?: string;
  tenantId?: string;
}

export interface EngineOutput {
  summary: string;
  kpis: { name: string; value: number | null }[];
  recommendations: string[];
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
  summary: string;
  kpis: { name: string; value: number | null }[];
  recommendations: string[];
} {
  const fallback = {
    summary: "Partner health report unavailable; review KPIs manually.",
    kpis: [],
    recommendations: [],
  };

  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;

  const kpis: { name: string; value: number | null }[] = [];
  if (Array.isArray(data.kpis)) {
    for (const row of data.kpis) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const name = typeof item.name === "string" ? item.name : null;
      if (!name) continue;
      kpis.push({ name, value: toNumber(item.value) });
    }
  }

  const recommendations = Array.isArray(data.recommendations)
    ? data.recommendations.filter((rec): rec is string => typeof rec === "string")
    : [];

  return {
    summary: typeof data.summary === "string" ? data.summary : fallback.summary,
    kpis,
    recommendations,
  };
}

export async function runEngine(input: EngineInput, options?: EngineRunOptions): Promise<EngineOutput> {
  const contextOptions = buildContextOptions(input, options);
  const dbGateway = getDbGateway();
  const partnerCtx = await buildPartnerContext(dbGateway, input.partnerUserId, contextOptions);
  const brandFromCtx = (partnerCtx as { scope?: { brandId?: string } } | null | undefined)?.scope?.brandId ?? input.brandId;
  const brandCtx = brandFromCtx
    ? await buildBrandContext(dbGateway, brandFromCtx, contextOptions).catch(() => null)
    : null;

  const pipeline = await runAIPipeline({
    agentId: options?.agentIdOverride ?? AGENT_ID,
    task: {
      input: { ...input },
      message: options?.task ?? "PARTNER_HEALTH",
    },
    actor: options?.actor,
    brandId: brandFromCtx ?? options?.brandId ?? undefined,
    tenantId: options?.tenantId ?? input.tenantId,
    includeEmbeddings: options?.includeEmbeddings,
    dryRun: options?.dryRun,
  });

  const normalized = normalizeOutput(pipeline.output);

  return {
    ...normalized,
    pipeline,
    contexts: pipeline.contexts ?? {
      partner: partnerCtx,
      brand: brandCtx,
    },
  };
}
