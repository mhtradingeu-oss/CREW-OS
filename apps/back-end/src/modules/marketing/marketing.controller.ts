import type { Response, NextFunction } from "express";
import { badRequest } from "../../core/http/errors.js";
import { requireParam } from "../../core/http/params.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { marketingService, marketingAIService } from "./marketing.service.js";
import {
  campaignAttributionSchema,
  campaignInteractionSchema,
  createMarketingSchema,
  marketingIdeaSchema,
  updateMarketingSchema,
} from "./marketing.validators.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { parsePagination } from "../../core/http/pagination.js";
import { runAIPipeline } from "../../core/ai/pipeline/pipeline-runner.js";
import { getUserPermissions } from "../../core/security/rbac.js";

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const params = {
      brandId: req.query.brandId as string | undefined,
      status: req.query.status as string | undefined,
      ...parsePagination(req.query),
    };
    const scopedBrandId = resolveScopedBrandId(
      { brandId: req.user?.brandId, role: req.user?.role },
      params.brandId,
    );
    const actionContext = { brandId: scopedBrandId, actorUserId: req.user?.id };
    const items = await marketingService.list({ ...params, brandId: scopedBrandId }, actionContext);
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const actionContext = buildMarketingContext(req);
    const item = await marketingService.getById(id, actionContext);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createMarketingSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const actionContext = buildMarketingContext(req, parsed.data.brandId);
    const item = await marketingService.create(parsed.data, actionContext);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = updateMarketingSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const id = requireParam(req.params.id, "id");
    const actionContext = buildMarketingContext(req, parsed.data.brandId);
    const item = await marketingService.update(id, parsed.data, actionContext);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const actionContext = buildMarketingContext(req);
    const result = await marketingService.remove(id, actionContext);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function generateContent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const context = buildMarketingContext(req, (req.body as { brandId?: string }).brandId);
    const payload = { ...req.body, brandId: context.brandId, tenantId: req.user?.tenantId };
    const result = await marketingAIService.generate(payload);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function generateSeo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const context = buildMarketingContext(req, (req.body as { brandId?: string }).brandId);
    const payload = { ...req.body, brandId: context.brandId, tenantId: req.user?.tenantId };
    const result = await marketingAIService.seo(payload);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function generateCaptions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const context = buildMarketingContext(req, (req.body as { brandId?: string }).brandId);
    const payload = { ...req.body, brandId: context.brandId, tenantId: req.user?.tenantId };
    const result = await marketingAIService.captions(payload);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function generateIdeas(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = marketingIdeaSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }

    const brandId = resolveScopedBrandId(
      { brandId: req.user?.brandId, role: req.user?.role },
      parsed.data.brandId,
    );
    const permissions = req.user?.id ? await getUserPermissions(req.user.id) : [];
    const actorPermissions = Array.from(new Set([...permissions, "ai:context:marketing"]));
    const pipeline = await runAIPipeline({
      agentId: "campaign-engine",
      task: {
        prompt: `Generate campaign ideas for goal: ${parsed.data.goal}`,
        input: {
          brandId,
          goal: parsed.data.goal,
          channels: parsed.data.channels,
          audience: parsed.data.audience,
          action: "recommend-campaign",
        },
      },
      actor: {
        userId: req.user?.id,
        role: req.user?.role,
        permissions: actorPermissions,
        brandId,
        tenantId: req.user?.tenantId,
      },
      brandId: brandId ?? undefined,
      tenantId: req.user?.tenantId ?? undefined,
    });

    if (!pipeline.success) {
      return next(badRequest("AI pipeline failed", { status: pipeline.status, errors: pipeline.errors }));
    }

    respondWithSuccess(res, {
      output: pipeline.output,
      status: pipeline.status ?? (pipeline.autonomyDecision?.requireApproval ? "pending_approval" : "ok"),
      autonomy: pipeline.autonomyDecision,
      runId: pipeline.runId,
    });
  } catch (err) {
    next(err);
  }
}

export async function previewTargets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const campaignId = requireParam(req.params.id, "id");
    const rawLimit = Number(req.query.limit ?? 5);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 5;
    const actionContext = buildMarketingContext(req);
    const preview = await marketingService.previewCampaignTargets(campaignId, actionContext, limit);
    respondWithSuccess(res, preview);
  } catch (err) {
    next(err);
  }
}

export async function linkLeadToCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = campaignAttributionSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const campaignId = requireParam(req.params.id, "id");
    const actionContext = buildMarketingContext(req);
    const result = await marketingService.linkLeadToCampaign(campaignId, parsed.data, actionContext);
    respondWithSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function recordCampaignInteraction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = campaignInteractionSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const campaignId = requireParam(req.params.id, "id");
    const actionContext = buildMarketingContext(req);
    const result = await marketingService.recordCampaignInteraction(campaignId, parsed.data, actionContext);
    respondWithSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

function buildMarketingContext(req: AuthenticatedRequest, requestedBrandId?: string) {
  const brandId = resolveScopedBrandId(
    { brandId: req.user?.brandId, role: req.user?.role },
    requestedBrandId,
  );
  return {
    brandId,
    actorUserId: req.user?.id,
    tenantId: req.user?.tenantId,
  };
}
