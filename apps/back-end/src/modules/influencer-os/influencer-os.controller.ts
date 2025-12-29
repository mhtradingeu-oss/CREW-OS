import type { Response, NextFunction } from "express";
import { badRequest } from "../../core/http/errors.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import { parsePagination } from "../../core/http/pagination.js";
import {
  campaignLinkListSchema,
  campaignLinkSchema,
  discoverSchema,
  negotiationListSchema,
  negotiationSchema,
  recommendSchema,
  scoresQuerySchema,
} from "./influencer-os.validators.js";
import { influencerOSService } from "./influencer-os.service.js";

export async function discover(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = discoverSchema.safeParse(req.body);
    if (!parsed.success) return next(badRequest("Validation error", parsed.error.flatten()));
    const context = buildContext(req, parsed.data.brandId);
    const payload = { ...parsed.data, brandId: context.brandId };
    const result = await influencerOSService.discover(payload, context);
    respondWithSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function listScores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = scoresQuerySchema.safeParse({ ...req.query, ...parsePagination(req.query) });
    if (!parsed.success) return next(badRequest("Validation error", parsed.error.flatten()));
    const context = buildContext(req, parsed.data.brandId);
    const result = await influencerOSService.listScores({ ...parsed.data, brandId: context.brandId }, context);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function recommend(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = recommendSchema.safeParse(req.body);
    if (!parsed.success) return next(badRequest("Validation error", parsed.error.flatten()));
    const context = buildContext(req, parsed.data.brandId);
    const result = await influencerOSService.recommend({ ...parsed.data, brandId: context.brandId }, context);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function createNegotiation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = negotiationSchema.safeParse(req.body);
    if (!parsed.success) return next(badRequest("Validation error", parsed.error.flatten()));
    const context = buildContext(req, parsed.data.brandId);
    const result = await influencerOSService.createNegotiation({ ...parsed.data, brandId: context.brandId }, context);
    respondWithSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function listNegotiations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = negotiationListSchema.safeParse({ ...req.query, ...parsePagination(req.query) });
    if (!parsed.success) return next(badRequest("Validation error", parsed.error.flatten()));
    const context = buildContext(req, parsed.data.brandId);
    const result = await influencerOSService.listNegotiations({ ...parsed.data, brandId: context.brandId }, context);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function createCampaignLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = campaignLinkSchema.safeParse(req.body);
    if (!parsed.success) return next(badRequest("Validation error", parsed.error.flatten()));
    const context = buildContext(req, parsed.data.brandId);
    const result = await influencerOSService.createCampaignLink(
      { ...parsed.data, brandId: context.brandId },
      context,
    );
    respondWithSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function listCampaignLinks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = campaignLinkListSchema.safeParse({ ...req.query, ...parsePagination(req.query) });
    if (!parsed.success) return next(badRequest("Validation error", parsed.error.flatten()));
    const context = buildContext(req, parsed.data.brandId);
    const result = await influencerOSService.listCampaignLinks({ ...parsed.data, brandId: context.brandId }, context);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

function buildContext(req: AuthenticatedRequest, requestedBrandId?: string) {
  const brandId = resolveScopedBrandId({ brandId: req.user?.brandId, role: req.user?.role }, requestedBrandId);
  return { brandId, actorUserId: req.user?.id, tenantId: req.user?.tenantId };
}
