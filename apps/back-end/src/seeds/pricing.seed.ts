import { prisma } from "../core/prisma.js";
import { runSeedCli } from "./run-seed-cli.js";

type SeedProductConfig = {
  slug: string;
  name: string;
  sku: string;
  cost: number;
  b2cNet: number;
  dealerNet: number;
  uvpNet?: number;
};

const seedProducts: SeedProductConfig[] = [
  {
    slug: "dev-serum-001",
    name: "Dev Brightening Serum",
    sku: "DEV-SER-001",
    cost: 12,
    b2cNet: 28,
    dealerNet: 20,
    uvpNet: 30,
  },
  {
    slug: "dev-cleanser-002",
    name: "Dev Gentle Cleanser",
    sku: "DEV-CLN-002",
    cost: 6,
    b2cNet: 15,
    dealerNet: 11,
    uvpNet: 17,
  },
  {
    slug: "dev-bundle-003",
    name: "Dev Essentials Bundle",
    sku: "DEV-BND-003",
    cost: 25,
    b2cNet: 52,
    dealerNet: 40,
    uvpNet: 55,
  },
];

const competitorSeeds = [
  {
    competitor: "Amazia",
    marketplace: "amazon",
    country: "DE",
    priceNet: 27,
    currency: "EUR",
  },
  {
    competitor: "GlowCo",
    marketplace: "dm",
    country: "DE",
    priceNet: 25,
    currency: "EUR",
  },
  {
    competitor: "PharmaPlus",
    marketplace: "apotheke",
    country: "DE",
    priceNet: 29,
    currency: "EUR",
  },
];

export async function seedPricing() {
  const devTenant = await prisma.tenant.findUnique({
    where: { slug: "mh-dev-tenant" },
    select: { id: true, defaultBrandId: true },
  });

  if (!devTenant?.defaultBrandId) {
    console.warn("[seed:pricing] Dev tenant/brand not found, skipping pricing seed.");
    return;
  }

  const brandId = devTenant.defaultBrandId;

  for (const product of seedProducts) {
    const brandProduct = await prisma.brandProduct.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        sku: product.sku,
        brandId,
        status: "ACTIVE",
      },
      create: {
        slug: product.slug,
        name: product.name,
        sku: product.sku,
        brandId,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    await prisma.productPricing.upsert({
      where: { productId: brandProduct.id },
      update: {
        brandId,
        cogsEur: product.cost,
        fullCostEur: product.cost,
        b2cNet: product.b2cNet,
        dealerNet: product.dealerNet,
        uvpNet: product.uvpNet ?? product.b2cNet,
        vatPct: 19,
      },
      create: {
        productId: brandProduct.id,
        brandId,
        cogsEur: product.cost,
        fullCostEur: product.cost,
        b2cNet: product.b2cNet,
        dealerNet: product.dealerNet,
        uvpNet: product.uvpNet ?? product.b2cNet,
        vatPct: 19,
      },
    });

    for (const competitor of competitorSeeds) {
      await prisma.competitorPrice.upsert({
        where: {
          productId_competitor_marketplace_country: {
            productId: brandProduct.id,
            competitor: competitor.competitor,
            marketplace: competitor.marketplace,
            country: competitor.country,
          },
        },
        update: {
          priceNet: competitor.priceNet,
          priceGross: competitor.priceNet * 1.19,
          currency: competitor.currency,
          collectedAt: new Date(),
          brandId,
        },
        create: {
          productId: brandProduct.id,
          brandId,
          competitor: competitor.competitor,
          marketplace: competitor.marketplace,
          country: competitor.country,
          priceNet: competitor.priceNet,
          priceGross: competitor.priceNet * 1.19,
          currency: competitor.currency,
          collectedAt: new Date(),
        },
      });
    }

    await prisma.aIPricingHistory.deleteMany({
      where: { productId: brandProduct.id, aiAgent: { in: ["seed", "seed-ai"] } },
    });

    await prisma.aIPricingHistory.createMany({
      data: [
        {
          productId: brandProduct.id,
          brandId,
          channel: "base",
          oldNet: product.cost,
          newNet: product.b2cNet,
          aiAgent: "seed",
          confidenceScore: 0.5,
          summary: "Seed pricing created",
        },
        {
          productId: brandProduct.id,
          brandId,
          channel: "ai-suggest",
          oldNet: product.b2cNet,
          newNet: product.b2cNet + 1,
          aiAgent: "seed-ai",
          confidenceScore: 0.7,
          summary: "Seed AI suggestion",
        },
      ],
    });
  }

  console.log("✅ Pricing seed completed for dev brand", brandId);
}

if (process.argv[1]?.includes("pricing.seed")) {
  void runSeedCli("pricing", seedPricing).then((code) => process.exit(code));
}
