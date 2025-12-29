import type { NextFunction, Request, Response } from "express";
import { autonomyService } from "../../core/ai/autonomy/autonomy.service.js";
import { runAutonomyDetectors } from "../../core/ai/autonomy/autonomy.detectors.js";
import { planAutonomyTasks } from "../../core/ai/autonomy/autonomy.planner.js";
import { runAutonomyLoop } from "../../core/ai/autonomy/autonomy.loop.js";
import { requireParam } from "../../core/http/params.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import type { AuthenticatedRequest } from "../../core/http/http-types.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import { getUserPermissions } from "../../core/security/rbac.js";
import { forbidden } from "../../core/http/errors.js";
import {
  autonomyConfigSchema,
  pendingAutonomyQuerySchema,
  runAutonomyCycleSchema,
} from "./ai-autonomy.validators.js";

async function buildActor(req: AuthenticatedRequest) {
  const permissions = req.user?.id ? await getUserPermissions(req.user.id) : [];
  const brandId = resolveScopedBrandId(
    { brandId: req.user?.brandId, tenantId: req.user?.tenantId, role: req.user?.role },
    (req.body as { brandId?: string } | undefined)?.brandId,
  );

  return {
    userId: req.user?.id,
    role: req.user?.role,
    permissions,
    brandId: brandId ?? undefined,
    tenantId: req.user?.tenantId ?? undefined,
  };
}

export function status(_req: Request, res: Response, next: NextFunction) {
  try {
    respondWithSuccess(res, autonomyService.getStatus());
  } catch (err) {
    next(err);
  }
}

export async function pending(_req: Request, res: Response, next: NextFunction) {
  try {
    const filters = pendingAutonomyQuerySchema.parse(_req.query);
    const result = await autonomyService.getPending(filters);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function approve(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const taskId = requireParam(req.params.taskId, "taskId");
    const actor = await buildActor(req);
    const result = await autonomyService.approveTask(taskId, actor);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = requireParam(req.params.taskId, "taskId");
    const reason = (req.body as { reason?: string } | undefined)?.reason;
    const result = await autonomyService.rejectTask(taskId, reason);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function runCycle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const payload = runAutonomyCycleSchema.parse(req.body ?? {});
    const actor = await buildActor(req);
    const result = await autonomyService.runCycle({
      actor: { ...actor, brandId: payload.brandId ?? actor.brandId, tenantId: payload.tenantId ?? actor.tenantId },
      includeEmbeddings: payload.includeEmbeddings,
      dryRun: payload.dryRun,
      autoExecute: payload.autoExecute ?? true,
    });
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export function getConfig(_req: Request, res: Response, next: NextFunction) {
  try {
    respondWithSuccess(res, autonomyService.getConfig());
  } catch (err) {
    next(err);
  }
}

export function updateConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const payload = autonomyConfigSchema.parse(req.body ?? {});
    if (payload.globalAutonomyEnabled === true && req.user?.role !== "SUPER_ADMIN") {
      throw forbidden("Only SUPER_ADMIN can enable autonomy");
    }
    const config = autonomyService.setConfig(payload);
    respondWithSuccess(res, config);
  } catch (err) {
    next(err);
  }
}

export async function debugDetectors(_req: Request, res: Response, next: NextFunction) {
  try {
    respondWithSuccess(res, { detections: await runAutonomyDetectors() });
  } catch (err) {
    next(err);
  }
}

export async function debugTaskPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const detections = autonomyService.getStatus().lastDetections ?? (await runAutonomyDetectors());
    const actor = await buildActor(req);
    const plan = planAutonomyTasks(detections, actor);
    respondWithSuccess(res, { plan });
  } catch (err) {
    next(err);
  }
}

export async function debugExecutor(_req: Request, res: Response, next: NextFunction) {
  try {
    respondWithSuccess(res, { executed: autonomyService.getExecuted(), pending: autonomyService.getPending() });
  } catch (err) {
    next(err);
  }
}

export async function debugLoop(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const actor = await buildActor(req);
    const result = await runAutonomyLoop({ actor, autoExecute: false, dryRun: true });
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
