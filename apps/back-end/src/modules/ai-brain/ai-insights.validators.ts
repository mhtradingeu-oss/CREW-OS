import { z } from "zod";

export const refreshInsightsSchema = z.object({
  brandId: z.string().optional(),
  scope: z.string().optional(),
});
export const createReportSchema = z.object({
  title: z.string().min(1),
  brandId: z.string().optional(),
  scope: z.string().optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
});

export const insightsQuerySchema = z.object({
  brandId: z.string().optional(),
  domain: z.string().optional(),
  scope: z.string().optional(),
  agentId: z.string().optional(),
  severity: z.enum(["low", "medium", "high"]).optional(),
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const reportsQuerySchema = z.object({
  brandId: z.string().optional(),
  scope: z.string().optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
});

export const kpiQuerySchema = z.object({
  brandId: z.string().optional(),
  scope: z.string().optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
});
