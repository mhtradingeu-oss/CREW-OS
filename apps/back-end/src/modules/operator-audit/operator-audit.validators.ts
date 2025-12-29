import { z } from "zod";

const pageSchema = z.coerce.number().int().min(1).default(1);
const pageSizeSchema = z.coerce.number().int().min(1).max(100).default(25);

export const timelineQuerySchema = z.object({
  brandId: z.string().optional(),
  status: z.string().optional(),
  actor: z.string().optional(),
  from: z
    .preprocess((value) => (value ? new Date(String(value)) : undefined), z.date().optional()),
  to: z
    .preprocess((value) => (value ? new Date(String(value)) : undefined), z.date().optional()),
  page: pageSchema,
  pageSize: pageSizeSchema,
});

const idParamSchema = z.object({
  id: z.string().min(1),
});

export const approvalDetailParams = idParamSchema;
export const executionDetailParams = idParamSchema;
