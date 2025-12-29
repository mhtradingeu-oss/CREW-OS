import type { Request, Response, NextFunction } from "express";
import { respondWithSuccess } from "../../core/http/respond.js";
import { requireParam } from "../../core/http/params.js";
import { ai_brainService, aiBrainInsightsService } from "./ai-brain.service.js";
import { aiOrchestrator } from "../../core/ai/orchestrator.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { publishActivity } from "../../core/activity/activity.js";
import {
  listInsightsSchema,
  createInsightSchema,
  listReportsSchema,
  createReportSchema,
  listLearningSchema,
  createLearningSchema,
  createAiBrainSchema,
} from "./ai-brain.validators.js";

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const rawBrandId = req.query.brandId as string | undefined;
    const includeAnalysis = (req.query.includeAnalysis as string | undefined) === "true";
    const scopedBrandId = resolveScopedBrandId(
      { brandId: req.user?.brandId, role: req.user?.role, tenantId: req.user?.tenantId },
      rawBrandId,
    );
    const items = await ai_brainService.list({
      brandId: scopedBrandId,
      includeAnalysis,
    });
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const item = await ai_brainService.getById(id);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const payload = createAiBrainSchema.parse(req.body);
    const scopedBrandId = resolveScopedBrandId(
      { brandId: req.user?.brandId, role: req.user?.role, tenantId: req.user?.tenantId },
      payload.brandId,
    );
    const item = await ai_brainService.create({
      ...payload,
      brandId: scopedBrandId ?? payload.brandId,
    });
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const item = await ai_brainService.update(id, req.body);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    await ai_brainService.remove(id);
    respondWithSuccess(res, { id });
  } catch (err) {
    next(err);
  }
}

export async function insights(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await aiBrainInsightsService.summarize({
      brandName: req.body.brandName ?? "Brand",
      highlights: req.body.highlights ?? "No highlights",
      brandId: (req.body as { brandId?: string }).brandId,
      tenantId: (req as { user?: { tenantId?: string } }).user?.tenantId,
    });
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function assistantChat(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await aiOrchestrator.assistantChat({
      message: req.body.message,
      brandId: req.body.brandId,
    });
    respondWithSuccess(res, result.result ?? result);
  } catch (err) {
    next(err);
  }
}

export async function listInsights(req: Request, res: Response, next: NextFunction) {
  try {
    const params = listInsightsSchema.parse(req.query);
    const payload = await aiBrainInsightsService.listInsights(params);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function createInsight(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const payload = createInsightSchema.parse(req.body);
    const insight = await aiBrainInsightsService.createInsight(payload);
    await publishActivity(
      "ai-brain",
      "insight_created",
      {
        entityType: "ai-insight",
        entityId: insight.id,
        metadata: { brandId: insight.brandId, summary: insight.summary },
      },
      {
        actorUserId: req.user?.id,
        brandId: req.user?.brandId ?? insight.brandId ?? undefined,
        tenantId: req.user?.tenantId,
        role: req.user?.role,
        source: "api",
      },
    );
    respondWithSuccess(res, insight, 201);
  } catch (err) {
    next(err);
  }
}

export async function listReports(req: Request, res: Response, next: NextFunction) {
  try {
    const params = listReportsSchema.parse(req.query);
    const payload = await aiBrainInsightsService.listReports(params);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function createReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const payload = createReportSchema.parse(req.body);
    const report = await aiBrainInsightsService.createReport(payload);
    await publishActivity(
      "ai-brain",
      "report_created",
      {
        entityType: "ai-report",
        entityId: report.id,
        metadata: { brandId: report.brandId, title: report.title },
      },
      {
        actorUserId: req.user?.id,
        brandId: req.user?.brandId ?? report.brandId ?? undefined,
        tenantId: req.user?.tenantId,
        role: req.user?.role,
        source: "api",
      },
    );
    respondWithSuccess(res, report, 201);
  } catch (err) {
    next(err);
  }
}

export async function listLearning(req: Request, res: Response, next: NextFunction) {
  try {
    const params = listLearningSchema.parse(req.query);
    const payload = await aiBrainInsightsService.listLearningLogs(params);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function createLearning(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const payload = createLearningSchema.parse(req.body);
    const log = await aiBrainInsightsService.createLearningLog(payload);
    await publishActivity(
      "ai-brain",
      "learning_logged",
      {
        entityType: "ai-learning",
        entityId: log.id,
        metadata: { brandId: log.brandId, eventType: log.eventType, source: log.source },
      },
      {
        actorUserId: req.user?.id,
        brandId: req.user?.brandId ?? log.brandId ?? undefined,
        tenantId: req.user?.tenantId,
        role: req.user?.role,
        source: "api",
      },
    );
    respondWithSuccess(res, log, 201);
  } catch (err) {
    next(err);
  }
}
