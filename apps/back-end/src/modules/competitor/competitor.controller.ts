"use strict";

import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { publishActivity } from "../../core/activity/activity.js";
import { competitorService } from "./competitor.service.js";
import type { GetCompetitorPricesInput, ScanCompetitorsInput } from "./competitor.dto.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { parsePagination } from "../../core/http/pagination.js";

/**
 * TODO: Replace with real competitor ingestion logic when the AI intelligence layer is ready.
 */
export async function scanCompetitorsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const payload = req.body as ScanCompetitorsInput;
    const result = await competitorService.scanCompetitors(payload);
    await publishActivity(
      "competitor",
      "scan",
      {
        entityType: "competitor-scan",
        metadata: { payload },
      },
      {
        actorUserId: req.user?.id,
        brandId: (payload as Record<string, unknown>).brandId as string | undefined ?? req.user?.brandId,
        tenantId: req.user?.tenantId,
        role: req.user?.role,
        source: "api",
      },
    );
    return respondWithSuccess(res, {
      items: result.items ?? [],
      total: result.total ?? 0,
      page: result.page ?? 1,
      pageSize: Math.min(result.pageSize ?? result.items?.length ?? 0, 100),
      message: result.message,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * TODO: Enforce permissions and filtering as soon as the pricing telemetry schema is available.
 */
export async function getCompetitorPricesHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const params: GetCompetitorPricesInput = {
      brandId: typeof req.query.brandId === "string" ? req.query.brandId : undefined,
      productId: typeof req.query.productId === "string" ? req.query.productId : undefined,
      competitorId: typeof req.query.competitorId === "string" ? req.query.competitorId : undefined,
      country: typeof req.query.country === "string" ? req.query.country : undefined,
      page,
      pageSize,
    };
    const result = await competitorService.getCompetitorPrices(params);
    await publishActivity(
      "competitor",
      "prices_listed",
      {
        entityType: "competitor-price",
        metadata: { ...params },
      },
      {
        actorUserId: req.user?.id,
        brandId: params.brandId ?? req.user?.brandId,
        tenantId: req.user?.tenantId,
        role: req.user?.role,
        source: "api",
      },
    );
    return respondWithSuccess(res, {
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  } catch (err) {
    return next(err);
  }
}
