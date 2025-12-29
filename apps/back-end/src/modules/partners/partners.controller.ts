import type { Request, Response, NextFunction } from "express";
import { requireParam } from "../../core/http/params.js";
import { badRequest } from "../../core/http/errors.js";
import { partnersService } from "./partners.service.js";
import {
  createPartnerContractSchema,
  createPartnerSchema,
  createPartnerUserSchema,
  listPartnerContractsSchema,
  listPartnerPricingSchema,
  listPartnersSchema,
  listPartnerUsersSchema,
  partnerStatsSchema,
  partnerAiInsightSchema,
  updatePartnerContractSchema,
  updatePartnerSchema,
  updatePartnerUserSchema,
  upsertPartnerPricingSchema,
} from "./partners.validators.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { runAIPipeline } from "../../core/ai/pipeline/pipeline-runner.js";
import { getUserPermissions, type AuthenticatedRequest } from "../../core/security/rbac.js";
import { createInsight } from "../../core/db/repositories/ai-insight.repository.js";
import { safeTruncate } from "../../core/ai/pipeline/pipeline-utils.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const params = listPartnersSchema.parse(req.query);
    const payload = await partnersService.list(params);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandId } = partnerStatsSchema.parse(req.query);
    const partnerId = requireParam(req.params.id, "id");
    const item = await partnersService.getById(partnerId, brandId);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = createPartnerSchema.parse(req.body);
    const item = await partnersService.create(payload);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandId } = partnerStatsSchema.parse(req.query);
    const payload = updatePartnerSchema.parse(req.body);
    const partnerId = requireParam(req.params.id, "id");
    const item = await partnersService.update(partnerId, brandId, payload);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandId } = partnerStatsSchema.parse(req.query);
    const partnerId = requireParam(req.params.id, "id");
    await partnersService.deactivate(partnerId, brandId);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function stats(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandId } = partnerStatsSchema.parse(req.query);
    const partnerId = requireParam(req.params.id, "id");
    const payload = await partnersService.getStats(partnerId, brandId);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function listContracts(req: Request, res: Response, next: NextFunction) {
  try {
    const params = listPartnerContractsSchema.parse(req.query);
    const payload = await partnersService.listPartnerContracts({
      partnerId: requireParam(req.params.id, "id"),
      ...params,
    });
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function getContract(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandId } = partnerStatsSchema.parse(req.query);
    const contractId = requireParam(req.params.contractId, "contractId");
    const partnerId = requireParam(req.params.id, "id");
    const payload = await partnersService.getPartnerContract(contractId, partnerId, brandId);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function aiInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = partnerAiInsightSchema.parse(req.body);
    const partnerId = parsed.partnerId;
    const brandId = parsed.brandId ?? req.user?.brandId ?? undefined;
    const permissions = req.user?.id ? await getUserPermissions(req.user.id) : [];
    const actorPermissions = Array.from(new Set([...permissions, "ai:context:partner"]));

    const pipeline = await runAIPipeline({
      agentId: "partner-ops",
      task: {
        prompt: parsed.topic ?? "Generate partner health insights (advisor mode)",
        input: {
          partnerId,
          brandId,
          action: "advisor-insight",
        },
      },
      actor: {
        userId: req.user?.id,
        role: req.user?.role,
        permissions: actorPermissions,
        brandId: brandId ?? undefined,
        tenantId: req.user?.tenantId,
      },
      brandId: brandId ?? undefined,
      tenantId: req.user?.tenantId ?? undefined,
    });

    if (!pipeline.success) {
      return next(badRequest("AI pipeline failed", { status: pipeline.status, errors: pipeline.errors }));
    }

    const summary = typeof pipeline.output === "object" && pipeline.output && "summary" in (pipeline.output as Record<string, unknown>)
      ? String((pipeline.output as Record<string, unknown>).summary ?? "Partner insight")
      : "Partner insight";

    const insight = await createInsight({
      brandId: brandId ?? null,
      os: "partner",
      entityType: "AI_RECOMMENDATION",
      entityId: partnerId,
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

export async function createContract(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = createPartnerContractSchema.parse(req.body);
    const result = await partnersService.createPartnerContract({
      partnerId: requireParam(req.params.id, "id"),
      ...payload,
    });
    respondWithSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateContract(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandId } = partnerStatsSchema.parse(req.query);
    const payload = updatePartnerContractSchema.parse(req.body);
    const result = await partnersService.updatePartnerContract(
      requireParam(req.params.contractId, "contractId"),
      requireParam(req.params.id, "id"),
      brandId,
      payload,
    );
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function removeContract(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandId } = partnerStatsSchema.parse(req.query);
    const contractId = requireParam(req.params.contractId, "contractId");
    const partnerId = requireParam(req.params.id, "id");
    await partnersService.removePartnerContract(contractId, partnerId, brandId);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listPricing(req: Request, res: Response, next: NextFunction) {
  try {
    const params = listPartnerPricingSchema.parse(req.query);
    const payload = await partnersService.listPartnerPricing({
      partnerId: requireParam(req.params.id, "id"),
      ...params,
    });
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function upsertPricing(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = upsertPartnerPricingSchema.parse(req.body);
    const result = await partnersService.upsertPartnerPricing({
      partnerId: requireParam(req.params.id, "id"),
      ...payload,
    });
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const params = listPartnerUsersSchema.parse(req.query);
    const payload = await partnersService.listPartnerUsers({
      ...params,
      partnerId: requireParam(req.params.id, "id"),
    });
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const partnerId = requireParam(req.params.id, "id");
    const { brandId } = partnerStatsSchema.parse(req.query);
    const params = createPartnerUserSchema.parse(req.body);
    const payload = await partnersService.createPartnerUser(partnerId, brandId, params);
    respondWithSuccess(res, payload, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const partnerId = requireParam(req.params.id, "id");
    const partnerUserId = requireParam(req.params.userId, "userId");
    const { brandId } = partnerStatsSchema.parse(req.query);
    const payload = updatePartnerUserSchema.parse(req.body);
    const result = await partnersService.updatePartnerUser(partnerId, brandId, partnerUserId, payload);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function deactivateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const partnerId = requireParam(req.params.id, "id");
    const partnerUserId = requireParam(req.params.userId, "userId");
    const { brandId } = partnerStatsSchema.parse(req.query);
    await partnersService.deactivatePartnerUser(partnerId, brandId, partnerUserId);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}
