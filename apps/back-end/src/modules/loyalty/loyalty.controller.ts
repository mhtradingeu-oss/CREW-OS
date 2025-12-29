import type { Request, Response, NextFunction } from "express";
import { badRequest } from "../../core/http/errors.js";
import { parsePagination } from "../../core/http/pagination.js";
import { requireParam } from "../../core/http/params.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { loyaltyService } from "./loyalty.service.js";
import {
  createLoyaltySchema,
  updateLoyaltySchema,
  createProgramSchema,
  createTierSchema,
  createRewardSchema,
  redeemRewardSchema,
  loyaltyAiInsightSchema,
} from "./loyalty.validators.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { runAIPipeline } from "../../core/ai/pipeline/pipeline-runner.js";
import { getUserPermissions } from "../../core/security/rbac.js";
import { safeTruncate } from "../../core/ai/pipeline/pipeline-utils.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const result = await loyaltyService.list({
      brandId: req.query.brandId as string | undefined,
      programId: req.query.programId as string | undefined,
      page,
      pageSize,
    });
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const item = await loyaltyService.getById(id);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createLoyaltySchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const item = await loyaltyService.create(parsed.data);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateLoyaltySchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const id = requireParam(req.params.id, "id");
    const item = await loyaltyService.update(id, parsed.data);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    await loyaltyService.remove(id);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listPrograms(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const context = buildLoyaltyContext(req, req.query.brandId as string | undefined);
    const pagination = parsePagination(req.query);
    const programs = await loyaltyService.listPrograms(context, pagination);
    respondWithSuccess(res, programs);
  } catch (err) {
    next(err);
  }
}

export async function createProgram(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createProgramSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const context = buildLoyaltyContext(req, parsed.data.brandId);
    const program = await loyaltyService.createProgram(parsed.data, context);
    respondWithSuccess(res, program, 201);
  } catch (err) {
    next(err);
  }
}

export async function listProgramTiers(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const programId = requireParam(req.params.programId, "programId");
    const context = buildLoyaltyContext(req);
    const pagination = parsePagination(req.query);
    const tiers = await loyaltyService.listTiers(programId, context, pagination);
    respondWithSuccess(res, tiers);
  } catch (err) {
    next(err);
  }
}

export async function createProgramTier(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const programId = requireParam(req.params.programId, "programId");
    const parsed = createTierSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const context = buildLoyaltyContext(req);
    const tier = await loyaltyService.createTier(programId, parsed.data, context);
    respondWithSuccess(res, tier, 201);
  } catch (err) {
    next(err);
  }
}

export async function listProgramRewards(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const programId = requireParam(req.params.programId, "programId");
    const context = buildLoyaltyContext(req);
    const pagination = parsePagination(req.query);
    const rewards = await loyaltyService.listRewards(programId, context, pagination);
    respondWithSuccess(res, rewards);
  } catch (err) {
    next(err);
  }
}

export async function createProgramReward(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const programId = requireParam(req.params.programId, "programId");
    const parsed = createRewardSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const context = buildLoyaltyContext(req);
    const reward = await loyaltyService.createReward(programId, parsed.data, context);
    respondWithSuccess(res, reward, 201);
  } catch (err) {
    next(err);
  }
}

export async function redeemReward(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const rewardId = requireParam(req.params.rewardId, "rewardId");
    const parsed = redeemRewardSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const context = buildLoyaltyContext(req);
    const result = await loyaltyService.redeemReward(rewardId, parsed.data, context);
    respondWithSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function dashboardSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const context = buildLoyaltyContext(req, req.query.brandId as string | undefined);
    if (!context.brandId) {
      return next(badRequest("brandId is required"));
    }
    const summary = await loyaltyService.dashboardSummary(context.brandId);
    respondWithSuccess(res, { data: summary });
  } catch (err) {
    next(err);
  }
}

export async function aiInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = loyaltyAiInsightSchema.parse(req.body);
    const { brandId, loyaltyCustomerId } = parsed;

    const permissions = req.user?.id ? await getUserPermissions(req.user.id) : [];
    const actorPermissions = Array.from(new Set([...permissions, "ai:context:loyalty"]));

    const pipeline = await runAIPipeline({
      agentId: "loyalty-analyst",
      task: {
        prompt: parsed.topic ?? "Loyalty customer insights (advisor mode)",
        input: {
          loyaltyCustomerId,
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
      ? String((pipeline.output as Record<string, unknown>).summary ?? "Loyalty insight")
      : "Loyalty insight";

    const insight = await loyaltyService.createAIInsight({
      brandId,
      os: "loyalty",
      entityType: "AI_RECOMMENDATION",
      entityId: loyaltyCustomerId,
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

function buildLoyaltyContext(req: AuthenticatedRequest, requestedBrandId?: string) {
  const brandId = resolveScopedBrandId(
    { brandId: req.user?.brandId, role: req.user?.role },
    requestedBrandId,
  );
  return {
    brandId,
    actorUserId: req.user?.id,
  };
}
