import { z } from "zod";

export const onboardingStatusSchema = z.enum(["in_progress", "completed"]);

export const onboardingStartSchema = z.object({
  persona: z.string().nullable(),
  goals: z.array(z.string()),
  status: onboardingStatusSchema,
});
export type OnboardingStartDto = z.infer<typeof onboardingStartSchema>;

export const onboardingPersonaSchema = z.object({
  persona: z.string().min(1),
});
export type OnboardingPersonaDto = z.infer<typeof onboardingPersonaSchema>;

export const onboardingGoalsSchema = z.object({
  goals: z.array(z.string()).min(1),
});
export type OnboardingGoalsDto = z.infer<typeof onboardingGoalsSchema>;

export const onboardingPlanSuggestionSchema = z.object({
  plan: z.enum(["free", "starter", "pro", "enterprise"]),
  features: z.array(z.string()),
});
export type OnboardingPlanSuggestionDto = z.infer<typeof onboardingPlanSuggestionSchema>;

export const onboardingCompleteSchema = z.object({
  confirm: z.boolean().optional(),
});
export type OnboardingCompleteDto = z.infer<typeof onboardingCompleteSchema>;
