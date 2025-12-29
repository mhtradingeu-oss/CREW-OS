// Onboarding extra DTOs migrated from frontend

export type PricingStrategy = "PREMIUM" | "COMPETITIVE" | "PENETRATION" | "AI";

export interface ProductPricingDTO {
  productIdOrTempId: string;
  cogs: number;
  strategy: PricingStrategy;
  b2cNet: number;
  b2cGross: number;
  dealerNet?: number;
  amazonNet?: number;
  uvpNet?: number;
  vatPct?: number;
  productId?: string;
}

export interface PricingSetupDTO {
  items: ProductPricingDTO[];
}

export interface PricingOutput {
  b2cNet: number;
  b2cGross: number;
  dealerNet: number;
  amazonNet: number;
  uvpNet: number;
  fullCost: number;
  vatPct: number;
}

export interface ProductSetupDTO {
  products: import("./index.js").ProductDTO[];
}

export type MarketingChannel =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "youtube"
  | "amazon"
  | "stands"
  | "email"
  | "website";

export interface MarketingPostDTO {
  channel: MarketingChannel;
  title: string;
  caption: string;
  suggestedMediaType: string;
  scheduleHint?: string;
}

export interface MarketingVideoIdeaDTO {
  channel: MarketingChannel;
  hook: string;
  scriptOutline: string;
  durationHint?: string;
}

export interface MarketingPlanDTO {
  posts: MarketingPostDTO[];
  videos: MarketingVideoIdeaDTO[];
  ideas: string[];
}

export interface OnboardingSummary {
  pathChoice?: import("./index.js").PathChoice;
  persona?: import("./index.js").PersonaChoice;
  goals?: import("./index.js").OnboardingGoal[];
  planSuggestion?: import("./index.js").PlanSuggestion;
  brandDefinition?: import("./index.js").BrandDefinitionDTO;
  productSetup?: ProductSetupDTO;
  pricingSetup?: PricingSetupDTO;
  products: import("./index.js").ProductEntry[];
  pricing?: PricingOutput;
  marketingPlan?: MarketingPlanDTO;
  finalizedBrandId?: string;
  wizardCompleted?: boolean;
  onboardingStatus?: import("./index.js").OnboardingStatus;
}

export interface BrandCreatedResponse {
  brandId: string;
}

export interface ProductCreatedResponse {
  id: string;
  tempId?: string;
  name: string;
}

export interface OnboardingLearningPayload {
  brandId: string;
  pathChoice?: import("./index.js").PathChoice;
  persona?: import("./index.js").PersonaChoice;
  goals?: import("./index.js").OnboardingGoal[];
  planSuggestion?: import("./index.js").PlanSuggestion;
  brandDefinition: import("./index.js").BrandDefinitionDTO;
  products: ProductCreatedResponse[];
  pricing: ProductPricingDTO[];
  marketingPlan?: MarketingPlanDTO;
}

export interface OnboardingStartResponse {
  persona: string | null;
  goals: string[];
  status: import("./index.js").OnboardingStatus;
}
