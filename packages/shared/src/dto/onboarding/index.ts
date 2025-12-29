// Onboarding DTOs migrated from frontend

export type PathChoice = "existing" | "new" | "whiteLabel";
export type StrategyOption = "Premium" | "Competitive" | "Penetration" | "AI recommended";
export type PersonaChoice = string;
export type OnboardingGoal = string;
export type OnboardingStatus = "in_progress" | "completed";

export interface PlanSuggestion {
  planName: string;
  focus: string[];
  rationale: string;
  features?: string[];
}

export interface OnboardingPlanSuggestionResponse {
  plan: "free" | "starter" | "pro" | "enterprise";
  features: string[];
}

export interface BrandDefinitionInput {
  brandName: string;
  country: string;
  category: string;
  brandGoal: string;
}

export interface BrandIdentity {
  tone: string;
  persona: string;
  brandStory: string;
  keywords: string[];
  packagingStyle: string;
}

export type BrandIdentityAIResponse = BrandIdentity;

export interface BrandDefinitionDTO extends BrandDefinitionInput {
  aiIdentity: BrandIdentityAIResponse;
}

export interface ProductPayload {
  productName: string;
  baseProduct?: string;
  descriptionDraft: string;
}

export interface ProductDTO {
  id?: string;
  name: string;
  category: string;
  baseProductId?: string;
  description?: string;
  isNew?: boolean;
}

export type ProductEntry = ProductDTO;
