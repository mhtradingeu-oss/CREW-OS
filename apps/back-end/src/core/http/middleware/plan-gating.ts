import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../http-types.js";
import { ApiError } from "../errors.js";
import type { PlanFeatureSet } from "../../plans.js";
import { resolvePlanContext } from "../../plans-resolver.js";

async function ensurePlanContext(req: AuthenticatedRequest) {
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

export async function attachPlanContext(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    await ensurePlanContext(req);
    next();
  } catch (err) {
    next(err);
  }
}

function isFeatureEnabled(features: PlanFeatureSet, feature: keyof PlanFeatureSet): boolean {
  const value = features[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value !== "none";
  return Boolean(value);
}

export function requireFeature(feature: keyof PlanFeatureSet, message?: string) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      const context = await ensurePlanContext(req);
      if (!isFeatureEnabled(context.features, feature)) {
        return next(
          new ApiError(
            403,
            message ?? `Feature ${String(feature)} is not enabled for plan ${context.planKey}.`,
            { feature, planKey: context.planKey, planName: context.planName, source: context.source },
            "FEATURE_NOT_ENABLED",
          ),
        );
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

export const requirePlanFeature = requireFeature;
