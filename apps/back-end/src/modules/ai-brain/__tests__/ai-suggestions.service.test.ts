import { env } from "../../../core/config/env.js";
import { prisma } from "../../../core/prisma.js";
import * as healthChecks from "../../../core/health/checks.js";
import { aiSuggestionsService } from "../ai-suggestions/ai-suggestions.service.js";
import { validateSuggestionsPayload } from "../ai-suggestions/ai-suggestions.guard.js";
import {
  AI_SUGGESTIONS_VERSION,
  AI_SUGGESTIONS_DECLARATION,
  AI_SUGGESTIONS_OUTPUT_TYPE,
} from "../ai-suggestions/ai-suggestions.constants.js";

const now = new Date();
const sampleEvent = {
  id: "event-1",
  module: "pricing",
  type: "pricing.updated",
  severity: "warning",
  source: "api",
  createdAt: now,
  metaJson: JSON.stringify({ action: "pricing.update" }),
};
const sampleRun = {
  id: "run-1",
  ruleId: "rule-1",
  ruleVersionId: "version-1",
  eventName: "pricing.updated",
  status: "FAILED",
  createdAt: now,
  startedAt: new Date(now.getTime() - 1_000),
  finishedAt: now,
  errorJson: { message: "boom" },
  rule: { brandId: "brand-test" },
};

describe("AI suggestions advisory layer", () => {
  beforeEach(() => {
    env.AI_SUGGESTIONS_ENABLED = true;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("generates deterministic suggestions without writes", async () => {
    jest.spyOn(prisma.activityLog, "findMany").mockResolvedValue([sampleEvent] as any);
    jest.spyOn(prisma.automationRun, "findMany").mockResolvedValue([sampleRun] as any);
    jest.spyOn(healthChecks, "runDatabaseCheck").mockResolvedValue({ ok: true });
    const createSpy = jest.spyOn(prisma.activityLog, "create");

    const result = await aiSuggestionsService.getSuggestions({ brandId: "brand-test", correlationId: "corr" });

    expect(result.payload.suggestions.length).toBeGreaterThan(0);
    expect(result.payload.snapshotHash).toBeDefined();
    expect(result.snapshot.events.items.length).toBeGreaterThan(0);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("guard rejects execution hints", () => {
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
