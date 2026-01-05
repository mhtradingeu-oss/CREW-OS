import { describe, it, test, expect } from "@jest/globals";
import { env } from "../../../core/config/env.js";
import { aiSuggestionsService } from "../ai-suggestions/ai-suggestions.service.js";
import { validateSuggestionsPayload } from "../ai-suggestions/ai-suggestions.guard.js";
import {
  AI_SUGGESTIONS_VERSION,
  AI_SUGGESTIONS_DECLARATION,
  AI_SUGGESTIONS_OUTPUT_TYPE,
} from "../ai-suggestions/ai-suggestions.constants.js";

beforeAll(() => {
  process.env.AI_READ_ONLY_ENABLED = "true";
});
process.env.AI_READ_ONLY_ENABLED = "true";
process.env.NODE_ENV = "test";

describe("AI suggestions advisory layer", () => {
  beforeEach(() => {
    env.AI_SUGGESTIONS_ENABLED = true;
  });


  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    delete process.env.AI_READ_ONLY_ENABLED;
  });

  it("generates deterministic suggestions without writes", async () => {
    const result = await aiSuggestionsService.getSuggestions({ brandId: "brand-test", correlationId: "corr" });

    expect(result.payload.suggestions.length).toBeGreaterThan(0);
    expect(result.payload.snapshotHash).toBeDefined();
    expect(result.snapshot.events.moduleBreakdown.length).toBeGreaterThan(0);
  });

  it("guard rejects execution hints", () => {
    const now = new Date();
    const payload = {
      version: AI_SUGGESTIONS_VERSION,
      declaration: AI_SUGGESTIONS_DECLARATION,
      generatedAt: now.toISOString(),
      snapshotHash: "hash",
      suggestions: [
        {
          id: "risk-1",
          type: "risk",
          confidence: 0.5,
          rationale: "Errors observed",
          evidence: ["Test"],
          suggestedAction: "Execute the pipeline",
          approvalMetadata: {
            requiredRole: "BRAND_ADMIN",
            approvalChannel: "ai-suggestions",
          },
          auditMetadata: { snapshotHash: "hash", suggestionHash: "abc" },
        },
      ],
      riskFlags: [],
      improvementIdeas: [],
      metadata: {
        aiVersion: AI_SUGGESTIONS_VERSION,
        outputType: AI_SUGGESTIONS_OUTPUT_TYPE,
        inputSizeBytes: 1,
        durationMs: 1,
      },
    };

    expect(() => validateSuggestionsPayload(payload)).toThrow();
  });
});
