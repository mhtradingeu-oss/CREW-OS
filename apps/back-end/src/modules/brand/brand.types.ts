export interface BrandSettings {
  metadata?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  linkedUserIds?: string[];
  [key: string]: unknown;
}

export interface CreateBrandInput {
  name: string;
  slug: string;
  description?: string | null;
  countryOfOrigin?: string | null;
  defaultCurrency?: string | null;
  metadata?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  userIds?: string[];
  tenantId?: string | null;
}

export interface UpdateBrandInput extends Partial<CreateBrandInput> {}

export interface BrandCreatedPayload {
  id: string;
  name: string;
}

export interface BrandResponse {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  countryOfOrigin?: string | null;
  defaultCurrency?: string | null;
  settings: BrandSettings;
  tenantId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandIdentityResponse {
  brandId: string;
  vision?: string;
  mission?: string;
  values?: string;
  toneOfVoice?: string;
  persona?: string;
  brandStory?: string;
  keywords?: string;
  colorPalette?: string;
  packagingStyle?: string;
  socialProfiles?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandIdentityInput {
  vision?: string | null;
  mission?: string | null;
  values?: string | null;
  toneOfVoice?: string | null;
  persona?: string | null;
  brandStory?: string | null;
  keywords?: string | null;
  colorPalette?: string | null;
  packagingStyle?: string | null;
  socialProfiles?: Record<string, string> | null;
}

export interface BrandAiIdentityResponse {
  id: string;
  summary: string;
  details: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandRulesResponse {
  brandId: string;
  namingRules?: string | null;
  descriptionRules?: string | null;
  marketingRules?: string | null;
  discountRules?: string | null;
  pricingConstraints?: string | null;
  restrictedWords?: string | null;
  allowedWords?: string | null;
  aiRestrictions?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandAIConfigResponse {
  brandId: string;
  aiPersonality?: string | null;
  aiTone?: string | null;
  aiContentStyle?: string | null;
  aiPricingStyle?: string | null;
  aiEnabledActions?: string[] | null;
  aiBlockedTopics?: string[] | null;
  aiModelVersion?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedBrands {
  items: BrandResponse[];
  total: number;
  page: number;
  pageSize: number;
}
