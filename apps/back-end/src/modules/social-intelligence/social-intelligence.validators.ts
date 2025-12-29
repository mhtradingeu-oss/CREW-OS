import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const searchSchema = z.string().trim().min(1).optional();

export const listMentionsSchema = paginationSchema.extend({
  brandId: z.string().trim().min(1).optional(),
  platform: z.string().trim().min(1).optional(),
  sentiment: z.string().trim().min(1).optional(),
  keyword: z.string().trim().min(1).optional(),
  search: searchSchema,
});

export const listInfluencersSchema = paginationSchema.extend({
  brandId: z.string().trim().min(1).optional(),
  platform: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).optional(),
  search: searchSchema,
});

export const listTrendsSchema = paginationSchema.extend({
  brandId: z.string().trim().min(1).optional(),
  platform: z.string().trim().min(1).optional(),
  search: searchSchema,
});

export const listCompetitorReportsSchema = paginationSchema.extend({
  brandId: z.string().trim().min(1).optional(),
  competitor: z.string().trim().min(1).optional(),
});

export const influencerSchema = z.object({
  handle: z.string().trim().min(1),
  platform: z.string().trim().min(1),
  brandId: z.string().trim().min(1).optional(),
  followers: z.coerce.number().int().nonnegative().optional(),
  engagementRate: z.coerce.number().nonnegative().optional(),
  profileUrl: z.string().trim().url().optional(),
  tags: z.string().optional(),
});

export const trendSchema = z.object({
  topic: z.string().trim().min(1),
  platform: z.string().trim().min(1).optional(),
  brandId: z.string().trim().min(1).optional(),
  score: z.coerce.number().optional(),
  trendData: z.record(z.string(), z.unknown()).optional(),
});

export const aiSummarySchema = z.object({
  brandId: z.string().trim().min(1),
  entityType: z.enum(["mention", "trend", "influencer", "report"]),
  entityId: z.string().trim().min(1).optional(),
  context: z.string().optional(),
});

export const ingestMentionSchema = z.object({
  brandId: z.string().trim().min(1),
  platform: z.string().trim().min(1),
  author: z.string().trim().optional(),
  content: z.string().trim().optional(),
  sentiment: z.string().trim().optional(),
  url: z.string().trim().url().optional(),
  keyword: z.string().trim().optional(),
  occurredAt: z.coerce.date().optional(),
});

export const ingestTrendSchema = z.object({
  brandId: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  platform: z.string().trim().optional(),
  score: z.coerce.number().optional(),
  trendData: z.record(z.string(), z.unknown()).optional(),
});

export const socialInsightSchema = z.object({
  brandId: z.string().trim().min(1),
});
