import type { Response, NextFunction } from "express";
import { badRequest } from "../../core/http/errors.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { requireParam } from "../../core/http/params.js";
import { pricingService } from "./pricing.service.js";
import {
  competitorPriceSchema,
  createPricingDraftSchema,
  createPricingSchema,
  listPricingSchema,
  pricingDraftApprovalSchema,
  pricingSuggestionSchema,
  updatePricingSchema,
  pricingDraftRejectionSchema,
} from "./pricing.validators.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { getUserPermissions } from "../../core/security/rbac.js";
import { publishActivity } from "../../core/activity/activity.js";
import { parsePagination } from "../../core/http/pagination.js";
import { runAIPipeline } from "../../core/ai/pipeline/pipeline-runner.js";

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = listPricingSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const { page, pageSize } = parsePagination(req.query);
    const actionContext = buildPricingContext(req);
    const result = await pricingService.list({ ...parsed.data, page, pageSize }, actionContext);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const actionContext = buildPricingContext(req);
    const item = await pricingService.getById(id, actionContext);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createPricingSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const actionContext = buildPricingContext(req, parsed.data.brandId);
    const item = await pricingService.create(parsed.data, actionContext);
    await publishActivity("pricing", "created", {
      entityType: "pricing",
      entityId: item.id,
      metadata: { productId: item.productId },
    }, actionContext);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const parsed = updatePricingSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const actionContext = buildPricingContext(req);
    const item = await pricingService.update(id, parsed.data, actionContext);
    await publishActivity("pricing", "updated", {
      entityType: "pricing",
      entityId: item.id,
      metadata: { productId: item.productId },
    }, actionContext);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const actionContext = buildPricingContext(req);
    const result = await pricingService.remove(id, actionContext);
    await publishActivity(
      "pricing",
      "deleted",
      {
        entityType: "pricing",
        entityId: id,
        metadata: { id: result?.id },
      },
      actionContext,
    );
    respondWithSuccess(res, { deleted: true, id: result?.id ?? id });
  } catch (err) {
    next(err);
  }
}

export async function createDraft(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createPricingDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const productId = requireParam(req.params.productId, "productId");
    const actionContext = buildPricingContext(req);
    const draft = await pricingService.createDraft(productId, parsed.data, actionContext);
    await publishActivity("pricing", "draft_created", {
      entityType: "pricing-draft",
      entityId: draft.id,
      metadata: { productId: draft.productId, status: draft.status },
    }, actionContext);
    respondWithSuccess(res, draft, 201);
  } catch (err) {
    next(err);
  }
}

export async function listDrafts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const productId = requireParam(req.params.productId, "productId");
    const actionContext = buildPricingContext(req);
    const { page, pageSize } = parsePagination(req.query);
    const drafts = await pricingService.listDrafts(productId, { page, pageSize }, actionContext);
    respondWithSuccess(res, drafts);
  } catch (err) {
    next(err);
  }
}

export async function submitDraft(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const actionContext = buildPricingContext(req);
    const draft = await pricingService.submitDraftForApproval(
      requireParam(req.params.productId, "productId"),
      requireParam(req.params.draftId, "draftId"),
      actionContext,
    );
    await publishActivity("pricing", "draft_submitted", {
      entityType: "pricing-draft",
      entityId: draft.id,
      metadata: { productId: draft.productId, status: draft.status },
    }, actionContext);
    respondWithSuccess(res, draft);
  } catch (err) {
    next(err);
  }
}

export async function rejectDraft(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = pricingDraftRejectionSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const actionContext = buildPricingContext(req);
    const draft = await pricingService.rejectDraft(
      requireParam(req.params.productId, "productId"),
      requireParam(req.params.draftId, "draftId"),
      parsed.data.reason,
      actionContext,
    );
    await publishActivity("pricing", "draft_rejected", {
      entityType: "pricing-draft",
      entityId: draft.id,
      metadata: { productId: draft.productId, status: draft.status, reason: parsed.data.reason },
    }, actionContext);
    respondWithSuccess(res, draft);
  } catch (err) {
    next(err);
  }
}

