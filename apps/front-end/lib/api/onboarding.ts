// V1 PLACEHOLDER — EXECUTION DISABLED
// All API logic is disabled for V1 read-only build.
import type {
  BrandCreatedResponse,
  BrandDefinitionDTO,
  MarketingPlanDTO,
  OnboardingStartResponse,
  ProductCreatedResponse,
  ProductDTO,
  ProductEntry,
  ProductPricingDTO,
  PricingSetupDTO,
} from "@/types/onboarding.types";
import type {
  OnboardingCompleteDto,
  OnboardingGoalsDto,
  OnboardingPersonaDto,
  OnboardingPlanSuggestionDto,
  OnboardingStartDto,
} from "@mh-os/shared";


/**
 * Placeholder API clients that call the onboarding backend endpoints.
 */

export async function fetchBrandProducts(_brandId: string): Promise<ProductEntry[]> {
  return [];
}

export async function createBrand(_payload: BrandDefinitionDTO): Promise<null> {
  return null;
}

export async function createProducts(_brandId: string, _products: ProductDTO[]): Promise<null> {
  return null;
}

export async function previewPricing(payload: PricingSetupDTO) {
  const { data } = await api.post("/pricing/preview", payload);
  return data;
}

export async function createPricingDrafts(brandId: string, pricing: ProductPricingDTO[]) {
  const { data } = await api.post(`/pricing/drafts`, {
    brandId,
    pricing,
  });
  return data;
}

export async function createMarketingPlan(brandId: string, plan: MarketingPlanDTO) {
  const { data } = await api.post(`/marketing/content-plan`, {
    brandId,
    plan,
  });
  return data;
}

// New F2 onboarding endpoints
export async function getOnboardingStart() {
  const { data } = await api.get<OnboardingStartDto>("/onboarding/start");
  return data as OnboardingStartResponse;
}

export async function postOnboardingPersona(payload: OnboardingPersonaDto) {
  await api.post("/onboarding/persona", payload);
  return payload;
}

export async function postOnboardingGoals(payload: OnboardingGoalsDto) {
  await api.post("/onboarding/goals", payload);
  return payload;
}

export async function getOnboardingPlanSuggestion() {
  const { data } = await api.get<OnboardingPlanSuggestionDto>("/onboarding/plan-suggestion");
  return data;
}

export async function completeOnboarding(payload: OnboardingCompleteDto = {}) {
  await api.post("/onboarding/complete", payload);
}
