import type { Response, NextFunction } from "express";
import { badRequest } from "../../core/http/errors.js";
import { requireParam } from "../../core/http/params.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { crmService } from "./crm.service.js";
import {
  createCrmSchema,
  createSegmentSchema,
  convertLeadToContactSchema,
  convertLeadToCustomerSchema,
  crmFollowupSchema,
  crmScoreSchema,
  updateCrmSchema,
} from "./crm.validators.js";
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
      search: req.query.search as string | undefined,
      ...parsePagination(req.query),
    };
    const scopedBrandId = resolveScopedBrandId(
      { brandId: req.user?.brandId, role: req.user?.role },
      params.brandId,
    );
    const actionContext = {
      brandId: scopedBrandId,
      actorUserId: req.user?.id,
      tenantId: req.user?.tenantId,
    };
    const items = await crmService.list({ ...params, brandId: scopedBrandId }, actionContext);
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const actionContext = buildCrmContext(req);
    const item = await crmService.getById(id, actionContext);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createCrmSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const actionContext = buildCrmContext(req, parsed.data.brandId);
    const item = await crmService.create(parsed.data, actionContext);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = updateCrmSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const id = requireParam(req.params.id, "id");
    const actionContext = buildCrmContext(req, parsed.data.brandId);
    const item = await crmService.update(id, parsed.data, actionContext);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const actionContext = buildCrmContext(req);
    const result = await crmService.remove(id, actionContext);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function convertToContact(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = convertLeadToContactSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const id = requireParam(req.params.id, "id");
    const actionContext = buildCrmContext(req);
    const result = await crmService.convertLeadToContact(id, parsed.data, actionContext);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function convertToCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = convertLeadToCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const id = requireParam(req.params.id, "id");
    const actionContext = buildCrmContext(req);
    const result = await crmService.convertLeadToCustomer(id, parsed.data, actionContext);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function aiScore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = crmScoreSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const id = requireParam(req.params.id, "id");
    const actionContext = buildCrmContext(req);
    const result = await crmService.scoreLead(id, parsed.data.intent, actionContext);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function aiFollowup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = crmFollowupSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }

    const leadId = parsed.data.leadId;
    const brandId = resolveScopedBrandId(
      { brandId: req.user?.brandId, role: req.user?.role },
      parsed.data.brandId,
    );
    const permissions = req.user?.id ? await getUserPermissions(req.user.id) : [];
    const actorPermissions = Array.from(new Set([...permissions, "ai:context:crm"]));
    const pipeline = await runAIPipeline({
      agentId: "crm-coach",
      task: {
        prompt: parsed.data.goal ?? "Suggest next best actions",
        input: {
          leadId,
          brandId,
          action: "recommend-followup",
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

export async function listSegments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const requestedBrandId = req.query.brandId as string | undefined;
    const scopedBrandId = resolveScopedBrandId(
      { brandId: req.user?.brandId, role: req.user?.role },
      requestedBrandId,
    );
    const actionContext = {
      brandId: scopedBrandId,
      actorUserId: req.user?.id,
      tenantId: req.user?.tenantId,
    };
    const { page, pageSize } = parsePagination(req.query);
    const segments = await crmService.listSegments({ page, pageSize }, actionContext);
    respondWithSuccess(res, segments);
  } catch (err) {
    next(err);
  }
}

export async function createSegment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createSegmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const actionContext = buildCrmContext(req, parsed.data.brandId);
    const segment = await crmService.createSegment(parsed.data, actionContext);
    respondWithSuccess(res, segment, 201);
  } catch (err) {
    next(err);
  }
}

export async function getSegmentLeads(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.segmentId, "segmentId");
    const requestedBrandId = req.query.brandId as string | undefined;
    const scopedBrandId = resolveScopedBrandId(
      { brandId: req.user?.brandId, role: req.user?.role },
      requestedBrandId,
    );
    const actionContext = {
      brandId: scopedBrandId,
      actorUserId: req.user?.id,
    };
    const limitParam = Number(req.query.limit ?? 5);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 5;
    const result = await crmService.resolveSegmentLeads(
      id,
      { limit },
      actionContext,
    );
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

function buildCrmContext(req: AuthenticatedRequest, requestedBrandId?: string) {
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
