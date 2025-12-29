import type { Request, Response, NextFunction } from "express";
import { requireParam } from "../../core/http/params.js";
import { badRequest } from "../../core/http/errors.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import { getUserPermissions } from "../../core/security/rbac.js";
import { AI_ENGINE_HANDLERS, type AIEngineId } from "../../ai/agents/index.js";
import type { EngineRunOptions } from "../../core/ai/engines/engine-types.js";
import { aiAgentsService } from "./ai-agents.service.js";
import { runAgentSchema } from "./ai-agents.validators.js";
import type { AuthenticatedRequest } from "../../core/http/http-types.js";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    respondWithSuccess(
      res,
      await aiAgentsService.list({
        brandId: _req.query.brandId as string | undefined,
        scope: _req.query.scope as string | undefined,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    respondWithSuccess(res, await aiAgentsService.get(id));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const agent = await aiAgentsService.create(req.body);
    respondWithSuccess(res, agent, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const agent = await aiAgentsService.update(id, req.body);
    respondWithSuccess(res, agent);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    await aiAgentsService.remove(id);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function test(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const result = await aiAgentsService.test(id, req.body ?? {});
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function run(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const payload = runAgentSchema.parse(req.body ?? {});
    const handler = AI_ENGINE_HANDLERS[payload.agentId as AIEngineId];
    if (!handler) {
      throw badRequest("Unknown agentId");
    }

    const permissions = req.user?.id ? await getUserPermissions(req.user.id) : [];
    const brandId = resolveScopedBrandId(
      { brandId: req.user?.brandId, role: req.user?.role, tenantId: req.user?.tenantId },
      (payload.input as { brandId?: string } | undefined)?.brandId,
    );

    const options: EngineRunOptions = {
      actor: {
        userId: req.user?.id,
        role: req.user?.role,
        permissions,
        brandId: req.user?.brandId,
        tenantId: req.user?.tenantId,
      },
      brandId: brandId ?? undefined,
      tenantId: req.user?.tenantId,
      includeEmbeddings: payload.includeEmbeddings,
      dryRun: payload.dryRun,
      task: payload.task,
    };

    const engineInput = {
      ...(payload.input ?? {}),
      ...(brandId ? { brandId } : {}),
      ...(req.user?.tenantId ? { tenantId: req.user.tenantId } : {}),
    } as Record<string, unknown>;

    const runHandler = handler as (input: Record<string, unknown>, opts?: EngineRunOptions) => Promise<unknown>;
    const result = await runHandler(engineInput, options);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
