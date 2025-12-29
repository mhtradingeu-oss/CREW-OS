import type { Request, Response, NextFunction } from "express";
import { badRequest } from "../../core/http/errors.js";
import { requireParam } from "../../core/http/params.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import {
  listBrandsQuerySchema,
  createBrandSchema,
  updateBrandSchema,
  listProductsQuerySchema,
  createProductSchema,
  statsParamSchema,
  createOrderSchema,
  pricingSyncSchema,
  updateOrderStatusSchema,
} from "./white-label.validators.js";
import { white_labelService } from "./white-label.service.js";
import { respondWithSuccess } from "../../core/http/respond.js";

function ensureBrandParam(req: Request) {
  return requireParam(req.params.id, "id");
}

function resolveBrandContext(req: AuthenticatedRequest, requestedBrandId?: string) {
  const brandId = resolveScopedBrandId(
    { brandId: req.user?.brandId, role: req.user?.role },
    requestedBrandId,
  );
  if (!brandId) {
    throw badRequest("brandId is required");
  }
  return brandId;
}

export async function listBrands(req: Request, res: Response, next: NextFunction) {
  try {
    const params = listBrandsQuerySchema.parse(req.query);
    const payload = await white_labelService.listWLBrands(params);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function getBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, brandId } = statsParamSchema.parse({ ...req.params, ...req.query });
    const item = await white_labelService.getWLBrand(id, brandId);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function createBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = createBrandSchema.parse(req.body);
    const created = await white_labelService.createWLBrand(payload);
    respondWithSuccess(res, created, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = updateBrandSchema.parse(req.body);
    const id = ensureBrandParam(req);
    const updated = await white_labelService.updateWLBrand(id, payload.brandId, payload);
    respondWithSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, brandId } = statsParamSchema.parse({ ...req.params, ...req.query });
    const stats = await white_labelService.getWLBrandStats(id, brandId);
    respondWithSuccess(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const wlBrandId = ensureBrandParam(req);
    const params = listProductsQuerySchema.parse({ ...req.query, wlBrandId });
    const payload = await white_labelService.listWLProducts(params);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const wlBrandId = ensureBrandParam(req);
    const payload = createProductSchema.parse({ ...req.body, wlBrandId });
    const created = await white_labelService.createWLProduct(payload);
    respondWithSuccess(res, created, 201);
  } catch (err) {
    next(err);
  }
}

export async function createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const wlBrandId = ensureBrandParam(req);
    const brandId = resolveBrandContext(req, req.query.brandId as string | undefined);
    const payload = createOrderSchema.parse({ ...req.body, wlBrandId, brandId });
    const created = await white_labelService.createWLOrder(payload);
    respondWithSuccess(res, created, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = requireParam(req.params.id, "id");
    const body = updateOrderStatusSchema.parse({ ...req.body });
    const brandId = resolveBrandContext(req, req.body.brandId ?? req.query.brandId);
    const payload = { ...body, brandId };
    const updated = await white_labelService.updateWLOrderStatus(id, payload);
    respondWithSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function requestPricingSync(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const brandId = resolveBrandContext(req, req.body.brandId as string | undefined);
    const payload = pricingSyncSchema.parse({ ...req.body, brandId });
    const result = await white_labelService.requestPricingSync(payload);
    respondWithSuccess(res, result, 202);
  } catch (err) {
    next(err);
  }
}
