export async function finalizeOnboarding(userId: string, steps: string[], persona?: Persona) {
  const profile = await ensureProfile(userId);
  // Persist steps and persona
  await updateOnboardingProfile(profile.id, {
    persona: persona ?? profile.persona,
    completedAt: new Date(),
  });
  // Emit onboarding.completed event
  const { emitOnboardingCompleted } = await import("./onboarding.events.js");
  await emitOnboardingCompleted({
    userId,
    tenantId: profile.tenantId,
    persona: persona ?? profile.persona,
    completedAt: new Date().toISOString(),
  });
  // Multi-role support: persona is tracked per profile
}
import { badRequest, unauthorized } from "../../core/http/errors.js";
import { getPlanDefinition, planDefinitions, type PlanKey, type PlanFeatureSet } from "../../core/plans.js";
import {
  createOnboardingProfile,
  finalizePlanSelection,
  findLatestOnboardingProfile,
  findPlanByKey,
  findUserWithTenant,
  updateOnboardingProfile,
  type OnboardingProfile,
} from "../../core/db/repositories/onboarding.repository.js";
export type { OnboardingProfile };

export const PERSONAS = [
  "RETAILER_DEALER",
  "PRODUCT_BRAND_OWNER",
  "CREATOR_INFLUENCER",
  "MEDIA_PLATFORM",
  "SERVICE_PROVIDER",
  "MEMBERSHIP_PROGRAM",
  "AFFILIATE_MARKETER",
  "MARKETING_AGENCY",
  "SALES_REP_ORG",
  "WHITE_LABEL_BUILDER",
] as const;

export type Persona = (typeof PERSONAS)[number];

const DEFAULT_PERSONA: Persona = "RETAILER_DEALER";

async function ensureProfile(userId: string): Promise<OnboardingProfile> {
  const user = await findUserWithTenant(userId);
  if (!user?.tenantId || !user.tenant) {
    throw unauthorized("User is not associated with a tenant");
  }

  // Reuse the most recent onboarding profile (completed or in-progress) to avoid
  // forcing users back into onboarding once they've finished.
  const existing = await findLatestOnboardingProfile(userId);
  if (existing) return existing;

  const selectedPlanKey: PlanKey = (user.tenant.plan?.key as PlanKey) ?? "free";
  return createOnboardingProfile({
    tenantId: user.tenantId,
    userId,
    persona: DEFAULT_PERSONA,
    selectedPlanKey,
    status: "in_progress",
  });
}

export async function startOnboarding(userId: string) {
  return ensureProfile(userId);
}

export async function updatePersona(userId: string, persona: Persona) {
  if (!PERSONAS.includes(persona)) {
    throw badRequest("Invalid persona");
  }
  const profile = await ensureProfile(userId);
  return updateOnboardingProfile(profile.id, {
    persona,
    status: "in_progress",
  });
}

export type PlanSelectionInput = {
  planKey: PlanKey;
  selectedModules?: Partial<PlanFeatureSet>;
};

export async function selectPlan(userId: string, input: PlanSelectionInput) {
  const profile = await ensureProfile(userId);
  const tenant = profile.tenant;
  const targetPlanDef = getPlanDefinition(input.planKey);
  const targetPlan = await findPlanByKey(targetPlanDef.key);
  if (!targetPlan) {
    throw badRequest("Plan not found");
  }

  const currentPlanId = tenant.planId ?? undefined;
  const modulesJson = input.selectedModules
    ? input.selectedModules
    : undefined;

  await finalizePlanSelection({
    tenantId: tenant.id,
    profileId: profile.id,
    targetPlanId: targetPlan.id,
    targetPlanKey: targetPlan.key,
    currentPlanId,
    modulesJson,
    changedByUserId: userId,
  });

  return {
    plan: targetPlan.key,
    overrides: input.selectedModules ?? null,
  };
}

export function getOnboardingOptions() {
  return {
    personas: PERSONAS,
    plans: Object.values(planDefinitions).map((plan: any) => ({
      key: plan.key,
      name: plan.name,
      description: plan.description,
      features: plan.features,
    })),
  };
}

export const onboardingService = {
  startOnboarding,
  updatePersona,
  selectPlan,
  getOnboardingOptions,
};
