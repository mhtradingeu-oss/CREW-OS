import { z } from "zod";

export const listActivityLogSchema = z.object({
  brandId: z.string().optional(),
  module: z.string().optional(),
  userId: z.string().optional(),
  type: z.string().optional(),
  severity: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});
