import type { NextFunction, Request, Response } from "express";
import { badRequest } from "../../core/http/errors.js";
import { requireParam } from "../../core/http/params.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { standPosService } from "./stand-pos.service.js";
import { standListSchema, standAiStockSchema } from "./stand-pos.validators.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { parsePagination } from "../../core/http/pagination.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  const validated = standListSchema.safeParse(req.query);
  if (!validated.success) {
    return next(badRequest("Validation error", validated.error.flatten()));
  }

  try {
    const { page, pageSize } = parsePagination(req.query);
    const result = await standPosService.list({ ...validated.data, page, pageSize });
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const stand = await standPosService.getById(id);
    respondWithSuccess(res, stand);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const stand = await standPosService.create(req.body);
    respondWithSuccess(res, stand, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const stand = await standPosService.update(id, req.body);
    respondWithSuccess(res, stand);
  } catch (err) {
    next(err);
  }
}

export async function getInventory(req: Request, res: Response, next: NextFunction) {
  try {
    const locationId = typeof req.query.locationId === "string" ? req.query.locationId : undefined;
    const id = requireParam(req.params.id, "id");
    const inventory = await standPosService.getInventory(id, locationId);
    respondWithSuccess(res, inventory);
  } catch (err) {
    next(err);
  }
}

export async function createRefill(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const result = await standPosService.createRefill(id, req.body);
    respondWithSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function getPerformance(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const summary = await standPosService.getPerformance(id);
    respondWithSuccess(res, summary);
  } catch (err) {
    next(err);
  }
}

export async function getAiStockSuggestion(req: Request, res: Response, next: NextFunction) {
  const validated = standAiStockSchema.safeParse(req.body);
  if (!validated.success) {
    return next(badRequest("Validation error", validated.error.flatten()));
  }

  try {
    const id = requireParam(req.params.id, "id");
    const result = await standPosService.getAiStockSuggestion(id, validated.data);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

function buildStandContext(req: AuthenticatedRequest, requestedBrandId?: string) {
  const brandId = resolveScopedBrandId(
    { brandId: req.user?.brandId, role: req.user?.role },
    requestedBrandId,
  );
  if (!brandId) {
    throw badRequest("brandId query parameter is required");
  }
  return { brandId };
}

export async function listKpis(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const context = buildStandContext(req, req.query.brandId as string | undefined);
    const { page, pageSize } = parsePagination(req.query);
    const payload = await standPosService.listStandKpis({
      brandId: context.brandId,
      page,
      pageSize,
    });
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function getKpi(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const context = buildStandContext(req, req.query.brandId as string | undefined);
    const id = requireParam(req.params.id, "id");
    const payload = await standPosService.getStandKpi(id, context.brandId);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function recalculateKpi(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const context = buildStandContext(req, req.query.brandId as string | undefined);
    const id = requireParam(req.params.id, "id");
    const payload = await standPosService.recalculateStandKpi(id, context.brandId);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function getInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const context = buildStandContext(req, req.query.brandId as string | undefined);
    const id = requireParam(req.params.id, "id");
    const payload = await standPosService.getStandInsights(id, context.brandId);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}
