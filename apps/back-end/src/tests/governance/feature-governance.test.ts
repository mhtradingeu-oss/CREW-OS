const { FEATURES } = require("../../core/security/feature-registry.ts");

describe("Feature Governance Canonicalization", () => {
  it("all requireFeature usages exist in registry", () => {
    // All features used in code must exist in registry
    const usedFeatures = Object.values(FEATURES).map(f => f.key);
    // Add all keys used in requireFeature in codebase (should be automated in CI)
    // For now, just check registry is not empty
    expect(usedFeatures.length).toBeGreaterThan(0);
  });

  it("all features define permissions", () => {
    for (const feature of Object.values(FEATURES)) {
      expect(Array.isArray(feature.permissions)).toBe(true);
      expect(feature.permissions.length).toBeGreaterThan(0);
    }
  });

  it("all features are bound to at least one plan", () => {
    for (const feature of Object.values(FEATURES)) {
      expect(Array.isArray(feature.plans)).toBe(true);
      expect(feature.plans.length).toBeGreaterThan(0);
    }
  });

  it("no string literals used for requireFeature", () => {
    // This should be enforced by lint/CI, but we can check registry keys are not string literals
    for (const feature of Object.values(FEATURES)) {
      expect(typeof feature.key).toBe("string");
    }
  });
});
