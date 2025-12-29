import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import type { Response, NextFunction } from "express";
import { respondWithSuccess } from "../../core/http/respond.js";
import { onboardingService } from "./onboarding.service.js";

export async function startHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) return next();
    const profile = await onboardingService.startOnboarding(req.user.id);
    return respondWithSuccess(res, profile, 201);
  } catch (err) {
    return next(err);
  }
}

export async function personaHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) return next();
    const { persona } = req.body as { persona: string };
    const profile = await onboardingService.updatePersona(req.user.id, persona as any);
    return respondWithSuccess(res, profile);
  } catch (err) {
    return next(err);
  }
}

export async function planHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) return next();
    const { planKey, selectedModules } = req.body as { planKey: string; selectedModules?: Record<string, unknown> };
    const result = await onboardingService.selectPlan(req.user.id, {
      planKey: planKey as any,
      selectedModules: selectedModules as any,
    });
    return respondWithSuccess(res, result);
  } catch (err) {
    return next(err);
  }
}

export async function optionsHandler(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const options = onboardingService.getOnboardingOptions();
    return respondWithSuccess(res, options);
  } catch (err) {
    return next(err);
  }
}
