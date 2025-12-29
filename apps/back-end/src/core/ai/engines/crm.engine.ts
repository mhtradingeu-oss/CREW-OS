import { runAIPipeline } from "../pipeline/pipeline-runner.js";
import type { PipelineResult } from "../pipeline/pipeline-types.js";
import { getDbGateway } from "../../../bootstrap/db.js";
import { buildBrandContext, buildCRMClientContext, type ContextBuilderOptions } from "../../../ai/context/context-builders.js";
import type { EngineRunOptions } from "./engine-types.js";

const AGENT_ID = "crm-coach";

export interface EngineInput {
  leadId: string;
  brandId?: string;
  tenantId?: string;
}

export interface EngineOutput {
  leadScore: number | null;
  churnRisk: string;
  nextBestActions: { type: string; description: string; dueBy?: string | null }[];
  summary: string;
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
  leadScore: number | null;
  churnRisk: string;
  nextBestActions: { type: string; description: string; dueBy?: string | null }[];
  summary: string;
} {
  const fallback = {
    leadScore: null,
    churnRisk: "unknown",
    nextBestActions: [],
    summary: "Lead coaching unavailable; follow standard playbook.",
  };

  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;

  const actions: { type: string; description: string; dueBy?: string | null }[] = [];
  if (Array.isArray(data.nextBestActions)) {
    for (const action of data.nextBestActions) {
      if (!action || typeof action !== "object") continue;
      const item = action as Record<string, unknown>;
      const type = typeof item.type === "string" ? item.type : null;
      const description = typeof item.description === "string" ? item.description : null;
      if (!type || !description) continue;
      actions.push({
        type,
        description,
        dueBy: typeof item.dueBy === "string" ? item.dueBy : null,
      });
    }
  }

  return {
    leadScore: toNumber(data.leadScore),
    churnRisk: typeof data.churnRisk === "string" ? data.churnRisk : fallback.churnRisk,
    nextBestActions: actions,
    summary: typeof data.summary === "string" ? data.summary : fallback.summary,
  };
}

export async function runEngine(input: EngineInput, options?: EngineRunOptions): Promise<EngineOutput> {
  const contextOptions = buildContextOptions(input, options);
  const dbGateway = getDbGateway();
  const crmCtx = await buildCRMClientContext(dbGateway, input.leadId, contextOptions);
  const brandIdFromCtx = (crmCtx as { scope?: { brandId?: string } } | null | undefined)?.scope?.brandId ?? input.brandId;
  const brandCtx = brandIdFromCtx
    ? await buildBrandContext(dbGateway, brandIdFromCtx, contextOptions).catch(() => null)
    : null;

  const pipeline = await runAIPipeline({
    agentId: options?.agentIdOverride ?? AGENT_ID,
    task: {
      input: { ...input },
      message: options?.task ?? "CRM_NEXT_BEST_ACTION",
    },
    actor: options?.actor,
    brandId: brandIdFromCtx ?? options?.brandId ?? undefined,
    tenantId: options?.tenantId ?? input.tenantId,
    includeEmbeddings: options?.includeEmbeddings,
    dryRun: options?.dryRun,
  });

  const normalized = normalizeOutput(pipeline.output);

  return {
    ...normalized,
    pipeline,
    contexts: pipeline.contexts ?? {
      crm: crmCtx,
      brand: brandCtx,
    },
  };
}
