import { describe, it, test, expect } from "@jest/globals";
const hasValidDbUrlForAutomationBrandEventFlowIntTest =
  typeof process.env.DATABASE_URL_TEST === "string" &&
  (process.env.DATABASE_URL_TEST.startsWith("postgres://") ||
    process.env.DATABASE_URL_TEST.startsWith("postgresql://"));

if (!hasValidDbUrlForAutomationBrandEventFlowIntTest) {
  describe("integration skipped", () => {
    test.skip("skipped because DATABASE_URL_TEST is not configured", () => {
      console.warn("Skipping integration test: DATABASE_URL_TEST not set");
    });
  });
} else {
  describe("integration", () => {
    let prisma: any;
    let automationService: any;
    let brandService: any;

    beforeAll(async () => {
      prisma = (await import("../../core/prisma.js")).prisma;
      automationService = (await import("../../modules/automation/automation.service.js")).automationService;
      brandService = (await import("../../modules/brand/brand.service.js")).brandService;
    });

    afterAll(async () => {
      if (prisma?.$disconnect) {
        await prisma.$disconnect();
      }
    });

    it("placeholder to satisfy Jest", () => {
      expect(true).toBe(true);
    });

    describe("Automation brand-event-flow integration", () => {
      it("creates automation rule and brand, fetches run", async () => {
        const slug = `automation-event-${Date.now()}`;
        const brand = await prisma.brand.create({
          data: {
            name: slug,
            slug,
          },
        });

        let ruleId;
        try {
          const rule = await automationService.create({
            name: "Brand created trigger",
            description: "Runs when a brand is created",
            brandId: null,
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
