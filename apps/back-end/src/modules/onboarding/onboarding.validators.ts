import { z } from "zod";
import { PERSONAS } from "./onboarding.service.js";

export const startSchema = z.object({}).optional();

export const personaSchema = z.object({
  persona: z.enum(PERSONAS),
});

export const planSelectionSchema = z.object({
  planKey: z.string().min(1),
  selectedModules: z.record(z.string(), z.any()).optional(),
});
