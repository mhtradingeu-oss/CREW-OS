import type { NextFunction, Response, Request } from "express";
import { ApiError } from "../errors.js";
import type { PlanFeatureSet } from "../../plans.js";
import type { FeatureKey } from "../../security/feature-registry.js";
import { FEATURES } from "../../security/feature-registry.js";
import { getPermissionsForRole } from "../../security/rbac.js";
import { resolvePlanContext } from "../../plans-resolver.js";

async function ensurePlanContext(req: Request) {
  if (req.planContext) return req.planContext;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const tenantId =
    req.user?.tenantId ?? (typeof req.query?.tenantId === "string" ? req.query.tenantId : undefined);
  const brandId =
    req.user?.brandId ??
    (typeof req.query?.brandId === "string" ? req.query.brandId : undefined) ??
    (typeof body.brandId === "string" ? body.brandId : undefined);

  req.planContext = await resolvePlanContext({ tenantId, brandId });
  return req.planContext;
}

export async function attachPlanContext(req: Request, _res: Response, next: NextFunction) {
  try {
    await ensurePlanContext(req);
    next();
  } catch (err) {
    next(err);
  }
}


function isFeatureEnabled(features: PlanFeatureSet, featureKey: FeatureKey): boolean {
  const value = features[featureKey as keyof PlanFeatureSet];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value !== "none";
  return Boolean(value);
}


/**
 * Governance-enforced feature gating middleware
 * @param featureObj - Canonical feature object from registry
 */
export function requireFeature(featureObj: typeof FEATURES[keyof typeof FEATURES], message?: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const context = await ensurePlanContext(req);
      // Canonical plan enforcement using subscription resolver
      const { planCode } = require("../billing/subscription-resolver.js").resolveSubscriptionState(req);
      if (!(featureObj.plans as readonly string[]).includes(planCode)) {
        return next(
          new ApiError(
            403,
            message ?? `Feature ${featureObj.key} is not enabled for plan ${planCode}.`,
            { feature: featureObj.key, planCode },
            "FEATURE_NOT_ENABLED",
          ),
        );
      }
      // Feature enabled check
      if (!isFeatureEnabled(context.features, featureObj.key)) {
        return next(
          new ApiError(
            403,
            message ?? `Feature ${featureObj.key} is not enabled for plan ${context.planKey}.`,
            { feature: featureObj.key, planKey: context.planKey, planName: context.planName, source: context.source },
            "FEATURE_NOT_ENABLED",
          ),
        );
      }
      // Permission check
      if (featureObj.permissions && req.user?.role) {
        const userPermissions = await getPermissionsForRole(req.user.role);
        const missing = featureObj.permissions.filter((p) => !userPermissions.includes(p));
        if (missing.length) {
          return next(
            new ApiError(
              403,
              `Missing permissions for feature ${featureObj.key}: ${missing.join(", ")}`,
              { feature: featureObj.key, missingPermissions: missing },
              "FEATURE_PERMISSION_DENIED",
            ),
          );
        }
      }
      // Audit event (if enabled)
      if (featureObj.audit) {
        // TODO: Emit audit event here (e.g., eventBus.publish)
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

export const requirePlanFeature = requireFeature;
