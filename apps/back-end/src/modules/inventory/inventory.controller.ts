import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { publishActivity } from "../../core/activity/activity.js";
import { requireParam } from "../../core/http/params.js";
import { inventoryService } from "./inventory.service.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { notFound } from "../../core/http/errors.js";
import { parsePagination } from "../../core/http/pagination.js";

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const params = {
      brandId: typeof req.query.brandId === "string" ? req.query.brandId : undefined,
      warehouseId: typeof req.query.warehouseId === "string" ? req.query.warehouseId : undefined,
      productId: typeof req.query.productId === "string" ? req.query.productId : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      ...parsePagination(req.query),
    };
    const payload = await inventoryService.listInventory(params);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const item = await inventoryService.getInventoryItem(
      id,
      typeof req.query.brandId === "string" ? req.query.brandId : undefined,
    );
    if (!item) {
      return next(notFound("Inventory item not found"));
    }
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await inventoryService.createInventoryItem(req.body);
    await publishActivity(
      "inventory",
      "created",
      {
        entityType: "inventory-item",
        entityId: item.id,
        metadata: { productId: item.product.id, warehouseId: item.warehouse.id },
      },
      {
        actorUserId: req.user?.id,
        brandId: item.brandId ?? req.user?.brandId,
        tenantId: req.user?.tenantId,
        role: req.user?.role,
        source: "api",
      },
    );
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function createAdjustment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await inventoryService.createInventoryAdjustment(req.body);
    await publishActivity(
      "inventory",
      "adjustment",
      {
        entityType: "inventory-adjustment",
        entityId: result.adjustment.id,
        metadata: {
          productId: result.inventoryItem.product.id,
          warehouseId: result.inventoryItem.warehouse.id,
          delta: req.body?.delta,
        },
      },
      {
        actorUserId: req.user?.id,
        brandId: result.inventoryItem.brandId ?? req.user?.brandId,
        tenantId: req.user?.tenantId,
        role: req.user?.role,
        source: "api",
      },
    );
    respondWithSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function insights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const params = {
      brandId: typeof req.query.brandId === "string" ? req.query.brandId : undefined,
    };
    const payload = await inventoryService.getInsights(params.brandId);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}
