import type { Request, Response, NextFunction } from "express";
import { requireParam } from "../../core/http/params.js";
import { aiInsightsService } from "./ai-insights.service.js";
import {
  insightsQuerySchema,
  kpiQuerySchema,
  reportsQuerySchema,
} from "./ai-insights.validators.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import type { AuthenticatedRequest } from "../../core/http/http-types.js";

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await aiInsightsService.refresh({
      brandId: req.body.brandId,
      scope: req.body.scope,
    });
    respondWithSuccess(res, items, 201);
  } catch (err) {
    next(err);
  }
}

export async function list(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const params = insightsQuerySchema.parse(_req.query);
    const brandScoped =
      _req.user?.role === "SUPER_ADMIN" ? params.brandId : params.brandId ?? _req.user?.brandId;
    respondWithSuccess(res, await aiInsightsService.list({ ...params, brandId: brandScoped }));
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    respondWithSuccess(res, await aiInsightsService.get(id));
  } catch (err) {
    next(err);
  }
}

export async function createReport(req: Request, res: Response, next: NextFunction) {
  try {
    const report = await aiInsightsService.createReport(req.body);
    respondWithSuccess(res, report, 201);
  } catch (err) {
    next(err);
  }
}

export async function listReports(_req: Request, res: Response, next: NextFunction) {
  try {
    const params = reportsQuerySchema.parse(_req.query);
    respondWithSuccess(res, await aiInsightsService.listReports(params));
  } catch (err) {
    next(err);
  }
}

export async function getReport(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    respondWithSuccess(res, await aiInsightsService.getReport(id));
  } catch (err) {
    next(err);
  }
}

export async function getReportRendered(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    respondWithSuccess(res, await aiInsightsService.getReportRendered(id));
  } catch (err) {
    next(err);
  }
}

export async function kpiSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const params = kpiQuerySchema.parse(req.query);
    const summary = await aiInsightsService.kpiSummary(params);
    respondWithSuccess(res, summary);
  } catch (err) {
    next(err);
  }
}
