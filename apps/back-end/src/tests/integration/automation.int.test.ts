import { describe, it, test, expect } from "@jest/globals";

const hasValidDbUrlForAutomationIntTest =
  typeof process.env.DATABASE_URL_TEST === "string" &&
  (process.env.DATABASE_URL_TEST.startsWith("postgres://") ||
    process.env.DATABASE_URL_TEST.startsWith("postgresql://"));

if (!hasValidDbUrlForAutomationIntTest) {
  describe("integration skipped", () => {
    test.skip("skipped because DATABASE_URL_TEST is not configured", () => {
      console.warn("Skipping integration test: DATABASE_URL_TEST not set");
    });
  });
} else {
  describe("integration", () => {
    let prisma: any;
    let automationService: any;

    beforeAll(async () => {
      prisma = (await import("../../core/prisma.js")).prisma;
      automationService = (await import("../../modules/automation/automation.service.js")).automationService;
    });

    afterAll(async () => {
      if (prisma?.$disconnect) {
        await prisma.$disconnect();
      }
    });

    it("placeholder to satisfy Jest", () => {
      expect(true).toBe(true);
    });

    describe("AutomationService integration", () => {
      it("creates and fetches automation rule", async () => {
        const slug = `automation-gate-${Date.now()}`;
        const brand = await prisma.brand.create({
          data: {
            name: slug,
            slug,
          },
        });

        let ruleId;
        try {
          const rule = await automationService.create({
            name: "Integration automation",
            description: "Runs on test events",
            brandId: brand.id,
          });
          ruleId = rule.id;

          const fetched = await prisma.automationRule.findUnique({ where: { id: ruleId } });
          expect(fetched?.id).toBe(ruleId);
        } finally {
          if (ruleId) {
            await automationService.remove(ruleId).catch(() => undefined);
          }
          await prisma.brand.delete({ where: { id: brand.id } });
        }
      });
    });
  });
}
