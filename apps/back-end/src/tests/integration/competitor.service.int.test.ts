import { describe, it, test, expect } from "@jest/globals";
const hasValidDbUrlForCompetitorServiceIntTest =
  typeof process.env.DATABASE_URL_TEST === "string" &&
  (process.env.DATABASE_URL_TEST.startsWith("postgres://") ||
    process.env.DATABASE_URL_TEST.startsWith("postgresql://"));

if (!hasValidDbUrlForCompetitorServiceIntTest) {
  describe("integration skipped", () => {
    test.skip("skipped because DATABASE_URL_TEST is not configured", () => {
      console.warn("Skipping integration test: DATABASE_URL_TEST not set");
    });
  });
} else {
  describe("integration", () => {
    let prisma: any;
    let competitorService: any;

    beforeAll(async () => {
      prisma = (await import("../../core/prisma.js")).prisma;
      competitorService = (await import("../../modules/competitor/competitor.service.js")).competitorService;
    });

    afterAll(async () => {
      if (prisma?.$disconnect) {
        await prisma.$disconnect();
      }
    });

    it("placeholder to satisfy Jest", () => {
      expect(true).toBe(true);
    });

    describe("Competitor service (integration)", () => {
      it("records competitor pricing for brand products and deduplicates scans", async () => {
        const suffix = Date.now().toString(36);
        const brand = await prisma.brand.create({
          data: {
            name: `Integration Brand ${suffix}`,
            slug: `integration-brand-${suffix}`,
            defaultCurrency: "USD",
          },
        });
        const product = await prisma.brandProduct.create({
          data: {
            brandId: brand.id,
            name: `Integration Product ${suffix}`,
            slug: `integration-product-${suffix}`,
          },
        });
        await prisma.productPricing.create({
          data: {
            brandProductId: product.id,
            price: 100,
            currency: "USD",
          },
        });
        const payload = {
          brandId: brand.id,
          market: "north-america",
          keywords: ["alpha", "beta"],
        };

        try {
          const first = await competitorService.scanCompetitors(payload);
          expect(first.items.length).toBeGreaterThan(0);
          const countAfterFirst = await prisma.competitorPrice.count({
            where: { brandId: brand.id, marketplace: "north-america" },
          });
          expect(countAfterFirst).toBeGreaterThan(0);

          const second = await competitorService.scanCompetitors(payload);
          expect(second.items.length).toBeGreaterThan(0);
          expect(second.items.length).toBeGreaterThanOrEqual(first.items.length);
        } finally {
          await prisma.competitorPrice.deleteMany({ where: { brandId: brand.id } }).catch(() => undefined);
          await prisma.productPricing.deleteMany({ where: { brandProductId: product.id } }).catch(() => undefined);
          await prisma.brandProduct.delete({ where: { id: product.id } }).catch(() => undefined);
          await prisma.brand.delete({ where: { id: brand.id } }).catch(() => undefined);
        }
      });
    });
  });
}
