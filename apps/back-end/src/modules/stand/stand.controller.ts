import type { Request, Response, NextFunction } from "express";
import { badRequest, notFound } from "../../core/http/errors.js";
import { requireParam } from "../../core/http/params.js";
import { standService } from "./stand.service.js";
import type { StandPartnerListParams } from "./stand.types.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { standAiInsightSchema } from "./stand.validators.js";
import { runAIPipeline } from "../../core/ai/pipeline/pipeline-runner.js";
import { safeTruncate } from "../../core/ai/pipeline/pipeline-utils.js";
import { createInsight } from "../../core/db/repositories/ai-insight.repository.js";
import { getUserPermissions, type AuthenticatedRequest } from "../../core/security/rbac.js";

function buildListParams(req: Request): StandPartnerListParams {
  const brandId = req.query.brandId as string | undefined;
  if (!brandId) {
    throw badRequest("brandId query parameter is required");
  }
  return {
    brandId,
    search: req.query.search as string | undefined,
    status: req.query.status as string | undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  };
}

function requireBrandId(req: Request) {
  const brandId = req.query.brandId as string | undefined;
  if (!brandId) {
    throw badRequest("brandId query parameter is required");
  }
  return brandId;
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const params = buildListParams(req);
    const payload = await standService.listStandPartners(params);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = requireBrandId(req);
    const id = requireParam(req.params.id, "id");
    const item = await standService.getStandPartnerById(id, brandId);
    if (!item) {
      return next(notFound("Stand partner not found"));
    }
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await standService.createStandPartner(req.body);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = requireBrandId(req);
    const id = requireParam(req.params.id, "id");
    const item = await standService.updateStandPartner(id, brandId, req.body);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = requireBrandId(req);
    const id = requireParam(req.params.id, "id");
    await standService.deactivateStandPartner(id, brandId);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function dashboardSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = requireBrandId(req);
    const summary = await standService.getDashboardSummary(brandId);
    respondWithSuccess(res, { data: summary });
  } catch (err) {
    next(err);
  }
}

export async function aiInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = standAiInsightSchema.parse(req.body);
    const { standPartnerId, brandId } = parsed;

    const permissions = req.user?.id ? await getUserPermissions(req.user.id) : [];
    const actorPermissions = Array.from(new Set([...permissions, "ai:context:partner"]));

    const pipeline = await runAIPipeline({
      agentId: "partner-ops",
      task: {
        prompt: parsed.topic ?? "Stand partner insights (advisor mode)",
        input: {
          partnerId: standPartnerId,
          standPartnerId,
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
      ? String((pipeline.output as Record<string, unknown>).summary ?? "Stand insight")
      : "Stand insight";

    const insight = await createInsight({
      brandId,
      os: "stand",
      entityType: "AI_RECOMMENDATION",
      entityId: standPartnerId,
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
