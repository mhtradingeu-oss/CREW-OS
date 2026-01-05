import { AI_AGENTS_MANIFEST, validateManifestIntegrity } from "../../ai/schema/ai-agents-manifest.js";

describe("AI agent manifest integrity", () => {
  it("validates the official manifest", () => {
    expect(() => validateManifestIntegrity(AI_AGENTS_MANIFEST)).not.toThrow();
  });

  it("rejects priority-1 agents with operator autonomy without explicit override", () => {
    const baseAgent = AI_AGENTS_MANIFEST[0];
    const priorityOverride = {
      ...baseAgent,
      name: "priority-one-operator-test",
      scope: "priority-one-operator-test",
      priority: 1,
      autonomyLevel: "operator",
    };

    expect(() => validateManifestIntegrity([...AI_AGENTS_MANIFEST, priorityOverride])).toThrow(
      /priority-1 agents cannot have operator-level autonomy/i,
    );
  });
});
