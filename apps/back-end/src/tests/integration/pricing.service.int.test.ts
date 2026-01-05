import { describe, it, test, expect } from "@jest/globals";
const hasValidDbUrlForPricingServiceIntTest =
  typeof process.env.DATABASE_URL_TEST === "string" &&
  (process.env.DATABASE_URL_TEST.startsWith("postgres://") ||
    process.env.DATABASE_URL_TEST.startsWith("postgresql://"));

if (!hasValidDbUrlForPricingServiceIntTest) {
  describe("integration skipped", () => {
    test.skip("skipped because DATABASE_URL_TEST is not configured", () => {
      console.warn("Skipping integration test: DATABASE_URL_TEST not set");
    });
  });
} else {
  describe("integration", () => {
    let prisma: any;
    let pricingService: any;

    beforeAll(async () => {
      prisma = (await import("../../core/prisma.js")).prisma;
      pricingService = (await import("../../modules/pricing/pricing.service.js")).pricingService;
    });

    afterAll(async () => {
      if (prisma?.$disconnect) {
        await prisma.$disconnect();
      }
    });

    it("placeholder to satisfy Jest", () => {
      expect(true).toBe(true);
    });

    describe("Pricing service integration", () => {
      it("creates pricing with currency", async () => {
        const brand = await prisma.brand.create({
          data: { name: "Pricing Brand", slug: `pricing-${Date.now()}` },
        });

        const product = await prisma.brandProduct.create({
          data: {
            brandId: brand.id,
            name: "Test Product",
            slug: `product-${Date.now()}`,
          },
        });

        const pricing = await pricingService.upsert({
          brandProductId: product.id,
          netPrice: 100,
          currency: "EUR",
        });

        expect(pricing).toBeDefined();
        expect(pricing.currency).toBe("EUR");
      });
    });
  });
}
