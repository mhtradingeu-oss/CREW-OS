import { z } from "zod";

export const aiSuggestionsQuerySchema = z.object({
  brandId: z.string().trim().min(1).optional(),
});
