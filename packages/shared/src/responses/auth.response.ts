export type PlanTier = "free" | "starter" | "pro" | "enterprise";

export type PlanFeatures = {
  aiLevel: "limited" | "basic" | "full";
  aiBrain: boolean;
  aiAssistant: boolean;
  automation: boolean;
  crm: boolean;
  pos: boolean;
  stand: boolean;
  whiteLabel: "none" | "limited" | "full";
  socialIntelligence: boolean;
  loyalty: boolean;
  aiInsights: boolean;
};

export interface PlanInfo {
  key: PlanTier;
  name: string;
  description: string;
  features: PlanFeatures;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  planKey: PlanTier;
  defaultBrandId?: string;
}

export interface BrandInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface AuthSessionUser {
  id: string;
  email: string;
  role: string;
  name?: string;
  status: string;
  permissions: string[];
  roles: string[];
  tenantId?: string;
  brandId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSessionResponse {
  user: AuthSessionUser;
  tenant: TenantInfo | null;
  brand: BrandInfo | null;
  plan: PlanInfo;
  brandsAvailable: BrandInfo[];
}
