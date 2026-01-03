import type { Request, Response, NextFunction } from "express";
import { logFeatureUsage } from "../../feature-usage-telemetry.js";
import { logPlanAwareness } from "../../plan-awareness-logger.js";

/**
 * Middleware to log feature usage and plan awareness for telemetry (fail-silent, async-safe)
 * Place immediately after requireFeature in any guarded route.
 * @param featureCode - The feature code string (must match requireFeature)
 */
export function featureTelemetry(featureCode: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // IDs from user context if present, else null
    const user = (req as any).user || {};
    const tenantId = user.tenantId ?? null;
    const brandId = user.brandId ?? null;
    // partnerId: try user.partnerId, else null (extend if needed)
    const partnerId = user.partnerId ?? null;
    // Route path for analytics
    const routePath = req.route?.path || req.originalUrl || req.path;
    // Fire-and-forget, fail-silent
    logFeatureUsage({ featureCode, tenantId, brandId, partnerId, routePath }).catch(() => {});
    logPlanAwareness({ featureCode, tenantId, brandId, partnerId, routePath }).catch(() => {});
    next();
  };
}
