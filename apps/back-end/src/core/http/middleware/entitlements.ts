// Canonical Entitlement Enforcement Middleware for Phase 2E
// Provides requirePlan, requireEntitlementLimit, consumeEntitlement

import type { Request, Response, NextFunction } from "express";

type AuthedRequest = Request & { user?: any };
import { PLAN_REGISTRY, PlanCode, LimitKey } from "../../billing/plan-registry.js";
import { resolveSubscriptionState } from "../../billing/subscription-resolver.js";
import { forbidden } from "../../http/errors.js";

// Canonical requirePlan usage only (see plan-registry)
export function requirePlan(plan: typeof PLAN_REGISTRY[PlanCode]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const { planCode } = resolveSubscriptionState(req);
    if (PLAN_REGISTRY[planCode] !== plan) {
      return next(forbidden(`Plan ${planCode} not permitted`));
    }
    next();
  };
}


// DEPRECATED: All entitlement/limit checks must go through recordUsage() in usage-meter.ts
// This function is now a stub and will always call next().
export function requireLimit(_limitKey: LimitKey, _opts = {}) {
  return (_req: AuthedRequest, _res: Response, next: NextFunction) => {
    // Governance: All limit checks must use recordUsage()
    next();
  };
}

// Deprecated: requireEntitlementLimit (for migration only)
/**
 * @deprecated Use requireLimit with canonical registry instead
 */
export const requireEntitlementLimit = requireLimit;
// C) consumeEntitlement(limitKey, { cost, meta })
interface EntitlementMeta {
  audit?: boolean;
  feature?: string;
  route?: string;
  [key: string]: unknown;
}
// DEPRECATED: All entitlement consumption must go through recordUsage() in usage-meter.ts
// This function is now a stub and will always call next().
export function consumeEntitlement(_limitKey: LimitKey, _opts: { cost?: number; meta?: EntitlementMeta } = {}) {
  return (_req: AuthedRequest, _res: Response, next: NextFunction) => {
    // Governance: All usage metering must use recordUsage()
    next();
  };
}
