// Virtual Office Zod schemas migrated from backend
import { z } from "zod";

export const departmentScopeEnum = z.enum([
  "marketing",
  "sales",
  "crm",
  "loyalty",
  "finance",
  "inventory",
  "brand",
]);

export const virtualOfficeMeetingSchema = z.object({
  topic: z.string().min(3, "Topic is required"),
  scope: z.string().optional(),
  brandId: z.string().optional(),
  departments: z.array(departmentScopeEnum).min(1, "Select at least one department"),
  agenda: z.array(z.string().min(2)).optional(),
  notes: z.string().optional(),
  standContext: z
    .object({
      standId: z.string().optional(),
      products: z
        .array(
          z.object({
            productId: z.string(),
            sku: z.string().optional(),
            name: z.string().optional(),
            currentQty: z.number().optional(),
            location: z.string().optional(),
          }),
        )
        .optional(),
      inventorySnapshot: z
        .array(
          z.object({
            locationId: z.string().optional(),
            locationName: z.string().optional(),
            productId: z.string(),
            sku: z.string().optional(),
            name: z.string().optional(),
            quantity: z.number(),
            status: z.string().optional(),
            lastRefillAt: z.string().optional(),
          }),
        )
        .optional(),
      notes: z.string().optional(),
    })
    .optional(),
  salesRepContext: z
    .object({
      repId: z.string().optional(),
      leads: z
        .array(
          z.object({
            leadId: z.string().optional(),
            name: z.string().optional(),
            stage: z.string().optional(),
          }),
        )
        .optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

export type VirtualOfficeMeetingDto = z.infer<typeof virtualOfficeMeetingSchema>;
