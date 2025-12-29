import { z } from "zod";

export const listNotificationsSchema = z.object({
  status: z.string().optional(),
  brandId: z.string().optional(),
  type: z.string().optional(),
  unreadOnly: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const markReadSchema = z.object({
  ids: z.array(z.string()).min(1),
});
