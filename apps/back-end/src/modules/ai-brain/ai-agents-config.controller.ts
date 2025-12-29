import type { Request, Response, NextFunction } from "express";
import { requireParam } from "../../core/http/params.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { forbidden } from "../../core/http/errors.js";
import { aiAgentsConfigService } from "./ai-agents-config.service.js";
import { agentConfigQuerySchema, updateAgentConfigSchema } from "./ai-agents-config.validators.js";
import type { AuthenticatedRequest } from "../../core/http/http-types.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = agentConfigQuerySchema.parse(req.query);
    const data = await aiAgentsConfigService.list({ brandId: query.brandId });
    respondWithSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const agentId = requireParam(req.params.agentId, "agentId");
    const query = agentConfigQuerySchema.parse(req.query);
    const data = await aiAgentsConfigService.get(agentId, { brandId: query.brandId });
    respondWithSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const agentId = requireParam(req.params.agentId, "agentId");
    const payload = updateAgentConfigSchema.parse(req.body ?? {});
    if (payload.autonomyLevel === "AUTO_FULL" && req.user?.role !== "SUPER_ADMIN") {
      throw forbidden("Only SUPER_ADMIN can enable AUTO_FULL");
    }
    const data = await aiAgentsConfigService.update(agentId, payload);
    respondWithSuccess(res, data);
  } catch (err) {
    next(err);
  }
}
