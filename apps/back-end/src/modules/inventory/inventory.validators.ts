import { z } from "zod";

export const createInventoryItemSchema = z.object({
  brandId: z.string().min(1),
  warehouseId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().min(0).optional(),
});

export const inventoryAdjustmentSchema = z.object({
  brandId: z.string().min(1),
  inventoryItemId: z.string().min(1),
  delta: z.number().refine((val) => val !== 0, "Delta must not be zero"),
  reason: z.string().optional(),
  createdByUserId: z.string().optional(),
});
