import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const policySchema = z.object({
  name: z.string().trim().min(1),
  rulesJson: z.string().optional(),
});

export const aiRestrictionSchema = z.object({
  name: z.string().trim().min(1),
  rulesJson: z.string().optional(),
});

export const auditLogSchema = paginationSchema
  .extend({
    action: z.string().trim().optional(),
    entityType: z.string().trim().optional(),
  })
  .passthrough();

export const aiSummarySchema = z.object({
  brandId: z.string().trim().min(1),
  entityType: z.string().trim().min(1),
  entityId: z.string().trim().optional(),
  context: z.string().optional(),
  tenantId: z.string().trim().optional(),
});
