import { describe, it, test, expect } from "@jest/globals";
const hasValidDbUrlForAutomationMarketingSalesIntTest =
  typeof process.env.DATABASE_URL_TEST === "string" &&
  (process.env.DATABASE_URL_TEST.startsWith("postgres://") ||
    process.env.DATABASE_URL_TEST.startsWith("postgresql://"));

if (!hasValidDbUrlForAutomationMarketingSalesIntTest) {
  describe("integration skipped", () => {
    test.skip("skipped because DATABASE_URL_TEST is not configured", () => {
      console.warn("Skipping integration test: DATABASE_URL_TEST not set");
    });
  });
} else {
  describe("integration", () => {
    let prisma: any;

    beforeAll(async () => {
      prisma = (await import("../../core/prisma.js")).prisma;
    });

    afterAll(async () => {
      if (prisma?.$disconnect) {
        await prisma.$disconnect();
      }
    });

    it("placeholder to satisfy Jest", () => {
      expect(true).toBe(true);
    });

    describe("Automation marketing-sales placeholder", () => {
      test.skip("placeholder", () => {});
    });
  });
}
