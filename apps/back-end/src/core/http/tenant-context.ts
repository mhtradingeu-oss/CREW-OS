import type { PlanKey, PlanFeatureSet } from "../plans.js";
import { getPlanDefinition } from "../plans.js";

export interface TenantContext {
  userId: string;
  roles: string[];
  planKey: PlanKey;
  tenantId?: string;
  brandId?: string;
  features: PlanFeatureSet;
}

type BuildTenantContextParams = {
  userId: string;
  roles: string[];
  tenantId?: string;
  brandId?: string;
  planKey?: string;
};

export function buildTenantContext(params: BuildTenantContextParams): TenantContext {
  const result = getPlanDefinition(params.planKey);
  return {
    userId: params.userId,
    roles: params.roles,
    planKey: result.key,
    tenantId: params.tenantId,
    brandId: params.brandId,
    features: result.features,
  };
}
