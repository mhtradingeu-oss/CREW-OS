import type { Request, Response, NextFunction } from "express";
import { badRequest, notFound } from "../../core/http/errors.js";
import { requireParam } from "../../core/http/params.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import { dealersService } from "./dealers.service.js";
import type { PartnerListParams, DealerKpiListParams } from "./dealers.types.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { parsePagination } from "../../core/http/pagination.js";
import { dealerAiInsightSchema } from "./dealers.validators.js";
import { runAIPipeline } from "../../core/ai/pipeline/pipeline-runner.js";
import { getUserPermissions } from "../../core/security/rbac.js";
import { PERMISSIONS } from "../../core/security/permission-registry.js";
import { safeTruncate } from "../../core/ai/pipeline/pipeline-utils.js";
import { createInsight } from "../../core/db/repositories/ai-insight.repository.js";

function buildDealerContext(req: Request, requestedBrandId?: string) {
  const brandId = resolveScopedBrandId(
    { brandId: req.user?.brandId, role: req.user?.role },
    requestedBrandId,
  );
  return {
    brandId,
    actorUserId: req.user?.id,
  };
}

function buildListParams(req: Request): PartnerListParams {
  const context = buildDealerContext(req, req.query.brandId as string | undefined);
  if (!context.brandId) {
    throw badRequest("brandId query parameter is required");
  }
  const { page, pageSize } = parsePagination(req.query);
  return {
    brandId: context.brandId,
    search: req.query.search as string | undefined,
    active:
      typeof req.query.active === "string"
        ? req.query.active.toLowerCase() === "true"
        : undefined,
    tierId: req.query.tierId as string | undefined,
    page,
    pageSize,
  };
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const params = buildListParams(req);
    const payload = await dealersService.listPartners(params);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const context = buildDealerContext(req, req.query.brandId as string | undefined);
    if (!context.brandId) {
      throw badRequest("brandId query parameter is required");
    }
    const id = requireParam(req.params.id, "id");
    const item = await dealersService.getPartnerById(id, context.brandId);
    if (!item) {
      return next(notFound("Partner not found"));
    }
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await dealersService.createPartner(req.body);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const context = buildDealerContext(req, req.query.brandId as string | undefined);
    if (!context.brandId) {
      throw badRequest("brandId query parameter is required");
    }
    const id = requireParam(req.params.id, "id");
    const item = await dealersService.updatePartner(id, context.brandId, req.body);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const context = buildDealerContext(req, req.query.brandId as string | undefined);
    if (!context.brandId) {
      throw badRequest("brandId query parameter is required");
    }
    const id = requireParam(req.params.id, "id");
    await dealersService.deactivatePartner(id, context.brandId);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listKpis(req: Request, res: Response, next: NextFunction) {
  try {
    const context = buildDealerContext(req, req.query.brandId as string | undefined);
    if (!context.brandId) {
      throw badRequest("brandId query parameter is required");
    }
    const params: DealerKpiListParams = {
      brandId: context.brandId,
      ...parsePagination(req.query),
    };
    const payload = await dealersService.listDealerKpis(params);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function aiInsights(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = dealerAiInsightSchema.parse(req.body);
    const brandId = parsed.brandId;
    const permissions = req.user?.id ? await getUserPermissions(req.user.id) : [];
    const actorPermissions = Array.from(new Set([...permissions, PERMISSIONS.AI_CONTEXT.PARTNER]));

    const pipeline = await runAIPipeline({
      agentId: "partner-ops",
      task: {
        prompt: parsed.topic ?? "Dealer insights (advisor mode)",
        input: {
          partnerId: parsed.partnerId,
          brandId,
          action: "advisor-insight",
        },
      },
      actor: {
        userId: req.user?.id,
        role: req.user?.role,
        permissions: actorPermissions,
        brandId,
        tenantId: req.user?.tenantId,
      },
      brandId,
      tenantId: req.user?.tenantId ?? undefined,
    });

    if (!pipeline.success) {
      return next(badRequest("AI pipeline failed", { status: pipeline.status, errors: pipeline.errors }));
    }

    const summary = typeof pipeline.output === "object" && pipeline.output && "summary" in (pipeline.output as Record<string, unknown>)
      ? String((pipeline.output as Record<string, unknown>).summary ?? "Dealer insight")
      : "Dealer insight";

    const insight = await createInsight({
      brandId,
      os: "dealer",
      entityType: "AI_RECOMMENDATION",
      entityId: parsed.partnerId,
      summary,
      details: safeTruncate({ output: pipeline.output, runId: pipeline.runId }, 4000),
    });

    respondWithSuccess(res, {
      output: pipeline.output,
      runId: pipeline.runId,
      autonomy: pipeline.autonomyDecision,
      insightId: insight.id,
      status: pipeline.status ?? (pipeline.autonomyDecision?.requireApproval ? "pending_approval" : "ok"),
    });
  } catch (err) {
    next(err);
  }
}

export async function getKpi(req: Request, res: Response, next: NextFunction) {
  try {
    const context = buildDealerContext(req, req.query.brandId as string | undefined);
    if (!context.brandId) {
      throw badRequest("brandId query parameter is required");
    }
    const id = requireParam(req.params.id, "id");
    const payload = await dealersService.getDealerKpi(id, context.brandId);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function dashboardSummary(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const context = buildDealerContext(req, req.query.brandId as string | undefined);
    if (!context.brandId) {
      throw badRequest("brandId query parameter is required");
    }
    const summary = await dealersService.getDashboardSummary(context.brandId);
    respondWithSuccess(res, { data: summary });
  } catch (err) {
    next(err);
  }
}

export async function recalculateKpi(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const context = buildDealerContext(req, req.query.brandId as string | undefined);
    if (!context.brandId) {
      throw badRequest("brandId query parameter is required");
    }
    const id = requireParam(req.params.id, "id");
    const payload = await dealersService.recalculateDealerKpi(id, context.brandId);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}
