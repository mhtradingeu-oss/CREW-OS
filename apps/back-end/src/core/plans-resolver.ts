import type { PlanFeatureSet, PlanKey } from "./plans.js";
import { getPlanDefinition, normalizeFeatureAliases } from "./plans.js";
import { prisma } from "./prisma.js";

export type PlanContext = {
  planKey: PlanKey;
  planName: string;
  features: PlanFeatureSet;
  tenantId?: string | null;
  brandId?: string | null;
  source: "database" | "default";
};

type ResolveParams = {
  tenantId?: string | null;
  brandId?: string | null;
};

function parseFeaturesJson(value: unknown): Partial<PlanFeatureSet> | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return typeof parsed === "object" && parsed ? (parsed as Partial<PlanFeatureSet>) : null;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") {
    return value as Partial<PlanFeatureSet>;
  }
  return null;
}

function mergeFeatures(planKey: PlanKey, featuresJson?: unknown, overridesJson?: unknown): PlanFeatureSet {
  const base = getPlanDefinition(planKey).features;
  const parsed = parseFeaturesJson(featuresJson);
  const overrides = parseFeaturesJson(overridesJson);
  const merged = { ...base, ...(parsed ?? {}), ...(overrides ?? {}) };
  return normalizeFeatureAliases(merged);
}

function coercePlanKey(value?: string | null): PlanKey {
  return getPlanDefinition(value ?? undefined).key;
}

export async function resolvePlanContext(params: ResolveParams): Promise<PlanContext> {
  const fallback = getPlanDefinition(undefined);
  let tenantId = params.tenantId ?? null;
  const brandId = params.brandId ?? null;

  if (tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        planOverridesJson: true,
        plan: { select: { key: true, name: true, featuresJson: true } },
      },
    });

    if (tenant?.plan) {
      const planKey = coercePlanKey(tenant.plan.key);
      const planDef = getPlanDefinition(planKey);
      return {
        planKey,
        planName: tenant.plan.name ?? planDef.name,
        features: mergeFeatures(planKey, tenant.plan.featuresJson, tenant.planOverridesJson),
        tenantId: tenant.id,
        brandId,
        source: "database",
      };
    }
  }

  if (!tenantId && brandId) {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: {
        id: true,
        tenant: {
          select: {
            id: true,
            planOverridesJson: true,
            plan: { select: { key: true, name: true, featuresJson: true } },
          },
        },
      },
    });

    if (brand?.tenant?.plan) {
      const planKey = coercePlanKey(brand.tenant.plan.key);
      const planDef = getPlanDefinition(planKey);
      return {
        planKey,
        planName: brand.tenant.plan.name ?? planDef.name,
        features: mergeFeatures(planKey, brand.tenant.plan.featuresJson, brand.tenant.planOverridesJson),
        tenantId: brand.tenant.id,
        brandId: brand.id,
        source: "database",
      };
    }
    tenantId = brand?.tenant?.id ?? null;
  }

  return {
    planKey: fallback.key,
    planName: fallback.name,
    features: fallback.features,
    tenantId,
    brandId,
    source: "default",
  };
}
