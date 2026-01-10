import type { Request, Response, NextFunction } from "express";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import { badRequest } from "../../core/http/errors.js";
import { requireParam } from "../../core/http/params.js";
import { affiliateService } from "./affiliate.service.js";
import {
  createConversionSchema,
  createPayoutRequestSchema,
  updatePayoutStatusSchema,
} from "./affiliate.validators.js";
import { respondWithSuccess } from "../../core/http/respond.js";

function execBrandId(req: Request) {
  return (
    (req.query.brandId as string | undefined) ??
    (req.body.brandId as string | undefined)
  );
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = execBrandId(req);
    if (!brandId) {
      return next(badRequest("brandId is required"));
    }
    const { page, pageSize, search, status, tierId } = req.query;
    const parsedPage = page ? Number(page) : undefined;
    const parsedPageSize = pageSize ? Number(pageSize) : undefined;
    const response = await affiliateService.listAffiliates({
      brandId,
      search: search as string | undefined,
      status: status as string | undefined,
      tierId: tierId as string | undefined,
      page: parsedPage,
      pageSize: parsedPageSize,
    });
    respondWithSuccess(res, {
      data: response.items,
      meta: { total: response.total, page: response.page, pageSize: response.pageSize },
    });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = execBrandId(req);
    if (!brandId) {
      return next(badRequest("brandId is required"));
    }
    const id = requireParam(req.params.id, "id");
    const item = await affiliateService.getAffiliateById(id, brandId);
    respondWithSuccess(res, { data: item });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = execBrandId(req);
    if (!brandId) {
      return next(badRequest("brandId is required"));
    }
    const item = await affiliateService.createAffiliate({
      ...req.body,
      brandId,
    });
    respondWithSuccess(res, { data: item }, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = execBrandId(req);
    if (!brandId) {
      return next(badRequest("brandId is required"));
    }
    const id = requireParam(req.params.id, "id");
    const item = await affiliateService.updateAffiliate(id, brandId, req.body);
    respondWithSuccess(res, { data: item });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = execBrandId(req);
    if (!brandId) {
      return next(badRequest("brandId is required"));
    }
    const id = requireParam(req.params.id, "id");
    await affiliateService.deactivateAffiliate(id, brandId);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function createConversion(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createConversionSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const context = buildAffiliateContext(req, req.query.brandId as string | undefined);
    const result = await affiliateService.createConversion(parsed.data, context);
    respondWithSuccess(res, { data: result }, 201);
  } catch (err) {
    next(err);
  }
}

export async function requestPayout(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createPayoutRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const context = buildAffiliateContext(req, req.body.brandId as string | undefined);
    const result = await affiliateService.requestPayout(parsed.data, context);
    respondWithSuccess(res, { data: result }, 201);
  } catch (err) {
    next(err);
  }
}

export async function approvePayout(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = updatePayoutStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const context = buildAffiliateContext(req, req.query.brandId as string | undefined);
    const payoutId = requireParam(req.params.id, "id");
    const result = await affiliateService.approvePayout(payoutId, context);
    respondWithSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
}

export async function rejectPayout(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = updatePayoutStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const context = buildAffiliateContext(req, req.query.brandId as string | undefined);
    const payoutId = requireParam(req.params.id, "id");
    const result = await affiliateService.rejectPayout(payoutId, context, parsed.data.notes);
    respondWithSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
}

export async function markPayoutPaid(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = updatePayoutStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const context = buildAffiliateContext(req, req.query.brandId as string | undefined);
    const payoutId = requireParam(req.params.id, "id");
    const result = await affiliateService.markPayoutPaid(payoutId, context);
    respondWithSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
}

export async function dashboardSummary(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const brandId = execBrandId(req);
    if (!brandId) {
      return next(badRequest("brandId is required"));
    }
    const summary = await affiliateService.getDashboardSummary(brandId);
    respondWithSuccess(res, { data: summary });
  } catch (err) {
    next(err);
  }
}

function buildAffiliateContext(req: Request, requestedBrandId?: string) {
  const brandId = resolveScopedBrandId(
    { brandId: req.user?.brandId, role: req.user?.role },
    requestedBrandId,
  );
  if (!brandId) {
    throw badRequest("brandId is required");
  }
  return {
    brandId,
    actorUserId: req.user?.id,
  };
}
