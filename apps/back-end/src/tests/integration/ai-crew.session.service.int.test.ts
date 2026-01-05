import { describe, it, test, expect } from "@jest/globals";
const hasValidDbUrlForAiCrewSessionServiceIntTest =
  typeof process.env.DATABASE_URL_TEST === "string" &&
  (process.env.DATABASE_URL_TEST.startsWith("postgres://") ||
    process.env.DATABASE_URL_TEST.startsWith("postgresql://"));

if (!hasValidDbUrlForAiCrewSessionServiceIntTest) {
  describe("integration skipped", () => {
    test.skip("skipped because DATABASE_URL_TEST is not configured", () => {
      console.warn("Skipping integration test: DATABASE_URL_TEST not set");
    });
  });
} else {
  describe("integration", () => {
    let prisma: any;
    let AICrewSessionService: any;
    let AICrewServiceModule: any;

    const baseInput = {
      questions: [
        { scopes: ["sales"], question: "How to increase sales?", agentNames: ["agent1"] },
        { scopes: ["finance"], question: "How to decrease costs?", agentNames: ["agent2"] },
      ],
      requestedBy: { userId: "u1", role: "admin" },
    };

    beforeAll(async () => {
      prisma = (await import("../../core/prisma.js")).prisma;
      const sessionModule = await import("../../ai/crew/ai-crew.session.service.js");
      AICrewSessionService = sessionModule.AICrewSessionService;
      AICrewServiceModule = await import("../../ai/crew/ai-crew.service.js");
      jest
        .spyOn(AICrewServiceModule.AICrewService.prototype, "runAdvisory")
        .mockImplementation(async (args: any) => {
          const { question, agentNames } = args;
          const topic = question.includes("sales") ? "sales" : "costs";
          const verb = question.includes("increase")
            ? "increase"
            : question.includes("decrease")
            ? "decrease"
            : "adjust";
          return {
            summary: "mock summary",
            recommendations: [`${verb} ${topic}`, `${topic} standardization`],
            agentsUsed: agentNames && agentNames.length ? agentNames : ["agent1"],
            evidence: [
              {
                agent: agentNames?.[0] ?? "agent1",
                analysis: "mock analysis",
                contextUsed: ["contextA"],
                risks: ["risk Y"],
                assumptions: ["assume X"],
              },
            ],
            confidence: question.includes("conflict") ? 0.7 : 0.8,
          };
        });
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

    describe("AICrewSessionService", () => {
      it("runs questions sequentially and deterministically", async () => {
        const result = await AICrewSessionService.runAdvisorySession(baseInput);
        expect(result.perQuestion.length).toBe(2);
        expect(result.perQuestion[0]?.result.recommendations?.[0]).toBe("increase sales");
        expect(result.perQuestion[1]?.result.recommendations?.[0]).toBe("decrease costs");
      });

      it("enforces max 10 questions", async () => {
        const input = { ...baseInput, questions: Array(11).fill(baseInput.questions[0]) };
        await expect(AICrewSessionService.runAdvisorySession(input)).rejects.toThrow("Must provide 1-10 questions");
      });

      it("enforces max 3 agents per question", async () => {
        const input = { ...baseInput, questions: [{ ...baseInput.questions[0], agentNames: ["a", "b", "c", "d"] }] };
        await expect(AICrewSessionService.runAdvisorySession(input as any)).rejects.toThrow("Max 3 agents per question");
      });

      it("deduplicates crossInsights deterministically", async () => {
        const input = {
          ...baseInput,
          questions: [
            { scopes: ["s"], question: "How to increase sales?", agentNames: ["agent1"] },
            { scopes: ["s"], question: "How to increase sales?", agentNames: ["agent2"] },
          ],
        };
        const result = await AICrewSessionService.runAdvisorySession(input);
        expect(result.crossInsights.length).toBeGreaterThanOrEqual(1);
      });

      it("reduces confidence for conflicts", async () => {
        const input = {
          ...baseInput,
          questions: [
            { scopes: ["s"], question: "How to increase sales? (conflict)", agentNames: ["agent1"] },
            { scopes: ["s"], question: "How to decrease sales? (conflict)", agentNames: ["agent2"] },
          ],
        };
        const result = await AICrewSessionService.runAdvisorySession(input);
        expect(result.confidence).toBeLessThan(0.8);
        expect(result.conflicts.length).toBeGreaterThanOrEqual(1);
      });

      it("stores only question hashes, not raw text", async () => {
        const input = { ...baseInput, sessionId: "test-session" };
        await AICrewSessionService.runAdvisorySession(input);
        const mem = AICrewSessionService.getSession("test-session");
        expect(mem).toBeDefined();
        expect(mem?.questionHashes[0]?.hash).toMatch(/^[a-f0-9]{64}$/);
        expect(mem?.questionHashes[0]).not.toHaveProperty("question");
      });

      it("rejects invalid input (question length)", async () => {
        const input = { ...baseInput, questions: [{ scopes: ["s"], question: "short" }] };
        await expect(AICrewSessionService.runAdvisorySession(input)).rejects.toThrow("Question length 10-2000 chars");
      });
    });
  });
}
