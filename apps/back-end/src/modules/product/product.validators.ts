import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase, alphanumeric, and may include hyphens",
  );

const jsonObject = z.record(z.any()).optional();
const stringArray = z.array(z.string().trim().min(1)).optional();

export const createProductSchema = z.object({
  brandId: z.string().trim().min(1).optional(),
  categoryId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  slug: slugSchema,
  description: z.string().optional(),
  sku: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
  barcode: z.string().trim().min(5).optional(),
  ean: z.string().trim().min(5).optional(),
  upc: z.string().trim().min(5).optional(),
  qrCodeUrl: z.string().trim().url().optional(),
  lifecycleStage: z.string().trim().min(2).optional(),
  tags: stringArray,
  marketingProfile: jsonObject,
  seoProfile: jsonObject,
  distributionProfile: jsonObject,
  complianceProfile: jsonObject,
  localizationProfile: jsonObject,
  socialProof: jsonObject,
  analyticsProfile: jsonObject,
});

export const updateProductSchema = createProductSchema.partial();

export const listProductSchema = z.object({
  search: z.string().trim().min(1).optional(),
  brandId: z.string().trim().min(1).optional(),
  categoryId: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
  lifecycleStage: z.string().trim().min(2).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const productInsightSchema = z.object({
  brandId: z.string().trim().min(1),
  forceRegenerate: z.coerce.boolean().optional(),
});

const mediaIdArray = z.array(z.string().trim().min(1));

export const productImportSchema = z.object({
  brandId: z.string().trim().min(1).optional(),
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1).optional(),
        name: z.string().trim().min(1),
        slug: slugSchema,
        description: z.string().optional(),
        sku: z.string().trim().min(1).optional(),
        barcode: z.string().trim().min(1).optional(),
        ean: z.string().trim().min(5).optional(),
        upc: z.string().trim().min(5).optional(),
        qrCodeUrl: z.string().trim().url().optional(),
        lifecycleStage: z.string().trim().min(2).optional(),
        tags: stringArray,
        marketingProfile: jsonObject,
        seoProfile: jsonObject,
        distributionProfile: jsonObject,
        complianceProfile: jsonObject,
        localizationProfile: jsonObject,
        socialProof: jsonObject,
        analyticsProfile: jsonObject,
        categoryId: z.string().trim().min(1).optional(),
        status: z.string().trim().min(1).optional(),
        complianceDocIds: mediaIdArray.optional(),
        specDocIds: mediaIdArray.optional(),
        mediaIds: mediaIdArray.optional(),
        pricing: z
          .object({
            cogsEur: z.number().optional(),
            fullCostEur: z.number().optional(),
            b2cNet: z.number().optional(),
            dealerNet: z.number().optional(),
            standPartnerNet: z.number().optional(),
          })
          .partial()
          .optional(),
      }),
    )
    .min(1),
});

export const productExportSchema = z.object({
  brandId: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
  lifecycleStage: z.string().trim().min(2).optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

export const productMediaSchema = z.object({
  mediaIds: mediaIdArray,
});
