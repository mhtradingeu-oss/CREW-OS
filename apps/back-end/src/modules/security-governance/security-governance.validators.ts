import { z } from "zod";

const statusEnum = z.enum(["enabled", "disabled"]);

const basePolicySchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  rulesJson: z.string().optional(),
  status: statusEnum.optional(),
  brandId: z.string().optional(),
});

export const createSecurityGovernanceSchema = basePolicySchema.extend({
  status: statusEnum.default("enabled"),
});

export const updateSecurityGovernanceSchema = basePolicySchema.partial();

export const listSecurityPoliciesSchema = z.object({
  brandId: z.string().optional(),
  category: z.string().optional(),
  status: statusEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const createRoleSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().max(500).optional(),
  permissions: z.array(z.string().trim().min(1)).default([]),
});

export const updateRoleSchema = createRoleSchema.partial();

export const setRolePermissionsSchema = z.object({
  permissions: z.array(z.string().trim().min(1)).default([]),
});

export const assignRoleSchema = z.object({
  userId: z.string().trim().min(1),
  role: z.string().trim().min(1),
  asPrimary: z.coerce.boolean().default(true),
});

export const createAiRestrictionSchema = z.object({
  name: z.string().trim().min(1),
  rulesJson: z.string().optional(),
});

export const updateAiRestrictionSchema = createAiRestrictionSchema.partial();
