import type { Response, NextFunction } from "express";
import { badRequest } from "../../core/http/errors.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import type { MediaCallContext } from "../../core/ai/providers/media/media.types.js";
import { mediaStudioService } from "./media-studio.service.js";
import {
  imageGenerationSchema,
  videoGenerationSchema,
  whiteLabelBatchSchema,
  whiteLabelPreviewSchema,
  whiteLabelProductMockupSchema,
  mediaIdeasSchema,
} from "./media-studio.validators.js";
import { runAIPipeline } from "../../core/ai/pipeline/pipeline-runner.js";
import { getUserPermissions } from "../../core/security/rbac.js";
import { safeTruncate } from "../../core/ai/pipeline/pipeline-utils.js";

function toCtx(req: AuthenticatedRequest): MediaCallContext {
  return {
    brandId: req.user?.brandId ?? undefined,
    tenantId: req.user?.tenantId ?? undefined,
    userId: req.user?.id,
    traceId: (req.headers["x-request-id"] as string | undefined) ?? undefined,
    namespace: "media",
  };
}

export async function listImageEngines(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const engines = mediaStudioService.listImageEngines();
    respondWithSuccess(res, engines);
  } catch (err) {
    next(err);
  }
}

export async function listVideoEngines(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const engines = mediaStudioService.listVideoEngines();
    respondWithSuccess(res, engines);
  } catch (err) {
    next(err);
  }
}

export async function generateImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = imageGenerationSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const result = await mediaStudioService.generateImage(parsed.data, toCtx(req));
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function generateVideo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = videoGenerationSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const result = await mediaStudioService.generateVideo(parsed.data, toCtx(req));
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function whiteLabelPreview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = whiteLabelPreviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const result = await mediaStudioService.whiteLabelPreview(parsed.data, toCtx(req));
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function whiteLabelBatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = whiteLabelBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const result = await mediaStudioService.whiteLabelBatch(parsed.data, toCtx(req));
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function whiteLabelProductMockup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = whiteLabelProductMockupSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const result = await mediaStudioService.productMockup(parsed.data, toCtx(req));
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function mediaIdeas(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = mediaIdeasSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }

    const { brandId, productId } = parsed.data;
    const permissions = req.user?.id ? await getUserPermissions(req.user.id) : [];
    const actorPermissions = Array.from(
      new Set([
        ...permissions,
        "ai:context:media",
        "ai:context:brand",
        ...(productId ? ["ai:context:product"] : []),
      ]),
    );

    const pipeline = await runAIPipeline({
      agentId: "AI_MEDIA_CREATOR",
      task: {
        prompt: parsed.data.topic ?? "Generate on-brand media ideas (advisor mode)",
        input: {
          brandId,
          productId,
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
      ? String((pipeline.output as Record<string, unknown>).summary ?? "Media ideas")
      : "Media ideas";

    const insight = await mediaStudioService.recordMediaInsight({
      brandId,
      entityType: "AI_RECOMMENDATION",
      entityId: productId ?? brandId,
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
