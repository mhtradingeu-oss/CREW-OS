// Canonical Plan Registry for Phase 2E
// Defines PlanCode, LimitKey, and PLAN_REGISTRY
// Only includes plans/features/limits present in the current codebase

import { FEATURES } from "../security/feature-registry.js";


export type PlanCode = "FREE" | "PRO" | "ENTERPRISE";
export type LimitKey = "AI_RUNS_PER_DAY" | "AUTOMATION_RUNS_PER_DAY" | "MEDIA_EXPORTS_PER_MONTH";

import type { FeatureKey } from "../security/feature-registry.js";

export interface PlanEntitlements {
  features: Set<FeatureKey>;
  limits: Partial<Record<LimitKey, number>>;
}

export const PLAN_REGISTRY: Record<PlanCode, PlanEntitlements> = {
  FREE: {
    features: new Set([
      // Add other free features from FEATURES registry
    ]),
    limits: {
      AI_RUNS_PER_DAY: 5,
      AUTOMATION_RUNS_PER_DAY: 2,
      MEDIA_EXPORTS_PER_MONTH: 1,
    },
  },
  PRO: {
    features: new Set([
      // Add other pro features from FEATURES registry
    ]),
    limits: {
      AI_RUNS_PER_DAY: 50,
      AUTOMATION_RUNS_PER_DAY: 20,
      MEDIA_EXPORTS_PER_MONTH: 10,
    },
  },
  ENTERPRISE: {
    features: new Set([
      // Add other enterprise features from FEATURES registry
    ]),
    limits: {
      AI_RUNS_PER_DAY: 500,
      AUTOMATION_RUNS_PER_DAY: 200,
      MEDIA_EXPORTS_PER_MONTH: 100,
    },
  },
};
