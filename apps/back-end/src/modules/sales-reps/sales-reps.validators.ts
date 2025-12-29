import { z } from "zod";

export const createSalesOrderSchema = z.object({
  repId: z.string({ required_error: 'repId is required' }),
  productId: z.string({ required_error: 'productId is required' }),
  quantity: z.number().int().positive({ message: 'quantity must be a positive integer' }),
  brandId: z.string().optional(),
  warehouseId: z.string({ required_error: 'warehouseId is required' }),
});

export const listSalesRepsSchema = z.object({
  brandId: z.string().optional(),
  region: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const createSalesRepsSchema = z.object({
  brandId: z.string().optional(),
  userId: z.string().optional(),
  code: z.string().optional(),
  region: z.string().optional(),
  status: z.string().optional(),
});

export const updateSalesRepsSchema = createSalesRepsSchema.partial();

export const createLeadSchema = z.object({
  leadId: z.string().optional(),
  companyId: z.string().optional(),
  territoryId: z.string().optional(),
  source: z.string().optional(),
  score: z.number().positive().optional(),
  stage: z.string().optional(),
  status: z.string().optional(),
  nextAction: z.string().optional(),
  notes: z.string().optional(),
});

export const createVisitSchema = z.object({
  partnerId: z.string().optional(),
  date: z.string().datetime().optional(),
  purpose: z.string().optional(),
  result: z.string().optional(),
});

export const listSalesLeadsSchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const listSalesVisitsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const salesRepAiPlanSchema = z.object({
  brandId: z.string().trim().optional(),
  scope: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
