import { z } from "zod";

export const executeAutomationEventSchema = z.object({
  eventName: z.string().min(1),
  payload: z.unknown().optional(),
  context: z
    .object({
      brandId: z.string().optional(),
      tenantId: z.string().optional(),
      actorUserId: z.string().optional(),
      correlationId: z.string().optional(),
    })
    .optional(),
});
