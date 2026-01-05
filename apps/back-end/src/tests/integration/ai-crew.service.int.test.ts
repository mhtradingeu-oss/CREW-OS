import { describe, it, test, expect } from "@jest/globals";

const hasValidDbUrlForAiCrewServiceIntTest =
  typeof process.env.DATABASE_URL_TEST === "string" &&
  (process.env.DATABASE_URL_TEST.startsWith("postgres://") ||
    process.env.DATABASE_URL_TEST.startsWith("postgresql://"));

if (!hasValidDbUrlForAiCrewServiceIntTest) {
  describe("integration skipped", () => {
    test.skip("skipped because DATABASE_URL_TEST is not configured", () => {
      console.warn("Skipping integration test: DATABASE_URL_TEST not set");
    });
  });
} else {
  describe("integration", () => {
    let prisma: any;
    let AI_AGENTS_MANIFEST: any;
    let service: any;
    let baseInput: any;

    beforeAll(async () => {
      prisma = (await import("../../core/prisma.js")).prisma;
      const manifestModule = await import("../../ai/schema/ai-agents-manifest.js");
      AI_AGENTS_MANIFEST = manifestModule.AI_AGENTS_MANIFEST;
      const module = await import("../../ai/crew/ai-crew.service.js");
      service = new module.AICrewService();
      baseInput = {
        scopes: ["pricing"],
        question: "What is the safest advisory action for this scenario?",
        requestedBy: { userId: "user-1", role: "admin" },
      };
    });

    afterAll(async () => {
      if (prisma?.$disconnect) {
        await prisma.$disconnect();
      }
    });

    it("placeholder to satisfy Jest", () => {
      expect(true).toBe(true);
    });

    describe("AICrewService.runAdvisory", () => {
      it("uses only agentNames when provided (without auto scope selection)", async () => {
        const agentNames = AI_AGENTS_MANIFEST.slice(0, 2).map((agent: any) => agent.name);
        const result = await service.runAdvisory({ ...baseInput, agentNames });
        expect(result.agentsUsed?.slice().sort()).toEqual(agentNames.slice().sort());
      });

      it("enforces a max of 3 agents even when more names are supplied", async () => {
        const agentNames = AI_AGENTS_MANIFEST.slice(0, 10).map((agent: any) => agent.name);
        const result = await service.runAdvisory({ ...baseInput, agentNames });
        expect(result.agentsUsed.length).toBeLessThanOrEqual(3);
      });

      it("flags agents with forbidden actions instead of executing them", async () => {
        const forbiddenAgent = {
          ...AI_AGENTS_MANIFEST[0],
          name: "forbidden-agent",
          allowedActions: ["execute", "analyze"],
        };
        AI_AGENTS_MANIFEST.unshift(forbiddenAgent);
        try {
          const result = await service.runAdvisory({ ...baseInput, agentNames: [forbiddenAgent.name] });
          const evidence = result.evidence.find((item: any) => item.agent === forbiddenAgent.name);
          expect(evidence?.analysis).toMatch(/not permitted/i);
        } finally {
          AI_AGENTS_MANIFEST.shift();
        }
      });

      it("continues to report recommendations even when a context builder is missing", async () => {
        const contextAgent = {
          ...AI_AGENTS_MANIFEST[0],
          name: "ctx-fail-agent",
          allowedActions: ["analyze"],
          inputContexts: [{ name: "failCtx", builder: "nonexistentBuilder", required: false, fields: [] }],
        };
        AI_AGENTS_MANIFEST.unshift(contextAgent);
        try {
          const result = await service.runAdvisory({ ...baseInput, agentNames: [contextAgent.name] });
          const evidence = result.evidence.find((item: any) => item.agent === contextAgent.name);
          expect(evidence?.analysis).toBeDefined();
          expect(evidence?.contextUsed).toContain("failCtx:unavailable");
        } finally {
          AI_AGENTS_MANIFEST.shift();
        }
      });
    });
  });
}
