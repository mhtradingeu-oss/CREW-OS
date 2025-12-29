import pkg from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../core/prisma.js";
import { env } from "../../core/config/env.js";
import { runSeedCli } from "../../seeds/run-seed-cli.js";

const { Prisma: PrismaNamespace } = pkg;

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  sku: string;
  categorySlug: string;
  pricing?: Partial<Prisma.ProductPricingUncheckedCreateInput>;
};

const brandSlug = "hairoticmen";

const categories = [
  {
    name: "Bartpflege",
    slug: "bartpflege",
    description: "Bartöl, Balm, Shampoo und Tonic mit maskulinen Duftwelten – salongetestet.",
  },
  {
    name: "Rasur & Pflege",
    slug: "rasur-pflege",
    description: "Präzise Rasur und sofort beruhigte Haut mit After Shave & Balm.",
  },
  {
    name: "Haare & Styling",
    slug: "haare-styling",
    description: "Shampoos, Conditioner und Waxes für zuverlässigen Halt und Pflege.",
  },
  {
    name: "Sets & Kits",
    slug: "sets-kits",
    description: "Perfekt kombinierte Kits für gepflegte Routinen und Geschenksets.",
  },
];

const products: SeedProduct[] = [
  {
    name: "After Shave Balm Deep Sky",
    slug: "after-shave-balm-deep-sky",
    description: "Schnell einziehender Balm, kühlt und beruhigt nach der Rasur ohne Fettfilm.",
    sku: "HM-ASB-DS-100",
    categorySlug: "rasur-pflege",
    pricing: {
      b2cNet: new PrismaNamespace.Decimal(12.5),
      dealerNet: new PrismaNamespace.Decimal(9.5),
      uvpNet: new PrismaNamespace.Decimal(14.9),
      vatPct: new PrismaNamespace.Decimal(19),
    },
  },
  {
    name: "After Shave Cologne",
    slug: "after-shave-cologne",
    description: "Maskulines Eau de Cologne mit Frischekick direkt nach der Rasur.",
    sku: "HM-ASC-100",
    categorySlug: "rasur-pflege",
    pricing: {
      b2cNet: new PrismaNamespace.Decimal(15.9),
      dealerNet: new PrismaNamespace.Decimal(11.9),
      uvpNet: new PrismaNamespace.Decimal(18.9),
      vatPct: new PrismaNamespace.Decimal(19),
    },
  },
  {
    name: "Beard Kit 6-in-1",
    slug: "beard-kit-6in1",
    description: "Komplettpaket für gepflegten Bart: Öl, Balm, Shampoo, Tonic, Kamm & Bürste.",
    sku: "HM-BEARD-KIT-6",
    categorySlug: "sets-kits",
    pricing: {
      b2cNet: new PrismaNamespace.Decimal(44),
      dealerNet: new PrismaNamespace.Decimal(32),
      uvpNet: new PrismaNamespace.Decimal(49),
      vatPct: new PrismaNamespace.Decimal(19),
    },
  },
  {
    name: "Matte Wax",
    slug: "matte-wax",
    description: "Natürlich mattes Finish, formbar und langanhaltend ohne Rückstände.",
    sku: "HM-WAX-MATTE",
    categorySlug: "haare-styling",
    pricing: {
      b2cNet: new PrismaNamespace.Decimal(11.5),
      dealerNet: new PrismaNamespace.Decimal(8.7),
      uvpNet: new PrismaNamespace.Decimal(13.9),
      vatPct: new PrismaNamespace.Decimal(19),
    },
  },
  {
    name: "Aqua Wax",
    slug: "aqua-wax",
    description: "Glänzendes Finish mit starkem Halt – wasserbasiert, leicht auswaschbar.",
    sku: "HM-WAX-AQUA",
    categorySlug: "haare-styling",
    pricing: {
      b2cNet: new PrismaNamespace.Decimal(11),
      dealerNet: new PrismaNamespace.Decimal(8.3),
      uvpNet: new PrismaNamespace.Decimal(13.5),
      vatPct: new PrismaNamespace.Decimal(19),
    },
  },
  {
    name: "Bartöl Signature",
    slug: "bart-oil-signature",
    description: "Nährt, bändigt und verleiht Glanz – mit hochwertigen Ölen und markantem Duft.",
    sku: "HM-OIL-SIGN",
    categorySlug: "bartpflege",
    pricing: {
      b2cNet: new PrismaNamespace.Decimal(14.5),
      dealerNet: new PrismaNamespace.Decimal(10.8),
      uvpNet: new PrismaNamespace.Decimal(16.9),
      vatPct: new PrismaNamespace.Decimal(19),
    },
  },
];

const aiAgentConfigs = [
  {
    name: "pricing",
    osScope: "pricing",
    configJson: {
      persona: "Pricing tactician for premium men's grooming",
      guardrails:
        "Respect EU/German VAT, keep gross margins healthy, avoid deep discounting that damages brand equity.",
      tone: "Decisive, confident, concise.",
    },
  },
  {
    name: "marketing",
    osScope: "marketing",
    configJson: {
      persona: "Campaign strategist for barbershop-grade grooming",
      contentStyle: "Direct, masculine, ingredient-aware, result-driven",
      avoid: ["medical claims", "overpromising growth"],
    },
  },
  {
    name: "assistant",
    osScope: "assistant",
    configJson: {
      persona: "HAIROTICMEN operator co-pilot",
      quickActions: ["pricing recap", "inventory watchlist", "next best campaign"],
    },
  },
];

