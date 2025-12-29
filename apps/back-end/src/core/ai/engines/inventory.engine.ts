import { badRequest } from "../../http/errors.js";
import { runAIPipeline } from "../pipeline/pipeline-runner.js";
import type { PipelineResult } from "../pipeline/pipeline-types.js";
import { getDbGateway } from "../../../bootstrap/db.js";
import {
  buildBrandContext,
  buildInventoryContext,
  buildProductContext,
  type ContextBuilderOptions,
} from "../../../ai/context/context-builders.js";
import type { EngineRunOptions } from "./engine-types.js";

const AGENT_ID = "inventory-optimizer";

export interface EngineInput {
  productId?: string;
  warehouseId?: string;
  brandId?: string;
  tenantId?: string;
}

export interface EngineOutput {
  reorderAlerts: { productId?: string; warehouseId?: string; quantity?: number | null; reason?: string }[];
  replenishmentPlan: { productId?: string; warehouseId?: string; quantity: number; etaDays?: number | null }[];
  notes: string;
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
  reorderAlerts: { productId?: string; warehouseId?: string; quantity?: number | null; reason?: string }[];
  replenishmentPlan: { productId?: string; warehouseId?: string; quantity: number; etaDays?: number | null }[];
  notes: string;
} {
  const fallback = {
    reorderAlerts: [],
    replenishmentPlan: [],
    notes: "Inventory forecast unavailable; review stock manually.",
  };

  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;

  const alerts: { productId?: string; warehouseId?: string; quantity?: number | null; reason?: string }[] = [];
  if (Array.isArray(data.reorderAlerts)) {
    for (const alert of data.reorderAlerts) {
      if (!alert || typeof alert !== "object") continue;
      const item = alert as Record<string, unknown>;
      alerts.push({
        productId: typeof item.productId === "string" ? item.productId : undefined,
        warehouseId: typeof item.warehouseId === "string" ? item.warehouseId : undefined,
        quantity: toNumber(item.quantity),
        reason: typeof item.reason === "string" ? item.reason : undefined,
      });
    }
  }

  const replenishment: { productId?: string; warehouseId?: string; quantity: number; etaDays?: number | null }[] = [];
  if (Array.isArray(data.replenishmentPlan)) {
    for (const row of data.replenishmentPlan) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const quantity = toNumber(item.quantity);
      if (quantity === null) continue;
      replenishment.push({
        productId: typeof item.productId === "string" ? item.productId : undefined,
        warehouseId: typeof item.warehouseId === "string" ? item.warehouseId : undefined,
        quantity,
        etaDays: toNumber(item.etaDays),
      });
    }
  }

  return {
    reorderAlerts: alerts,
    replenishmentPlan: replenishment,
    notes: typeof data.notes === "string" ? data.notes : fallback.notes,
  };
}

export async function runEngine(input: EngineInput, options?: EngineRunOptions): Promise<EngineOutput> {
  if (!input.productId && !input.warehouseId) {
    throw badRequest("productId or warehouseId is required for inventory engine");
  }

  const contextOptions = buildContextOptions(input, options);
  const dbGateway = getDbGateway();
  const inventoryCtx = await buildInventoryContext(dbGateway, { productId: input.productId, warehouseId: input.warehouseId }, contextOptions);
  const productCtx = input.productId ? await buildProductContext(dbGateway, input.productId, contextOptions) : null;
  const brandFromCtx = (inventoryCtx as { scope?: { brandId?: string } } | null | undefined)?.scope?.brandId
    ?? (productCtx as { scope?: { brandId?: string } } | null | undefined)?.scope?.brandId
    ?? input.brandId;
  const brandCtx = brandFromCtx
    ? await buildBrandContext(dbGateway, brandFromCtx, contextOptions).catch(() => null)
    : null;

  const pipeline = await runAIPipeline({
    agentId: options?.agentIdOverride ?? AGENT_ID,
    task: {
      input: { ...input },
      message: options?.task ?? "INVENTORY_FORECAST",
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
      inventory: inventoryCtx,
      product: productCtx,
      brand: brandCtx,
    },
  };
}
