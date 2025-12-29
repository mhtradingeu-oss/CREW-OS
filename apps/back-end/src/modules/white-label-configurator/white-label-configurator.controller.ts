import type { Response, NextFunction } from "express";
import { badRequest } from "../../core/http/errors.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import type { MediaCallContext } from "../../core/ai/providers/media/media.types.js";
import { whiteLabelConfiguratorService } from "./white-label-configurator.service.js";
import { whiteLabelBatchSchema, whiteLabelProductMockupSchema } from "./white-label-configurator.validators.js";

function toCtx(req: AuthenticatedRequest): MediaCallContext {
  return {
    brandId: req.user?.brandId ?? undefined,
    tenantId: req.user?.tenantId ?? undefined,
    userId: req.user?.id,
    traceId: (req.headers["x-request-id"] as string | undefined) ?? undefined,
    namespace: "white-label",
  };
}

export async function preview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = whiteLabelProductMockupSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const result = await whiteLabelConfiguratorService.preview(parsed.data, toCtx(req));
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function batch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = whiteLabelBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const result = await whiteLabelConfiguratorService.batch(parsed.data, toCtx(req));
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
