import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const stringArray = z.array(z.string().trim().min(1)).nonempty().optional();

export const discoverSchema = z.object({
  brandId: z.string().trim().min(1).optional(),
  query: z.string().trim().min(1).optional(),
  categories: stringArray,
  platforms: stringArray,
  audience: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const scoresQuerySchema = paginationSchema.extend({
  brandId: z.string().trim().min(1).optional(),
  platform: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
});

export const recommendSchema = z.object({
  brandId: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  goal: z.string().trim().min(1).optional(),
  audience: z.string().trim().min(1).optional(),
  topN: z.coerce.number().int().min(1).max(20).optional(),
});

export const negotiationSchema = z.object({
  brandId: z.string().trim().min(1).optional(),
  influencerId: z.string().trim().min(1),
  goal: z.string().trim().min(1).optional(),
  offer: z.string().trim().min(1).optional(),
  tone: z.string().trim().min(1).optional(),
});

export const campaignLinkSchema = z.object({
  brandId: z.string().trim().min(1).optional(),
  influencerId: z.string().trim().min(1),
  campaignId: z.string().trim().min(1).optional(),
  role: z.string().trim().min(1).optional(),
  trackingUrl: z.string().trim().url().optional(),
  status: z.string().trim().min(1).optional(),
  performance: z.record(z.string(), z.unknown()).optional(),
});

export const negotiationListSchema = paginationSchema.extend({
  brandId: z.string().trim().min(1).optional(),
});

export const campaignLinkListSchema = paginationSchema.extend({
  brandId: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
});
