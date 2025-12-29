// All domain types have been moved to @mh-os/shared. Only UI/View/Props types may remain here.

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
  products: ProductDTO[];
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
  pathChoice?: PathChoice;
  persona?: PersonaChoice;
  goals?: OnboardingGoal[];
  planSuggestion?: PlanSuggestion;
  brandDefinition?: BrandDefinitionDTO;
  productSetup?: ProductSetupDTO;
  pricingSetup?: PricingSetupDTO;
  products: ProductEntry[];
  pricing?: PricingOutput;
  marketingPlan?: MarketingPlanDTO;
  finalizedBrandId?: string;
  wizardCompleted?: boolean;
  onboardingStatus?: OnboardingStatus;
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
  pathChoice?: PathChoice;
  persona?: PersonaChoice;
  goals?: OnboardingGoal[];
  planSuggestion?: PlanSuggestion;
  brandDefinition: BrandDefinitionDTO;
  products: ProductCreatedResponse[];
  pricing: ProductPricingDTO[];
  marketingPlan?: MarketingPlanDTO;
}

export interface OnboardingStartResponse {
  persona: string | null;
  goals: string[];
  status: OnboardingStatus;
}
