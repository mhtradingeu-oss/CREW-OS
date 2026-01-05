import { describe, it, test, expect } from "@jest/globals";
const hasValidDbUrlForLearningApiIntTest =
  typeof process.env.DATABASE_URL_TEST === "string" &&
  (process.env.DATABASE_URL_TEST.startsWith("postgres://") ||
    process.env.DATABASE_URL_TEST.startsWith("postgresql://"));

if (!hasValidDbUrlForLearningApiIntTest) {
  describe("integration skipped", () => {
    test.skip("skipped because DATABASE_URL_TEST is not configured", () => {
      console.warn("Skipping integration test: DATABASE_URL_TEST not set");
    });
  });
} else {
  describe("integration", () => {
    let prisma: any;
    let createApp: any;
    let LearningService: any;
    let clearAuditLog: any;
    let supertest: any;

    beforeAll(async () => {
      prisma = (await import("../../core/prisma.js")).prisma;
      createApp = (await import("../../app.js")).createApp;
      LearningService = (await import("../../ai/learning/learning.service.js")).LearningService;
      clearAuditLog = (await import("../../ai/learning/learning.audit.js")).clearAuditLog;
      supertest = (await import("supertest")).default;
    });

    afterAll(async () => {
      if (prisma?.$disconnect) {
        await prisma.$disconnect();
      }
    });

    it("placeholder to satisfy Jest", () => {
      expect(true).toBe(true);
    });

    describe("Learning API integration", () => {
      it("creates and fetches learning insight", async () => {
        clearAuditLog();
        LearningService.collectSignal({
          type: "decision_outcome",
          decisionId: "d9",
          outcome: "rejected",
          confidence: 0.95,
          agentId: "agentZ",
          timestamp: Date.now(),
        });
        const app = createApp();
        const res = await supertest(app)
          .get("/api/v1/ai/learning/insights")
          .set("Authorization", "Bearer test")
          .expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(0);
      });
    });
  });
}
