// Usage Registry — Source of Truth for all measurable/billable events
// DO NOT add future or hypothetical features here. Only current, live usage types.
// All usages must be mapped to a feature, unit, and billable status. No string literals allowed.

// Stub for FEATURES to resolve missing import
export const FEATURES = {
  ADVANCED_AUTONOMY: "advanced_autonomy",
  MEDIA_STUDIO: "media_studio",
};

export const USAGE_METERS = {
  AI_RUN: {
    key: "ai.run",
    feature: FEATURES.ADVANCED_AUTONOMY,
    unit: "request",
    billable: true,
    limitKey: "ai_runs",
  },
  MEDIA_RENDER: {
    key: "media.render",
    feature: FEATURES.MEDIA_STUDIO,
    unit: "job",
    billable: true,
    limitKey: "media_jobs",
  },
  API_CALL: {
    key: "api.call",
    feature: null,
    unit: "request",
    billable: false,
  },
  // Add more usage types as needed, following the above pattern
} as const;

export type UsageMeterKey = keyof typeof USAGE_METERS;
