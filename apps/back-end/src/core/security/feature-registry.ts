// Canonical Feature Registry (Phase 2D)
// DO NOT EDIT FEATURES OUTSIDE THIS FILE

import { PERMISSIONS } from "./permission-registry.js";

export const FEATURES = {
  MEDIA_STUDIO: {
    key: "MEDIA_STUDIO",
    permissions: [PERMISSIONS.AI.READ, PERMISSIONS.AI.RUN, PERMISSIONS.MEDIA.READ],
    plans: ["PRO", "ENTERPRISE"] as readonly string[],
    audit: true,
  },
  PRICING: {
    key: "PRICING",
    permissions: [PERMISSIONS.PRICING.READ, PERMISSIONS.PRICING.MANAGE],
    plans: ["PRO", "ENTERPRISE"] as readonly string[],
    audit: true,
  },
  DEALER: {
    key: "DEALER",
    permissions: [PERMISSIONS.DEALERS.READ, PERMISSIONS.DEALERS.MANAGE],
    plans: ["PRO", "ENTERPRISE"] as readonly string[],
    audit: true,
  },
  INFLUENCER_TOOLKIT: {
    key: "INFLUENCER_TOOLKIT",
    permissions: [PERMISSIONS.INFLUENCER.READ, PERMISSIONS.INFLUENCER.MANAGE],
    plans: ["PRO", "ENTERPRISE"] as readonly string[],
    audit: true,
  },
  AUTOMATION: {
    key: "AUTOMATION",
    permissions: [PERMISSIONS.AUTOMATION.RUN, PERMISSIONS.AUTOMATION.MANAGE],
    plans: ["ENTERPRISE"] as readonly string[],
    audit: true,
  },
  COMPETITOR: {
    key: "COMPETITOR",
    permissions: [PERMISSIONS.COMPETITOR.READ],
    plans: ["PRO"] as readonly string[],
    audit: true,
  },
  ADVANCED_AUTONOMY: {
    key: "ADVANCED_AUTONOMY",
    permissions: [PERMISSIONS.AI.MANAGE, PERMISSIONS.AUTOMATION.RUN],
    plans: ["ENTERPRISE"] as readonly string[],
    audit: true,
  },
  GOVERNANCE: {
    key: "GOVERNANCE",
    permissions: [PERMISSIONS.BRAND.READ, PERMISSIONS.BRAND.DELETE],
    plans: ["ENTERPRISE"] as readonly string[],
    audit: true,
  },
  AI_INSIGHTS: {
    key: "AI_INSIGHTS",
    permissions: [PERMISSIONS.AI.READ, PERMISSIONS.AI.MANAGE],
    plans: ["PRO", "ENTERPRISE"] as readonly string[],
    audit: true,
  },
  MARKETING: {
    key: "MARKETING",
    permissions: [PERMISSIONS.MARKETING.READ, PERMISSIONS.MARKETING.UPDATE],
    plans: ["PRO", "ENTERPRISE"] as readonly string[],
    audit: true,
  },
  STAND: {
    key: "STAND",
    permissions: [PERMISSIONS.STAND.READ],
    plans: ["PRO", "ENTERPRISE"] as readonly string[],
    audit: true,
  },
  PARTNER: {
    key: "PARTNER",
    permissions: [PERMISSIONS.PARTNER.READ],
    plans: ["PRO", "ENTERPRISE"] as readonly string[],
    audit: true,
  },
  OPERATIONS: {
    key: "OPERATIONS",
    permissions: [PERMISSIONS.OPERATIONS.READ],
    plans: ["ENTERPRISE"] as readonly string[],
    audit: true,
  },
  VOICE_IVR: {
    key: "VOICE_IVR",
    permissions: [PERMISSIONS.COMMUNICATION.SEND],
    plans: ["ENTERPRISE"] as readonly string[],
    audit: true,
  },
  LOYALTY: {
    key: "LOYALTY",
    permissions: [PERMISSIONS.LOYALTY.READ],
    plans: ["PRO", "ENTERPRISE"] as readonly string[],
    audit: true,
  },
  CRM: {
    key: "CRM",
    permissions: [PERMISSIONS.CRM.READ, PERMISSIONS.CRM.UPDATE],
    plans: ["PRO", "ENTERPRISE"] as readonly string[],
    audit: true,
  },
  WHITE_LABEL_STUDIO: {
    key: "WHITE_LABEL_STUDIO",
    permissions: [PERMISSIONS.AI_MONITORING.WHITE_LABEL_RUN],
    plans: ["ENTERPRISE"] as readonly string[],
    audit: true,
  },
} as const;

// Only string keys allowed for FeatureKey
export type FeatureKey = Extract<keyof typeof FEATURES, string>;
