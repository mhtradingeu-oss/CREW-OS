import type { Request, Response, NextFunction } from "express";
import { badRequest } from "../../core/http/errors.js";
import { respondWithSuccess } from "../../core/http/respond.js";

import type { MediaCallContext } from "../../core/ai/providers/media/media.types.js";
import { whiteLabelConfiguratorService } from "./white-label-configurator.service.js";
import { whiteLabelBatchSchema, whiteLabelProductMockupSchema } from "./white-label-configurator.validators.js";

function toCtx(req: Request): MediaCallContext {
  const typedReq = req as Request & { user?: { brandId?: string, tenantId?: string, id?: string } };
  return {
    brandId: typedReq.user?.brandId ?? undefined,
    tenantId: typedReq.user?.tenantId ?? undefined,
    userId: typedReq.user?.id,
    traceId: (req.headers["x-request-id"] as string | undefined) ?? undefined,
    namespace: "white-label",
  };
}

export async function preview(req: Request, res: Response, next: NextFunction) {
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

export async function batch(req: Request, res: Response, next: NextFunction) {
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