export async function seedHairoticmen(options: { tenantId?: string } = {}) {
  const brand = await prisma.brand.upsert({
    where: { slug: brandSlug },
    update: {
      name: "HAIROTICMEN",
      description:
        "German-born men’s grooming brand built with barbershop-grade formulations and AI-assisted operations.",
      countryOfOrigin: "Germany",
      defaultCurrency: "EUR",
      tenantId: options.tenantId,
      settingsJson: JSON.stringify({ loyaltyEnabled: true, aiTone: "Masculine, direct, helpful" }),
    },
    create: {
      slug: brandSlug,
      name: "HAIROTICMEN",
      description:
        "German-born men’s grooming brand built with barbershop-grade formulations and AI-assisted operations.",
      countryOfOrigin: "Germany",
      defaultCurrency: "EUR",
      tenantId: options.tenantId,
      settingsJson: JSON.stringify({ loyaltyEnabled: true, aiTone: "Masculine, direct, helpful" }),
    },
  });

  await prisma.brandIdentity.upsert({
    where: { brandId: brand.id },
    update: {
      vision: "Barbershop-grade grooming at scale with uncompromising quality.",
      mission: "Deliver effortless routines for men with intelligent coaching and proven formulas.",
      values: "Clarity, discipline, performance, authenticity",
      toneOfVoice: "Direct, masculine, confident, practical",
      keywords: "barber, grooming, beard, wax, German quality, AI-guided",
    },
    create: {
      brandId: brand.id,
      vision: "Barbershop-grade grooming at scale with uncompromising quality.",
      mission: "Deliver effortless routines for men with intelligent coaching and proven formulas.",
      values: "Clarity, discipline, performance, authenticity",
      toneOfVoice: "Direct, masculine, confident, practical",
      keywords: "barber, grooming, beard, wax, German quality, AI-guided",
    },
  });

  await prisma.brandAIConfig.upsert({
    where: { brandId: brand.id },
    update: {
      aiPersonality: "Pragmatic barber-operator with German discipline",
      aiTone: "Concise, direct, confidence-inspiring",
      aiPricingStyle: "Margin-aware, competition-savvy, channel-specific",
      aiContentStyle: "Result-focused, ingredient-aware, no hype",
      aiEnabledActionsJson: JSON.stringify([
        "pricing",
        "marketing",
        "assistant",
        "insights",
        "kpi",
      ]),
      aiBlockedTopicsJson: JSON.stringify(["medical claims", "unapproved health promises"]),
    },
    create: {
      brandId: brand.id,
      aiPersonality: "Pragmatic barber-operator with German discipline",
      aiTone: "Concise, direct, confidence-inspiring",
      aiPricingStyle: "Margin-aware, competition-savvy, channel-specific",
      aiContentStyle: "Result-focused, ingredient-aware, no hype",
      aiEnabledActionsJson: JSON.stringify([
        "pricing",
        "marketing",
        "assistant",
        "insights",
        "kpi",
      ]),
      aiBlockedTopicsJson: JSON.stringify(["medical claims", "unapproved health promises"]),
    },
  });

  const categoryMap = new Map<string, string>();
  for (const category of categories) {
    const record = await prisma.brandCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        brandId: brand.id,
      },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        brandId: brand.id,
      },
    });
    categoryMap.set(category.slug, record.id);
  }

  for (const product of products) {
    const categoryId = categoryMap.get(product.categorySlug);
    const record = await prisma.brandProduct.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        sku: product.sku,
        brandId: brand.id,
        categoryId,
      },
      create: {
        slug: product.slug,
        name: product.name,
        description: product.description,
        sku: product.sku,
        brandId: brand.id,
        categoryId,
      },
    });

    if (product.pricing) {
      await prisma.productPricing.upsert({
        where: { productId: record.id },
        update: {
          ...product.pricing,
          brandId: brand.id,
        },
        create: {
          productId: record.id,
          brandId: brand.id,
          ...product.pricing,
        },
      });
    }
  }

  for (const agent of aiAgentConfigs) {
    await prisma.aIAgentConfig.upsert({
      where: { name: agent.name },
      update: {
        brandId: brand.id,
        osScope: agent.osScope,
        configJson: JSON.stringify(agent.configJson),
        enabled: true,
      },
      create: {
        name: agent.name,
        brandId: brand.id,
        osScope: agent.osScope,
        configJson: JSON.stringify(agent.configJson),
        enabled: true,
      },
    });
  }

  console.log(
    `✅ Seeded HAIROTICMEN brand, ${categories.length} categories, ${products.length} products, and AI configs for ${env.ADMIN_EMAIL}.`,
  );

  return brand;
}

if (process.argv[1]?.includes("hairoticmen.seed")) {
  void runSeedCli("HAIROTICMEN brand", () => seedHairoticmen()).then((code) => process.exit(code));
}
