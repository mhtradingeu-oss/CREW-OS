import { badRequest } from "../../http/errors.js";
import { runAIPipeline } from "../pipeline/pipeline-runner.js";
import type { PipelineResult } from "../pipeline/pipeline-types.js";
import { getDbGateway } from "../../../bootstrap/db.js";
import { buildBrandContext, buildOperationsContext, type ContextBuilderOptions } from "../../../ai/context/context-builders.js";
import type { EngineRunOptions } from "./engine-types.js";

const AGENT_ID = "governance-engine";

export interface EngineInput {
  brandId: string;
  action?: string;
}

export interface EngineOutput {
  safeToProceed: boolean;
  violations: string[];
  requiredApprovals: string[];
  notes: string;
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

function normalizeOutput(raw: unknown): {
  safeToProceed: boolean;
  violations: string[];
  requiredApprovals: string[];
  notes: string;
} {
  const fallback = {
    safeToProceed: false,
    violations: [],
    requiredApprovals: [],
    notes: "Governance validation unavailable; escalate to human reviewer.",
  };

  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;

  return {
    safeToProceed: typeof data.safeToProceed === "boolean" ? data.safeToProceed : fallback.safeToProceed,
    violations: Array.isArray(data.violations)
      ? data.violations.filter((v): v is string => typeof v === "string")
      : fallback.violations,
    requiredApprovals: Array.isArray(data.requiredApprovals)
      ? data.requiredApprovals.filter((v): v is string => typeof v === "string")
      : fallback.requiredApprovals,
    notes: typeof data.notes === "string" ? data.notes : fallback.notes,
  };
}

export async function runEngine(input: EngineInput, options?: EngineRunOptions): Promise<EngineOutput> {
  if (!input.brandId && !options?.brandId) {
    throw badRequest("brandId is required for governance engine");
  }

  const contextOptions = buildContextOptions(input, options);
  const dbGateway = getDbGateway();
  const brandCtx = await buildBrandContext(dbGateway, contextOptions.brandId ?? input.brandId, contextOptions);
  const opsCtx = await buildOperationsContext(dbGateway, contextOptions.brandId ?? input.brandId, contextOptions).catch(
    () => null,
  );

  const pipeline = await runAIPipeline({
    agentId: options?.agentIdOverride ?? AGENT_ID,
    task: {
      input: { ...input },
      message: options?.task ?? "GOVERNANCE_CHECK",
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
      operations: opsCtx,
    },
  };
}
