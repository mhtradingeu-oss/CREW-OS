import { describe, it, test, expect } from "@jest/globals";
const hasValidDbUrlForExecutionIntentServiceIntTest =
  typeof process.env.DATABASE_URL_TEST === "string" &&
  (process.env.DATABASE_URL_TEST.startsWith("postgres://") ||
    process.env.DATABASE_URL_TEST.startsWith("postgresql://"));

if (!hasValidDbUrlForExecutionIntentServiceIntTest) {
  describe("integration skipped", () => {
    test.skip("skipped because DATABASE_URL_TEST is not configured", () => {
      console.warn("Skipping integration test: DATABASE_URL_TEST not set");
    });
  });
} else {
  describe("integration", () => {
    let prisma: any;
    let createExecutionIntentFromDecision: any;
    let approveExecutionIntent: any;
    let rejectExecutionIntent: any;
    let getHandoffPayload: any;
    let deleteExecutionIntent: any;

    beforeAll(async () => {
      prisma = (await import("../../core/prisma.js")).prisma;
      jest.mock("uuid", () => ({ v4: () => "mocked-uuid" }));
      const svc = await import("../../ai/execution-intent/execution-intent.service.js");
      createExecutionIntentFromDecision = svc.createExecutionIntentFromDecision;
      approveExecutionIntent = svc.approveExecutionIntent;
      rejectExecutionIntent = svc.rejectExecutionIntent;
      getHandoffPayload = svc.getHandoffPayload;
      const store = await import("../../ai/execution-intent/execution-intent.store.js");
      deleteExecutionIntent = store.deleteExecutionIntent;
    });

    afterEach(() => {
      deleteExecutionIntent("mocked-uuid");
    });

    afterAll(async () => {
      jest.restoreAllMocks();
      if (prisma?.$disconnect) {
        await prisma.$disconnect();
      }
    });

    it("placeholder to satisfy Jest", () => {
      expect(true).toBe(true);
    });

    describe("ExecutionIntent Service", () => {
      const baseDecision = {
        scope: "pricing",
        intent: "REQUIRE_APPROVAL" as const,
        decision: "Increase price by 5% on SKU-123",
        proposedBy: "pricing-primary-agent",
        supportingAgents: ["finance-advisor", "market-analyst"],
        confidence: 0.8,
        riskLevel: "medium" as const,
        requiresApproval: true,
        status: "PENDING_APPROVAL" as const,
        assumptions: ["Market demand stable"],
        risks: ["Competitor reaction"],
        decisionId: "dec-base",
        createdAt: new Date().toISOString(),
      };

      function makeDecision(overrides = {}) {
        return {
          ...baseDecision,
          decisionId: `dec-${Math.random().toString(36).slice(2)}`,
          createdAt: new Date().toISOString(),
          ...overrides,
        };
      }

      it("blocks intent if decision is blocked", () => {
        const decision = makeDecision({ status: "BLOCKED" });
        const intent = createExecutionIntentFromDecision(decision, { userId: "u1", role: "admin" });
        expect(intent.safety.blocked).toBe(true);
        expect(intent.safety.reasons.length).toBeGreaterThan(0);
      });

      it("always enforces constraints disabled flags", () => {
        const decision = makeDecision();
        const intent = createExecutionIntentFromDecision(decision, { userId: "u1", role: "admin" });
        expect(intent.constraints.executionDisabled).toBe(true);
        expect(intent.constraints.automationDisabled).toBe(true);
        expect(intent.constraints.mediaDisabled).toBe(true);
        expect(intent.constraints.audioDisabled).toBe(true);
      });

      it("starts approval as PENDING and handoff is unavailable", () => {
        const decision = makeDecision();
        const intent = createExecutionIntentFromDecision(decision, { userId: "u1", role: "admin" });
        expect(intent.approval.status).toBe("PENDING");
        expect(getHandoffPayload(intent.intentId)).toBeUndefined();
      });

      it("approve transitions to APPROVED; handoff payload is available", () => {
        const decision = makeDecision();
        const intent = createExecutionIntentFromDecision(decision, { userId: "u1", role: "admin" });
        approveExecutionIntent(intent.intentId, "approver", "ok");
        const handoff = getHandoffPayload(intent.intentId);
        expect(handoff).toBeDefined();
        expect(handoff?.status).toBe("APPROVED");
        expect(handoff?.banner).toContain("PHASE 8.0: Execution disabled");
      });

      it("reject transitions to REJECTED and handoff stays undefined", () => {
        const decision = makeDecision();
        const intent = createExecutionIntentFromDecision(decision, { userId: "u1", role: "admin" });
        rejectExecutionIntent(intent.intentId, "approver", "no");
        expect(getHandoffPayload(intent.intentId)).toBeUndefined();
      });

      it("produces deterministic plans for identical inputs", () => {
        const decision = makeDecision();
        const intentA = createExecutionIntentFromDecision(decision, { userId: "u1", role: "admin" });
        deleteExecutionIntent(intentA.intentId);
        const intentB = createExecutionIntentFromDecision(decision, { userId: "u1", role: "admin" });
        expect(intentA.plan).toEqual(intentB.plan);
      });
    });
  });
}
