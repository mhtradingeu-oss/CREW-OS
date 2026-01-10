import type { Request, Response, NextFunction } from "express";
import { logFeatureUsage } from "../../feature-usage-telemetry.js";
import { logPlanAwareness } from "../../plan-awareness-logger.js";
import { FEATURES } from "../../security/feature-registry.js";

/**
 * Middleware to log feature usage and plan awareness for telemetry (fail-silent, async-safe)
 * Place immediately after requireFeature in any guarded route.
 * @param featureObj - Canonical feature object from registry
 */
export function featureTelemetry(featureObj: typeof FEATURES[keyof typeof FEATURES]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user || {};
    const tenantId = user.tenantId ?? null;
    const brandId = user.brandId ?? null;
    const partnerId = user.partnerId ?? null;
    const routePath = req.route?.path || req.originalUrl || req.path;
    // Fire-and-forget, fail-silent
    logFeatureUsage({ featureCode: featureObj.key, tenantId, brandId, partnerId, routePath }).catch(() => {});
    logPlanAwareness({ featureCode: featureObj.key, tenantId, brandId, partnerId, routePath }).catch(() => {});
    next();
  };
}
