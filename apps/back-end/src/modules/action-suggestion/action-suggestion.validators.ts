// Zod validators for ActionSuggestion filters
import { z } from 'zod';

export const actionSuggestionQuerySchema = z.object({
  tenantId: z.string().optional(),
  brandId: z.string().optional(),
  partnerId: z.string().optional(),
  featureCode: z.string().optional(),
  crew: z.string().optional(),
  insightType: z.string().optional(),
  confidenceMin: z.preprocess((v) => v === undefined ? undefined : Number(v), z.number().optional()),
  confidenceMax: z.preprocess((v) => v === undefined ? undefined : Number(v), z.number().optional()),
  riskLevel: z.string().optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  page: z.preprocess((v) => v === undefined ? 1 : Number(v), z.number().int().min(1).default(1)),
  pageSize: z.preprocess((v) => v === undefined ? 20 : Number(v), z.number().int().min(1).max(100).default(20)),
  sort: z.enum(['createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
