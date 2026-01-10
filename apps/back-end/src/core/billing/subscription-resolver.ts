// Canonical Subscription Resolver for Phase 2E
// Provides resolveSubscriptionState(req) → SubscriptionState
// Uses request context for tenantId and planCode; stubbed for now

import { PLAN_REGISTRY, PlanCode, LimitKey } from "./plan-registry.js";

export type SubscriptionState = {
  tenantId: string;
  planCode: PlanCode;
  status: "active" | "past_due" | "canceled" | "trial";
  entitlements: {
    features: Set<string>;
    limits: Record<string, number>;
  };
};

// Temporary resolver: reads from req.user (must be replaced with DB in production)
export function resolveSubscriptionState(req: { user?: any }): SubscriptionState {
  const tenantId = req.user?.tenantId;
  // Strict validation: fallback to FREE if missing
  let planCode: PlanCode = (req.user?.planCode as PlanCode) || "FREE";
  if (!Object.keys(PLAN_REGISTRY).includes(planCode)) planCode = "FREE";
  // Status stub: always active for now
  const status: SubscriptionState["status"] = "active";
  const entitlements = PLAN_REGISTRY[planCode];
  return {
    tenantId,
    planCode,
    status,
    entitlements: {
      features: entitlements.features,
      limits: entitlements.limits,
    },
  };
}
