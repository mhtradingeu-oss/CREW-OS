import { z } from "zod";

const settingsSchema = z.record(z.string(), z.unknown()).optional();
const socialProfilesSchema = z.record(z.string(), z.string()).optional();

export const createBrandSchema = z.object({
  name: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase, alphanumeric, and may include hyphens",
    ),
  description: z.string().optional(),
  countryOfOrigin: z.string().trim().min(2).max(60).optional(),
  defaultCurrency: z.string().trim().length(3).optional(),
  metadata: settingsSchema,
  preferences: settingsSchema,
  settings: settingsSchema,
  userIds: z.array(z.string().trim().min(1)).optional(),
  tenantId: z.string().trim().min(1).optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

export const listBrandSchema = z.object({
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const brandIdentitySchema = z.object({
  vision: z.string().trim().min(1).optional(),
  mission: z.string().trim().min(1).optional(),
  values: z.string().trim().min(1).optional(),
  toneOfVoice: z.string().trim().min(1).optional(),
  persona: z.string().trim().min(1).optional(),
  brandStory: z.string().trim().min(1).optional(),
  keywords: z.string().trim().min(1).optional(),
  colorPalette: z.string().trim().min(1).optional(),
  packagingStyle: z.string().trim().min(1).optional(),
  socialProfiles: socialProfilesSchema,
});

export const brandAiIdentitySchema = z.object({
  forceRegenerate: z.coerce.boolean().optional(),
});

export const brandRulesSchema = z.object({
  namingRules: z.string().trim().min(1).optional(),
  descriptionRules: z.string().trim().min(1).optional(),
  marketingRules: z.string().trim().min(1).optional(),
  discountRules: z.string().trim().min(1).optional(),
  pricingConstraints: z.string().trim().min(1).optional(),
  restrictedWords: z.string().trim().min(1).optional(),
  allowedWords: z.string().trim().min(1).optional(),
  aiRestrictions: z.string().trim().min(1).optional(),
});

export const brandAiConfigSchema = z.object({
  aiPersonality: z.string().trim().min(1).optional(),
  aiTone: z.string().trim().min(1).optional(),
  aiContentStyle: z.string().trim().min(1).optional(),
  aiPricingStyle: z.string().trim().min(1).optional(),
  aiEnabledActions: z.array(z.string().trim().min(1)).optional(),
  aiBlockedTopics: z.array(z.string().trim().min(1)).optional(),
  aiModelVersion: z.string().trim().min(1).optional(),
});
