import type { Response, NextFunction } from "express";
import { badRequest } from "../../core/http/errors.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { requireParam } from "../../core/http/params.js";
import { productService } from "./product.service.js";
import {
  listProductSchema,
  productExportSchema,
  productImportSchema,
  productInsightSchema,
  productMediaSchema,
} from "./product.validators.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = listProductSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const scopedBrandId = resolveScopedBrandId(
      { brandId: req.user?.brandId, role: req.user?.role },
      parsed.data.brandId,
    );
    const items = await productService.list({ ...parsed.data, brandId: scopedBrandId });
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const actionContext = buildProductContext(req);
    const item = await productService.getById(id, actionContext);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const actionContext = buildProductContext(req, req.body.brandId as string | undefined);
    const item = await productService.create(req.body, actionContext);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const actionContext = buildProductContext(req, req.body.brandId as string | undefined);
    const item = await productService.update(id, req.body, actionContext);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const actionContext = buildProductContext(req);
    await productService.remove(id, actionContext);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function importProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = productImportSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const scopedBrandId = resolveScopedBrandId(
      { brandId: req.user?.brandId, role: req.user?.role },
      parsed.data.brandId,
    );
    const payload = { ...parsed.data, brandId: scopedBrandId ?? parsed.data.brandId };
    const actionContext = buildProductContext(req, scopedBrandId ?? undefined);
    const result = await productService.importProducts(payload, actionContext);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function exportProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = productExportSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const scopedBrandId = resolveScopedBrandId(
      { brandId: req.user?.brandId, role: req.user?.role },
      parsed.data.brandId,
    );
    const filters = { ...parsed.data, brandId: scopedBrandId ?? parsed.data.brandId };
    const actionContext = buildProductContext(req, scopedBrandId ?? undefined);
    const result = await productService.exportProducts(filters, actionContext);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function createInsight(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const params = productInsightSchema.parse(req.body);
    const scopedBrandId = resolveScopedBrandId(
      { brandId: req.user?.brandId, role: req.user?.role },
      params.brandId,
    );
    const result = await productService.createInsight(
      requireParam(req.params.id, "id"),
      scopedBrandId ?? params.brandId,
      { forceRegenerate: params.forceRegenerate, tenantId: req.user?.tenantId },
    );
    respondWithSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function getInsight(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const actionContext = buildProductContext(req);
    await productService.getById(id, actionContext);
    const insight = await productService.getLatestInsight(id);
    respondWithSuccess(res, insight);
  } catch (err) {
    next(err);
  }
}

export async function attachMedia(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = productMediaSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const context = buildProductContext(req);
    const product = await productService.attachMediaToProduct(
      requireParam(req.params.id, "id"),
      parsed.data,
      context,
    );
    respondWithSuccess(res, product);
  } catch (err) {
    next(err);
  }
}

export async function detachMedia(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = productMediaSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const context = buildProductContext(req);
    const product = await productService.detachMediaFromProduct(
      requireParam(req.params.id, "id"),
      parsed.data,
      context,
    );
    respondWithSuccess(res, product);
  } catch (err) {
    next(err);
  }
}

function buildProductContext(req: AuthenticatedRequest, requestedBrandId?: string) {
  const brandId = resolveScopedBrandId(
    { brandId: req.user?.brandId, role: req.user?.role },
    requestedBrandId,
  );
  return {
    brandId,
    actorUserId: req.user?.id,
  };
}
