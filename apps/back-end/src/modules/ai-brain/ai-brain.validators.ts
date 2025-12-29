import { z } from "zod";

export const createAiBrainSchema = z.object({
  brandId: z.string().min(1),
  scope: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  notes: z.string().optional(),
  summary: z.string().optional(),
  metrics: z.record(z.string(), z.unknown()).optional(),
  createReport: z.boolean().optional(),
});

export const updateAiBrainSchema = createAiBrainSchema.partial();

const pageSchema = z.coerce.number().int().min(1).default(1);
const pageSizeSchema = z.coerce.number().int().min(1).max(100).default(20);

export const listInsightsSchema = z.object({
  brandId: z.string().min(1),
  os: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  search: z.string().optional(),
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const createInsightSchema = z.object({
  brandId: z.string().min(1),
  os: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  summary: z.string().optional(),
  details: z.string().optional(),
});

export const listReportsSchema = z.object({
  brandId: z.string().min(1),
  scope: z.string().optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const createReportSchema = z.object({
  brandId: z.string().min(1),
  title: z.string().min(1),
  scope: z.string().optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
  content: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const listLearningSchema = z.object({
  brandId: z.string().min(1),
  productId: z.string().optional(),
  eventType: z.string().optional(),
  source: z.string().optional(),
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const createLearningSchema = z.object({
  brandId: z.string().min(1),
  productId: z.string().optional(),
  source: z.string().min(1),
  eventType: z.string().min(1),
  inputSnapshot: z.any().optional(),
  outputSnapshot: z.any().optional(),
});
