import { z } from "zod";
import { listActivityLogSchema } from "../activity-log/activity-log.validators.js";

export const listPlatformOpsErrorSchema = listActivityLogSchema;
export const listPlatformOpsAuditSchema = listActivityLogSchema;

export const listPlatformOpsJobsSchema = z.object({
  status: z.string().optional(),
});

export const superAdminUserListSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  brandId: z.string().optional(),
  tenantId: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const roleAssignmentSchema = z
  .object({
    roleId: z.string().optional(),
    roleName: z.string().optional(),
    makePrimary: z.boolean().optional(),
  })
  .refine((value) => Boolean(value.roleId || value.roleName), {
    message: "roleId or roleName is required",
    path: ["roleId"],
  });
