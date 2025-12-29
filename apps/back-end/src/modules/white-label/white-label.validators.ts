import { z } from "zod";

const parseDateString = z
  .union([z.string(), z.number(), z.date()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Invalid date");
    }
    return parsed;
  });

const pageSchema = z.coerce.number().int().min(1).default(1);
const pageSizeSchema = z.coerce.number().int().min(1).max(100).default(20);

export const listBrandsQuerySchema = z.object({
  brandId: z.string().min(1),
  ownerPartnerId: z.string().optional(),
  ownerAffiliateId: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const createBrandSchema = z.object({
  brandId: z.string().min(1),
  ownerPartnerId: z.string().optional(),
  ownerAffiliateId: z.string().optional(),
  name: z.string().min(1),
  slug: z.string().optional(),
  status: z.string().optional(),
  settings: z.any().optional(),
});

export const updateBrandSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  status: z.string().optional(),
  settings: z.any().optional(),
});

export const statsParamSchema = z.object({
  id: z.string().min(1),
  brandId: z.string().min(1),
});

export const listProductsQuerySchema = z.object({
  brandId: z.string().min(1),
  wlBrandId: z.string().min(1),
  search: z.string().optional(),
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const createProductSchema = z.object({
  brandId: z.string().min(1),
  wlBrandId: z.string().min(1),
  baseProductId: z.string().optional(),
  name: z.string().min(1),
  sku: z.string().optional(),
});

export const createOrderSchema = z.object({
  brandId: z.string().min(1),
  wlBrandId: z.string().min(1),
  total: z.number().positive(),
  currency: z.string().optional(),
  status: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  brandId: z.string().min(1),
  wlBrandId: z.string().min(1),
  newStatus: z.string().min(1),
});

export const pricingSyncSchema = z.object({
  brandId: z.string().min(1),
  wlBrandId: z.string().min(1),
  productId: z.string().min(1),
  currentPrice: z.number().positive(),
  targetChannels: z.array(z.string()).optional(),
});
