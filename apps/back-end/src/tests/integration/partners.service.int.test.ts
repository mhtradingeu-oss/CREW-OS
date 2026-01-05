import { describe, it, test, expect } from "@jest/globals";
const hasValidDbUrlForPartnersServiceIntTest =
  typeof process.env.DATABASE_URL_TEST === "string" &&
  (process.env.DATABASE_URL_TEST.startsWith("postgres://") ||
    process.env.DATABASE_URL_TEST.startsWith("postgresql://"));

if (!hasValidDbUrlForPartnersServiceIntTest) {
  describe("integration skipped", () => {
    test.skip("skipped because DATABASE_URL_TEST is not configured", () => {
      console.warn("Skipping integration test: DATABASE_URL_TEST not set");
    });
  });
} else {
  describe("integration", () => {
    let prisma: any;
    let partnersService: any;

    beforeAll(async () => {
      prisma = (await import("../../core/prisma.js")).prisma;
      partnersService = (await import("../../modules/partners/partners.service.js")).partnersService;
    });

    afterAll(async () => {
      if (prisma?.$disconnect) {
        await prisma.$disconnect();
      }
    });

    it("placeholder to satisfy Jest", () => {
      expect(true).toBe(true);
    });

    describe("Partners service integration", () => {
      it("creates and fetches partner", async () => {
        const partner = await partnersService.create(
          {
            name: "Test Partner",
          },
          { system: true },
        );

        expect(partner).toBeDefined();

        const fetched = await partnersService.getById(partner.id);
        expect(fetched?.id).toBe(partner.id);
      });
    });
  });
}
