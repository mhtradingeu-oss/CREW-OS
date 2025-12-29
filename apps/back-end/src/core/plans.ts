export type PlanKey = "superapp-core" | "free" | "starter" | "pro" | "enterprise";

export type PlanFeatureSet = {
  aiLevel: "limited" | "basic" | "full";
  aiBrain: boolean;
  brandLimit: number;
  aiAssistant: boolean;
  automation: boolean;
  crm: boolean;
  pos: boolean;
  stand: boolean;
  pricing: boolean;
  marketing: boolean;
  inventory: boolean;
  finance: boolean;
  partner: boolean;
  dealer: boolean;
  competitor: boolean;
  loyalty: boolean;
  affiliate: boolean;
  socialIntelligence: boolean;
  influencerToolkit: boolean;
  voiceIVR: boolean;
  voiceIvr: boolean;
  mediaStudio: boolean;
  operations: boolean;
  notification: boolean;
  governance: boolean;
  aiInsights: boolean;
  whiteLabel: "none" | "limited" | "full";
  whiteLabelStudio: boolean;
  whiteLabelConfigurator: boolean;
  advancedAutonomy: boolean;
  advancedAiAutonomy: boolean;
};

export type PlanDefinition = {
  key: PlanKey;
  name: string;
  description: string;
  features: PlanFeatureSet;
};

export function normalizeFeatureAliases(features: PlanFeatureSet): PlanFeatureSet {
  const voiceIVR = features.voiceIVR ?? features.voiceIvr ?? false;
  const advancedAutonomy = features.advancedAutonomy ?? features.advancedAiAutonomy ?? false;
  const whiteLabelStudio = features.whiteLabelStudio ?? features.whiteLabelConfigurator ?? false;

  return {
    ...features,
    voiceIVR,
    voiceIvr: voiceIVR,
    advancedAutonomy,
    advancedAiAutonomy: advancedAutonomy,
    whiteLabelStudio,
    whiteLabelConfigurator: whiteLabelStudio,
  };
}

function definePlanFeatures(overrides: Partial<PlanFeatureSet> & { aiLevel?: PlanFeatureSet["aiLevel"] }): PlanFeatureSet {
  const base: PlanFeatureSet = {
    aiLevel: overrides.aiLevel ?? "limited",
    aiBrain: false,
    brandLimit: 1,
    aiAssistant: false,
    automation: false,
    crm: false,
    pos: false,
    stand: false,
    pricing: false,
    marketing: false,
    inventory: false,
    finance: false,
    partner: false,
    dealer: false,
    competitor: false,
    loyalty: false,
    affiliate: false,
    socialIntelligence: false,
    influencerToolkit: false,
    voiceIVR: false,
    voiceIvr: false,
    mediaStudio: false,
    operations: false,
    notification: false,
    governance: false,
    aiInsights: false,
    whiteLabel: "none",
    whiteLabelStudio: false,
    whiteLabelConfigurator: false,
    advancedAutonomy: false,
    advancedAiAutonomy: false,
  };

  return normalizeFeatureAliases({ ...base, ...overrides });
}

const PLAN_DEFINITIONS: Record<PlanKey, PlanDefinition> = {
  "superapp-core": {
    key: "superapp-core",
    name: "Superapp Core",
    description: "Minimal feature set for MH Trading UG and bootstrapped tenants.",
    features: definePlanFeatures({
      brandLimit: 3,
      aiLevel: "limited",
      aiBrain: false,
      aiAssistant: false,
      automation: true,
      crm: true,
      pos: false,
      stand: false,
      pricing: false,
      marketing: false,
      inventory: false,
      finance: false,
      partner: false,
      dealer: false,
      competitor: false,
      loyalty: true,
      affiliate: false,
      socialIntelligence: false,
      influencerToolkit: false,
      voiceIVR: false,
      mediaStudio: false,
      operations: false,
      notification: false,
      governance: false,
      aiInsights: false,
      whiteLabel: "none",
    }),
  },
  free: {
    key: "free",
    name: "Free",
    description: "Get started with limited AI and essential automation.",
    features: definePlanFeatures({
      brandLimit: 1,
      aiLevel: "limited",
      aiBrain: false,
      aiAssistant: false,
      automation: false,
      crm: false,
      pos: false,
      stand: false,
      pricing: false,
      marketing: false,
      inventory: false,
      finance: false,
      partner: false,
      dealer: false,
      competitor: false,
      loyalty: false,
      affiliate: false,
      socialIntelligence: false,
      influencerToolkit: false,
      voiceIVR: false,
      mediaStudio: false,
      operations: false,
      notification: false,
      governance: false,
      aiInsights: false,
      whiteLabel: "none",
    }),
  },
  starter: {
    key: "starter",
    name: "Starter",
    description: "Basic AI, automations, and brand-level insights.",
    features: definePlanFeatures({
      brandLimit: 2,
      aiLevel: "basic",
      aiBrain: false,
      aiAssistant: true,
      automation: true,
      crm: true,
      pos: false,
      stand: false,
      pricing: true,
      marketing: true,
      inventory: true,
      finance: true,
      partner: false,
      dealer: true,
      competitor: true,
      loyalty: true,
      affiliate: true,
      socialIntelligence: true,
      influencerToolkit: false,
      voiceIVR: false,
      mediaStudio: false,
      operations: true,
      notification: true,
      governance: true,
      aiInsights: true,
      whiteLabel: "none",
    }),
  },
  pro: {
    key: "pro",
    name: "Pro",
    description: "Full AI, CRM, POS, and limited white-label controls.",
    features: definePlanFeatures({
      brandLimit: 5,
      aiLevel: "full",
      aiBrain: true,
      aiAssistant: true,
      automation: true,
      crm: true,
      pos: true,
      stand: true,
      pricing: true,
      marketing: true,
      inventory: true,
      finance: true,
      partner: true,
      dealer: true,
      competitor: true,
      loyalty: true,
      affiliate: true,
      socialIntelligence: true,
      influencerToolkit: true,
      voiceIVR: true,
      mediaStudio: true,
      operations: true,
      notification: true,
      governance: true,
      aiInsights: true,
      whiteLabel: "limited",
      whiteLabelStudio: true,
      advancedAutonomy: true,
    }),
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    description: "All modules enabled with advanced white-label and Ops.",
    features: definePlanFeatures({
      brandLimit: 50,
      aiLevel: "full",
      aiBrain: true,
      aiAssistant: true,
      automation: true,
      crm: true,
      pos: true,
      stand: true,
      pricing: true,
      marketing: true,
      inventory: true,
      finance: true,
      partner: true,
      dealer: true,
      competitor: true,
      loyalty: true,
      affiliate: true,
      socialIntelligence: true,
      influencerToolkit: true,
      voiceIVR: true,
      mediaStudio: true,
      operations: true,
      notification: true,
      governance: true,
      aiInsights: true,
      whiteLabel: "full",
      whiteLabelStudio: true,
      advancedAutonomy: true,
    }),
  },
};

export function getPlanDefinition(key?: string): PlanDefinition {
  if (!key) {
    return PLAN_DEFINITIONS.free;
  }
  const planKey = key.toLowerCase() as PlanKey;
  return PLAN_DEFINITIONS[planKey] ?? PLAN_DEFINITIONS.free;
}

export function getFeaturesForPlan(key?: string): PlanFeatureSet {
  return getPlanDefinition(key).features;
}

export const planDefinitions = PLAN_DEFINITIONS;