export async function addCompetitorPrice(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = competitorPriceSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const productId = requireParam(req.params.productId, "productId");
    const actionContext = buildPricingContext(req, parsed.data.brandId as string | undefined);
    const competitorPrice = await pricingService.addCompetitorPrice(
      productId,
      parsed.data,
      actionContext,
    );
    await publishActivity("pricing", "competitor_price_added", {
      entityType: "competitor-price",
      entityId: competitorPrice.id,
      metadata: {
        productId: competitorPrice.productId,
        competitor: competitorPrice.competitor,
        marketplace: competitorPrice.marketplace,
      },
    }, actionContext);
    respondWithSuccess(res, competitorPrice, 201);
  } catch (err) {
    next(err);
  }
}

export async function listCompetitorPrices(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const productId = requireParam(req.params.productId, "productId");
    const actionContext = buildPricingContext(req);
    const { page, pageSize } = parsePagination(req.query);
    const competitors = await pricingService.listCompetitorPrices(productId, { page, pageSize }, actionContext);
    respondWithSuccess(res, competitors);
  } catch (err) {
    next(err);
  }
}

export async function listLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const productId = requireParam(req.params.productId, "productId");
    const actionContext = buildPricingContext(req);
    const { page, pageSize } = parsePagination(req.query);
    const logs = await pricingService.listLogs(productId, { page, pageSize }, actionContext);
    respondWithSuccess(res, logs);
  } catch (err) {
    next(err);
  }
}

export async function suggestPrice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = pricingSuggestionSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const productId = requireParam(req.params.productId, "productId");
    const actionContext = buildPricingContext(req);
    const suggestion = await pricingService.generateAISuggestion(productId, parsed.data, actionContext);
    await publishActivity("pricing", "ai_suggested", {
      entityType: "pricing-ai-suggestion",
      entityId: productId,
      metadata: { strategy: parsed.data.strategy },
    }, { ...actionContext, source: "ai" });
    respondWithSuccess(res, suggestion);
  } catch (err) {
    next(err);
  }
}

export async function aiPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = pricingSuggestionSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const productId = requireParam(req.params.productId, "productId");
    const actionContext = buildPricingContext(req);
    const brandId = actionContext.brandId;
    const permissions = req.user?.id ? await getUserPermissions(req.user.id) : [];
    const actorPermissions = Array.from(new Set([...permissions, "ai:context:pricing"]));
    const actionLabel = parsed.data.requireApproval === false ? "execute-pricing" : "recommend-pricing";
    const pipeline = await runAIPipeline({
      agentId: "pricing-strategist",
      task: {
        prompt: `Pricing plan request for product ${productId} (strategy=${parsed.data.strategy ?? "standard"}).`,
        input: {
          productId,
          brandId,
          strategy: parsed.data.strategy,
          action: actionLabel,
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

    const planSummary = `AI plan ${pipeline.status ?? "ok"}`;
    await pricingService.recordAIPlanResult(
      productId,
      brandId,
      planSummary,
      pipeline.output ?? pipeline,
      actionContext,
    );

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

export async function approveDraft(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = pricingDraftApprovalSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const actionContext = buildPricingContext(req);
    const draft = await pricingService.approveDraft(
      requireParam(req.params.productId, "productId"),
      requireParam(req.params.draftId, "draftId"),
      parsed.data.approvedById,
      actionContext,
    );
    await publishActivity("pricing", "draft_approved", {
      entityType: "pricing-draft",
      entityId: draft.id,
      metadata: { productId: draft.productId, status: draft.status, approvedById: parsed.data.approvedById },
    }, actionContext);
    respondWithSuccess(res, draft);
  } catch (err) {
    next(err);
  }
}

function buildPricingContext(req: AuthenticatedRequest, requestedBrandId?: string) {
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
