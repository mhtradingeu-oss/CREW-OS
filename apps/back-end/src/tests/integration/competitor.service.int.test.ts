import { prisma } from "@/core/prisma";
import { competitorService } from "@/modules/competitor/competitor.service";

describe("Competitor service (integration)", () => {
  const dbUrl = process.env.DATABASE_URL_TEST;
  if (!dbUrl) {
    it("skips: DATABASE_URL_TEST not set", () => {
      console.warn("Skipping competitor integration: DATABASE_URL_TEST not set");
    });
    return;
  }

  it("persists competitor snapshots and stays idempotent", async () => {
    const suffix = Date.now().toString(36);
    const brand = await prisma.brand.create({
      data: {
        name: `Test Brand ${suffix}`,
        slug: `test-brand-${suffix}`,
        defaultCurrency: "USD",
      },
    });
    const product = await prisma.brandProduct.create({
      data: {
        brandId: brand.id,
        name: `Test Product ${suffix}`,
        slug: `test-product-${suffix}`,
      },
    });
    await prisma.productPricing.create({
      data: {
        productId: product.id,
        brandId: brand.id,
        b2cNet: 29.99,
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
      expect(countAfterFirst).toBe(first.items.length);

      const second = await competitorService.scanCompetitors(payload);
      expect(second.items.length).toBeGreaterThan(0);
      const countAfterSecond = await prisma.competitorPrice.count({
        where: { brandId: brand.id, marketplace: "north-america" },
      });
      expect(countAfterSecond).toBe(countAfterFirst);
    } finally {
      await prisma.competitorPrice.deleteMany({ where: { brandId: brand.id } });
      await prisma.productPricing.deleteMany({ where: { productId: product.id } });
      await prisma.brandProduct.delete({ where: { id: product.id } });
      await prisma.brand.delete({ where: { id: brand.id } });
    }
  });
});
