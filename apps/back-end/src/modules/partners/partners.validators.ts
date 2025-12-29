import { z } from "zod";
import { PARTNER_USER_ROLES } from "./partners.types.js";

const pageSchema = z.coerce.number().int().min(1).default(1);
const pageSizeSchema = z.coerce.number().int().min(1).max(100).default(20);

export const createPartnerSchema = z.object({
  brandId: z.string().trim().min(1),
  type: z.string().trim().min(1),
  name: z.string().trim().min(1),
  country: z.string().trim().min(2).optional(),
  city: z.string().trim().min(2).optional(),
  tierId: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

export const updatePartnerSchema = createPartnerSchema.partial();

export const listPartnersSchema = z.object({
  brandId: z.string().trim().min(1),
  search: z.string().trim().optional(),
  tierId: z.string().trim().optional(),
  status: z.string().trim().optional(),
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const partnerStatsSchema = z.object({
  brandId: z.string().trim().min(1),
});

const partnerUserRoleSchema = z.enum(PARTNER_USER_ROLES);

const partnerContractTermsSchema = z
  .object({
    discount: z.string().trim().optional(),
    reference: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .catchall(z.unknown());

const partnerPricingMetadataSchema = z
  .object({
    reason: z.string().trim().optional(),
    source: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    tags: z.array(z.string().trim()).optional(),
  })
  .catchall(z.unknown());

export const createPartnerUserSchema = z
  .object({
    userId: z.string().cuid().optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    role: partnerUserRoleSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.userId) {
      if (!value.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "email or userId is required",
        });
      }
      if (!value.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "password is required when creating a new user",
        });
      }
    }
  });

export const updatePartnerUserSchema = z.object({
  role: partnerUserRoleSchema.optional(),
});

export const listPartnerUsersSchema = z.object({
  brandId: z.string().trim().min(1),
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const listPartnerContractsSchema = z.object({
  brandId: z.string().trim().min(1),
  onlyActive: z.coerce.boolean().default(false),
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const partnerAiInsightSchema = z.object({
  brandId: z.string().trim().min(1).optional(),
  partnerId: z.string().trim().min(1),
  topic: z.string().trim().min(3).max(500).optional(),
});

export const createPartnerContractSchema = z.object({
  brandId: z.string().trim().min(1),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  terms: partnerContractTermsSchema.optional(),
});

export const updatePartnerContractSchema = createPartnerContractSchema.partial();

export const listPartnerPricingSchema = z.object({
  brandId: z.string().trim().min(1),
  productId: z.string().trim().optional(),
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const upsertPartnerPricingSchema = z.object({
  brandId: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  netPrice: z.number().nonnegative(),
  currency: z.string().trim().optional(),
  metadata: partnerPricingMetadataSchema.optional(),
});
