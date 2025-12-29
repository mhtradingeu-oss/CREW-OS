import { prisma } from "../../core/prisma.js";
import { generateEmbedding } from "./embedding.js";
import {
  assertScopeOwnership,
  compactMetadata,
  normalizeText,
  type IndexRecord,
  type IndexingScope,
} from "./indexer-types.js";

function toIso(value?: Date | string | null) {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

async function buildRecord(input: {
  id: string;
  type: string;
  brandId?: string | null;
  tenantId?: string | null;
  title?: string;
  description?: string;
  tags?: string[];
  content: string;
  metadata: Record<string, unknown>;
  source: string;
  updatedAt?: Date | string | null;
  raw?: Record<string, unknown>;
}): Promise<IndexRecord> {
  const embedding = await generateEmbedding(input.content);
  return {
    id: input.id,
    type: input.type,
    brandId: input.brandId ?? undefined,
    tenantId: input.tenantId ?? undefined,
    title: input.title,
    description: input.description,
    tags: input.tags?.filter(Boolean),
    embedding,
    metadata: compactMetadata({
      title: input.title,
      description: input.description,
      tags: input.tags,
      ...input.metadata,
    }),
    content: input.content,
    source: input.source,
    updatedAt: toIso(input.updatedAt),
    raw: input.raw,
  };
}

function asScore(value: unknown): number | undefined {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? Number(num) : undefined;
}

export async function indexBrand(brandId: string, scope?: IndexingScope): Promise<IndexRecord | null> {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      identity: true,
      aiConfig: true,
      rules: true,
    },
  });
  if (!brand) return null;
  assertScopeOwnership(brand.id, brand.tenantId, scope);

  const content = [
    `Brand ${brand.name} (${brand.slug})`,
    brand.description,
    `Country: ${brand.countryOfOrigin ?? "unknown"}`,
    `Currency: ${brand.defaultCurrency ?? "unset"}`,
    `Tone: ${brand.identity?.toneOfVoice ?? brand.aiConfig?.aiTone ?? "na"}`,
    brand.rules?.marketingRules,
    brand.rules?.pricingConstraints,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join("\n");

  return buildRecord({
    id: brand.id,
    type: "brand",
    brandId: brand.id,
    tenantId: brand.tenantId,
    title: brand.name,
    description: brand.description ?? undefined,
    tags: [brand.slug, brand.countryOfOrigin ?? ""].filter(Boolean),
    content,
    source: "brand",
    updatedAt: brand.updatedAt,
    metadata: {
      name: brand.name,
      slug: brand.slug,
      country: brand.countryOfOrigin,
      defaultCurrency: brand.defaultCurrency,
      aiTone: brand.aiConfig?.aiTone ?? brand.identity?.toneOfVoice,
      aiPersonality: brand.aiConfig?.aiPersonality ?? brand.identity?.persona,
      aiBlockedTopics: brand.aiConfig?.aiBlockedTopicsJson,
      pricingConstraints: brand.rules?.pricingConstraints,
      marketingRules: brand.rules?.marketingRules,
      namingRules: brand.rules?.namingRules,
    },
    raw: {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      countryOfOrigin: brand.countryOfOrigin,
      defaultCurrency: brand.defaultCurrency,
      identity: brand.identity,
      aiConfig: brand.aiConfig,
      rules: brand.rules,
    },
  });
}

export async function indexBrandProduct(
  productId: string,
  scope?: IndexingScope,
): Promise<IndexRecord | null> {
  const product = await prisma.brandProduct.findUnique({
    where: { id: productId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true, slug: true } },
      category: { select: { name: true, slug: true } },
      pricing: true,
      competitorPrices: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  if (!product) return null;
  assertScopeOwnership(product.brandId ?? product.brand?.id, product.brand?.tenantId, scope);

  const competitorSnapshot = product.competitorPrices
    ?.map((price) => `${price.competitor}: ${price.priceNet ?? price.priceGross ?? "-"} ${price.currency ?? ""}`)
    .join("; ");

  const content = [
    `Product ${product.name} (${product.slug})`,
    product.description,
    `SKU: ${product.sku ?? "n/a"}`,
    product.category ? `Category: ${product.category.name}` : undefined,
    product.status ? `Status: ${product.status}` : undefined,
    product.pricing
      ? `Pricing net ${product.pricing.b2cNet ?? product.pricing.dealerNet ?? "na"}`
      : undefined,
    competitorSnapshot ? `Competitors: ${competitorSnapshot}` : undefined,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join("\n");

  return buildRecord({
    id: product.id,
    type: "brand-product",
    brandId: product.brandId ?? product.brand?.id,
    tenantId: product.brand?.tenantId,
    title: product.name,
    description: product.description ?? undefined,
    tags: [product.slug, product.sku ?? "", product.category?.name ?? ""].filter(Boolean),
    content,
    source: "brand_product",
    updatedAt: product.updatedAt,
    metadata: {
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      brandId: product.brandId ?? product.brand?.id,
      brandName: product.brand?.name,
      category: product.category?.name,
      status: product.status,
      pricing: product.pricing,
      competitorSample: product.competitorPrices?.map((p) => ({
        competitor: p.competitor,
        marketplace: p.marketplace,
        country: p.country,
        net: p.priceNet,
        gross: p.priceGross,
        currency: p.currency,
      })),
    },
    raw: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      sku: product.sku,
      status: product.status,
      category: product.category,
      pricing: product.pricing,
    },
  });
}

export async function indexProductPricing(
  productId: string,
  scope?: IndexingScope,
): Promise<IndexRecord | null> {
  const pricing = await prisma.productPricing.findUnique({
    where: { productId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      product: { select: { id: true, name: true, slug: true, brandId: true } },
    },
  });
  if (!pricing) return null;
  assertScopeOwnership(pricing.brandId ?? pricing.brand?.id ?? pricing.product?.brandId, pricing.brand?.tenantId, scope);

  const content = [
    `Pricing for ${pricing.product?.name ?? pricing.productId}`,
    `COGS: ${pricing.cogsEur ?? "n/a"}`,
    `B2C: net ${pricing.b2cNet ?? "n/a"} gross ${pricing.b2cGross ?? "n/a"}`,
    `Dealer: ${pricing.dealerNet ?? "n/a"}`,
    `VAT: ${pricing.vatPct ?? "n/a"}`,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: pricing.id,
    type: "product-pricing",
    brandId: pricing.brandId ?? pricing.brand?.id ?? pricing.product?.brandId,
    tenantId: pricing.brand?.tenantId,
    title: `Pricing ${pricing.product?.name ?? pricing.productId}`,
    description: `Channel prices and VAT for ${pricing.product?.slug ?? pricing.productId}`,
    tags: [pricing.product?.slug ?? "", pricing.productId].filter(Boolean),
    content,
    source: "pricing",
    updatedAt: pricing.updatedAt,
    metadata: {
      productId,
      productName: pricing.product?.name,
      brandId: pricing.brandId ?? pricing.brand?.id ?? pricing.product?.brandId,
      vatPct: pricing.vatPct,
      b2cNet: pricing.b2cNet,
      b2cGross: pricing.b2cGross,
      dealerNet: pricing.dealerNet,
      distributorNet: pricing.distributorNet,
      amazonNet: pricing.amazonNet,
      uvpNet: pricing.uvpNet,
    },
    raw: {
      pricing,
    },
  });
}

export async function indexCompetitorPrice(
  competitorPriceId: string,
  scope?: IndexingScope,
): Promise<IndexRecord | null> {
  const competitorPrice = await prisma.competitorPrice.findUnique({
    where: { id: competitorPriceId },
    include: {
      product: { select: { id: true, name: true, brandId: true } },
      brand: { select: { id: true, tenantId: true, name: true } },
    },
  });
  if (!competitorPrice) return null;
  assertScopeOwnership(
    competitorPrice.brandId ?? competitorPrice.product?.brandId,
    competitorPrice.brand?.tenantId,
    scope,
  );

  const content = [
    `Competitor price for ${competitorPrice.product?.name ?? competitorPrice.productId}`,
    `Competitor ${competitorPrice.competitor}`,
    competitorPrice.marketplace ? `Marketplace ${competitorPrice.marketplace}` : undefined,
    competitorPrice.country ? `Country ${competitorPrice.country}` : undefined,
    competitorPrice.priceNet ? `Net ${competitorPrice.priceNet}` : undefined,
    competitorPrice.priceGross ? `Gross ${competitorPrice.priceGross}` : undefined,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: competitorPrice.id,
    type: "competitor-price",
    brandId: competitorPrice.brandId ?? competitorPrice.product?.brandId,
    tenantId: competitorPrice.brand?.tenantId,
    title: `Competitor ${competitorPrice.competitor}`,
    description: competitorPrice.marketplace ?? competitorPrice.country ?? undefined,
    tags: [competitorPrice.competitor, competitorPrice.marketplace ?? "", competitorPrice.country ?? ""].filter(Boolean),
    content,
    source: "competitor_price",
    updatedAt: competitorPrice.updatedAt,
    metadata: {
      productId: competitorPrice.productId,
      competitor: competitorPrice.competitor,
      marketplace: competitorPrice.marketplace,
      country: competitorPrice.country,
      net: competitorPrice.priceNet,
      gross: competitorPrice.priceGross,
      currency: competitorPrice.currency,
    },
    raw: {
      competitorPrice,
    },
  });
}

export async function indexInventoryItem(itemId: string, scope?: IndexingScope): Promise<IndexRecord | null> {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: {
      product: { select: { id: true, name: true, brandId: true, sku: true } },
      warehouse: { select: { id: true, name: true, location: true } },
      brand: { select: { id: true, tenantId: true } },
    },
  });
  if (!item) return null;
  assertScopeOwnership(item.brandId ?? item.product?.brandId, item.brand?.tenantId, scope);

  const content = [
    `Inventory for ${item.product?.name ?? item.productId}`,
    `Quantity ${item.quantity}`,
    item.warehouse ? `Warehouse ${item.warehouse.name}` : undefined,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: item.id,
    type: "inventory-item",
    brandId: item.brandId ?? item.product?.brandId,
    tenantId: item.brand?.tenantId,
    title: `${item.product?.name ?? item.productId} @ ${item.warehouse?.name ?? "warehouse"}`,
    description: `Quantity ${item.quantity}`,
    tags: [item.warehouse?.name ?? "", item.product?.sku ?? ""].filter(Boolean),
    content,
    source: "inventory",
    updatedAt: item.updatedAt,
    metadata: {
      productId: item.productId,
      productName: item.product?.name,
      sku: item.product?.sku,
      warehouseId: item.warehouseId,
      quantity: item.quantity,
      warehouse: item.warehouse?.name,
      location: item.warehouse?.location,
    },
    raw: {
      inventoryItem: item,
    },
  });
}

export async function indexCRMClient(clientId: string, scope?: IndexingScope): Promise<IndexRecord | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: clientId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      person: true,
      company: true,
      activities: { orderBy: { createdAt: "desc" }, take: 5 },
      scores: { orderBy: { createdAt: "desc" }, take: 3 },
      stage: { select: { id: true, name: true } },
    },
  });

  if (lead) {
    assertScopeOwnership(lead.brandId ?? lead.brand?.id, lead.brand?.tenantId, scope);
    const content = [
      `Lead ${lead.id}`,
      lead.person ? `${lead.person.firstName ?? ""} ${lead.person.lastName ?? ""}`.trim() : undefined,
      lead.company?.name,
      lead.status ? `Status ${lead.status}` : undefined,
      lead.stage ? `Stage ${lead.stage.name}` : undefined,
      lead.score ? `Score ${lead.score}` : undefined,
    ]
      .filter(Boolean)
      .map(normalizeText)
      .join(" | ");

    return buildRecord({
      id: lead.id,
      type: "crm-client",
      brandId: lead.brandId ?? lead.brand?.id,
      tenantId: lead.brand?.tenantId,
      title: lead.person
        ? `${lead.person.firstName ?? ""} ${lead.person.lastName ?? ""}`.trim() || lead.id
        : lead.company?.name ?? lead.id,
      description: lead.status ?? lead.stage?.name ?? undefined,
      tags: [lead.stage?.name ?? "", lead.status ?? ""].filter(Boolean),
      content,
      source: "crm_lead",
      updatedAt: lead.updatedAt,
      metadata: {
        personId: lead.personId,
        companyId: lead.companyId,
        status: lead.status,
        score: lead.score,
        stage: lead.stage?.name ?? lead.stageId,
        activities: lead.activities?.map((act) => ({
          id: act.id,
          activity: act.activity,
          when: toIso(act.createdAt),
        })),
        scores: lead.scores?.map((score) => ({
          id: score.id,
          score: score.score,
          reason: score.reason,
          createdAt: toIso(score.createdAt),
        })),
      },
      raw: {
        lead,
      },
    });
  }

  const person = await prisma.person.findUnique({
    where: { id: clientId },
    include: { brand: { select: { id: true, tenantId: true, name: true } } },
  });
  if (person) {
    assertScopeOwnership(person.brandId ?? person.brand?.id, person.brand?.tenantId, scope);
    const content = [
      `Person ${person.firstName ?? ""} ${person.lastName ?? ""}`.trim(),
      person.email,
      person.phone,
      person.tags,
      person.source,
    ]
      .filter(Boolean)
      .map(normalizeText)
      .join(" | ");

    return buildRecord({
      id: person.id,
      type: "crm-client",
      brandId: person.brandId ?? person.brand?.id,
      tenantId: person.brand?.tenantId,
      title: `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() || person.id,
      description: person.tags ?? undefined,
      tags: [person.tags ?? "", person.source ?? ""].filter(Boolean),
      content,
      source: "crm_person",
      updatedAt: person.updatedAt,
      metadata: {
        email: person.email,
        phone: person.phone,
        country: person.country,
        city: person.city,
        tags: person.tags,
        source: person.source,
      },
      raw: {
        person,
      },
    });
  }

  const company = await prisma.company.findUnique({
    where: { id: clientId },
    include: { brand: { select: { id: true, tenantId: true, name: true } } },
  });
  if (company) {
    assertScopeOwnership(company.brandId ?? company.brand?.id, company.brand?.tenantId, scope);
    const content = [
      `Company ${company.name}`,
      company.website,
      company.country,
      company.city,
      company.tags,
    ]
      .filter(Boolean)
      .map(normalizeText)
      .join(" | ");

    return buildRecord({
      id: company.id,
      type: "crm-client",
      brandId: company.brandId ?? company.brand?.id,
      tenantId: company.brand?.tenantId,
      title: company.name,
      description: company.type ?? undefined,
      tags: [company.country ?? "", company.city ?? ""].filter(Boolean),
      content,
      source: "crm_company",
      updatedAt: company.updatedAt,
      metadata: {
        type: company.type,
        vat: company.vatNumber,
        website: company.website,
        country: company.country,
        city: company.city,
      },
      raw: {
        company,
      },
    });
  }

  return null;
}

export async function indexPartner(partnerId: string, scope?: IndexingScope): Promise<IndexRecord | null> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      tier: { select: { name: true } },
      performance: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!partner) return null;
  assertScopeOwnership(partner.brandId ?? partner.brand?.id, partner.brand?.tenantId, scope);

  const content = [
    `Partner ${partner.name}`,
    `Type ${partner.type}`,
    partner.city ? `City ${partner.city}` : undefined,
    partner.country ? `Country ${partner.country}` : undefined,
    partner.status ? `Status ${partner.status}` : undefined,
    partner.tier ? `Tier ${partner.tier.name}` : undefined,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  const lastPerformance = partner.performance?.[0];

  return buildRecord({
    id: partner.id,
    type: "partner",
    brandId: partner.brandId ?? partner.brand?.id,
    tenantId: partner.brand?.tenantId,
    title: partner.name,
    description: partner.tier?.name ?? partner.status ?? undefined,
    tags: [partner.type, partner.tier?.name ?? "", partner.country ?? "", partner.city ?? ""].filter(Boolean),
    content,
    source: "partner",
    updatedAt: partner.updatedAt,
    metadata: {
      type: partner.type,
      tier: partner.tier?.name,
      status: partner.status,
      country: partner.country,
      city: partner.city,
      performance: lastPerformance
        ? { period: lastPerformance.period, kpis: lastPerformance.kpiJson }
        : undefined,
    },
    raw: {
      partner,
    },
  });
}

export async function indexDealer(partnerId: string, scope?: IndexingScope): Promise<IndexRecord | null> {
  const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
  if (!partner) return null;
  if (partner.type && partner.type.toLowerCase() !== "dealer") return null;
  return indexPartner(partnerId, scope);
}

export async function indexStand(standId: string, scope?: IndexingScope): Promise<IndexRecord | null> {
  const stand = await prisma.stand.findUnique({
    where: { id: standId },
    include: {
      Brand: { select: { id: true, tenantId: true, name: true } },
      standPartner: {
        select: {
          id: true,
          partnerId: true,
          status: true,
          standType: true,
          locationAddress: true,
          partner: { select: { name: true, type: true } },
        },
      },
      standKpis: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!stand) return null;
  assertScopeOwnership(stand.brandId ?? stand.Brand?.id, stand.Brand?.tenantId, scope);

  const kpi = stand.standKpis?.[0];
  const content = [
    `Stand ${stand.name}`,
    stand.standType ? `Type ${stand.standType}` : undefined,
    stand.status ? `Status ${stand.status}` : undefined,
    stand.standPartner?.partner ? `Partner ${stand.standPartner.partner.name}` : undefined,
    kpi ? `Sales ${kpi.totalSales ?? 0}` : undefined,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: stand.id,
    type: "stand",
    brandId: stand.brandId ?? stand.Brand?.id,
    tenantId: stand.Brand?.tenantId,
    title: stand.name,
    description: stand.standType ?? stand.status ?? undefined,
    tags: [stand.standType ?? "", stand.status ?? "", stand.standPartner?.partner?.name ?? ""].filter(Boolean),
    content,
    source: "stand",
    updatedAt: stand.updatedAt,
    metadata: {
      standPartnerId: stand.standPartnerId,
      status: stand.status,
      standType: stand.standType,
      kpi: kpi
        ? {
            totalSales: kpi.totalSales,
            totalUnits: kpi.totalUnits,
            stockOutEvents: kpi.stockOutEvents,
          }
        : undefined,
    },
    raw: {
      stand,
    },
  });
}

export async function indexAffiliate(affiliateId: string, scope?: IndexingScope): Promise<IndexRecord | null> {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      tier: { select: { name: true } },
      person: { select: { firstName: true, lastName: true } },
      performance: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!affiliate) return null;
  assertScopeOwnership(affiliate.brandId ?? affiliate.brand?.id, affiliate.brand?.tenantId, scope);

  const perf = affiliate.performance?.[0];
  const content = [
    `Affiliate ${affiliate.code ?? affiliate.id}`,
    affiliate.type ? `Type ${affiliate.type}` : undefined,
    affiliate.channel ? `Channel ${affiliate.channel}` : undefined,
    affiliate.status ? `Status ${affiliate.status}` : undefined,
    affiliate.tier ? `Tier ${affiliate.tier.name}` : undefined,
    perf ? `Recent revenue ${perf.revenue ?? 0}` : undefined,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: affiliate.id,
    type: "affiliate",
    brandId: affiliate.brandId ?? affiliate.brand?.id,
    tenantId: affiliate.brand?.tenantId,
    title: affiliate.code ?? affiliate.id,
    description: affiliate.channel ?? affiliate.type ?? undefined,
    tags: [affiliate.channel ?? "", affiliate.type ?? "", affiliate.status ?? ""].filter(Boolean),
    content,
    source: "affiliate",
    updatedAt: affiliate.updatedAt,
    metadata: {
      code: affiliate.code,
      channel: affiliate.channel,
      status: affiliate.status,
      tier: affiliate.tier?.name,
      person: affiliate.person
        ? `${affiliate.person.firstName ?? ""} ${affiliate.person.lastName ?? ""}`.trim()
        : undefined,
      performance: perf
        ? { period: perf.period, clicks: perf.clicks, orders: perf.orders, revenue: perf.revenue }
        : undefined,
    },
    raw: {
      affiliate,
    },
  });
}

export async function indexSalesRepProfile(
  salesRepId: string,
  scope?: IndexingScope,
): Promise<IndexRecord | null> {
  const salesRep = await prisma.salesRep.findUnique({
    where: { id: salesRepId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      user: { select: { email: true, id: true, role: true } },
      performance: { orderBy: { createdAt: "desc" }, take: 1 },
      targets: { orderBy: { createdAt: "desc" }, take: 1 },
      territories: { select: { territoryId: true } },
    },
  });
  if (!salesRep) return null;
  assertScopeOwnership(salesRep.brandId ?? salesRep.brand?.id, salesRep.brand?.tenantId, scope);

  const perf = salesRep.performance?.[0];
  const target = salesRep.targets?.[0];
  const content = [
    `Sales rep ${salesRep.id}`,
    salesRep.user ? `User ${salesRep.user.email}` : undefined,
    salesRep.region ? `Region ${salesRep.region}` : undefined,
    salesRep.status ? `Status ${salesRep.status}` : undefined,
    perf ? `Performance ${normalizeText(perf.kpiJson)}` : undefined,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: salesRep.id,
    type: "sales-rep",
    brandId: salesRep.brandId ?? salesRep.brand?.id,
    tenantId: salesRep.brand?.tenantId,
    title: salesRep.user?.email ?? salesRep.id,
    description: salesRep.region ?? salesRep.status ?? undefined,
    tags: [salesRep.region ?? "", salesRep.status ?? ""].filter(Boolean),
    content,
    source: "sales_rep",
    updatedAt: salesRep.updatedAt,
    metadata: {
      region: salesRep.region,
      status: salesRep.status,
      targets: target?.targetJson,
      performance: perf?.kpiJson,
      territories: salesRep.territories?.map((t) => t.territoryId),
    },
    raw: {
      salesRep,
    },
  });
}

export async function indexLoyaltyAccount(
  loyaltyCustomerId: string,
  scope?: IndexingScope,
): Promise<IndexRecord | null> {
  const account = await prisma.loyaltyCustomer.findUnique({
    where: { id: loyaltyCustomerId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      program: { select: { name: true } },
      tierInfo: { select: { name: true } },
      user: { select: { email: true } },
    },
  });
  if (!account) return null;
  assertScopeOwnership(account.brandId ?? account.brand?.id, account.brand?.tenantId, scope);

  const content = [
    `Loyalty account ${account.id}`,
    account.program ? `Program ${account.program.name}` : undefined,
    account.tier ? `Tier ${account.tier}` : undefined,
    `Points ${account.pointsBalance}`,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: account.id,
    type: "loyalty-account",
    brandId: account.brandId ?? account.brand?.id,
    tenantId: account.brand?.tenantId,
    title: account.user?.email ?? account.id,
    description: account.tier ?? account.tierInfo?.name ?? undefined,
    tags: [account.program?.name ?? "", account.tier ?? ""].filter(Boolean),
    content,
    source: "loyalty",
    updatedAt: account.updatedAt,
    metadata: {
      programId: account.programId,
      tier: account.tier ?? account.tierInfo?.name,
      points: account.pointsBalance,
      userId: account.userId,
      personId: account.personId,
    },
    raw: {
      account,
    },
  });
}

export async function indexAutomationRule(
  ruleId: string,
  scope?: IndexingScope,
): Promise<IndexRecord | null> {
  const rule = await prisma.automationRule.findUnique({
    where: { id: ruleId },
  });
  if (!rule) return null;
  assertScopeOwnership(rule.brandId, undefined, scope);
  const activeVersion = await prisma.automationRuleVersion.findFirst({
    where: { ruleId: rule.id, state: 'ACTIVE' },
    orderBy: { versionNumber: 'desc' },
  });
  const content = [
    `Automation rule ${rule.name}`,
    rule.description,
    activeVersion?.triggerEvent ? `Trigger ${activeVersion.triggerEvent}` : undefined,
    rule.state === 'ACTIVE' ? "Enabled" : "Disabled",
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: rule.id,
    type: "automation-rule",
    brandId: rule.brandId,
    tenantId: undefined,
    title: rule.name,
    description: rule.description ?? undefined,
    tags: [
      activeVersion?.triggerEvent ?? "",
      rule.state === 'ACTIVE' ? "enabled" : "disabled"
    ].filter(Boolean),
    content,
    source: "automation",
    updatedAt: rule.updatedAt,
    metadata: {
      trigger: activeVersion?.triggerEvent,
      conditions: activeVersion?.conditionConfigJson,
      actions: activeVersion?.actionsConfigJson,
      enabled: rule.state === 'ACTIVE',
    },
    raw: {
      rule,
      activeVersion,
    },
  });
}

export async function indexAIInsight(insightId: string, scope?: IndexingScope): Promise<IndexRecord | null> {
  const insight = await prisma.aIInsight.findUnique({
    where: { id: insightId },
    include: { brand: { select: { id: true, tenantId: true, name: true } } },
  });
  if (!insight) return null;
  assertScopeOwnership(insight.brandId ?? insight.brand?.id, insight.brand?.tenantId, scope);

  const content = [
    `AI insight ${insight.os ?? "global"}`,
    insight.entityType ? `Entity ${insight.entityType}` : undefined,
    insight.summary,
    insight.details,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: insight.id,
    type: "ai-insight",
    brandId: insight.brandId ?? insight.brand?.id,
    tenantId: insight.brand?.tenantId,
    title: insight.os ?? insight.entityType ?? "ai-insight",
    description: insight.summary ?? undefined,
    tags: [insight.os ?? "", insight.entityType ?? ""].filter(Boolean),
    content,
    source: "ai_insight",
    updatedAt: insight.updatedAt,
    metadata: {
      os: insight.os,
      entityType: insight.entityType,
      entityId: insight.entityId,
      summary: insight.summary,
    },
    raw: {
      insight,
    },
  });
}

export async function indexAILearningJournal(
  journalId: string,
  scope?: IndexingScope,
): Promise<IndexRecord | null> {
  const journal = await prisma.aILearningJournal.findUnique({
    where: { id: journalId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      product: { select: { id: true, name: true, brandId: true } },
    },
  });
  if (!journal) return null;
  assertScopeOwnership(journal.brandId ?? journal.brand?.id ?? journal.product?.brandId, journal.brand?.tenantId, scope);

  const content = [
    `AI learning journal ${journal.id}`,
    journal.eventType ? `Event ${journal.eventType}` : undefined,
    journal.source ? `Source ${journal.source}` : undefined,
    journal.inputSnapshotJson,
    journal.outputSnapshotJson,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: journal.id,
    type: "ai-learning-journal",
    brandId: journal.brandId ?? journal.brand?.id ?? journal.product?.brandId,
    tenantId: journal.brand?.tenantId,
    title: journal.eventType ?? "ai-learning",
    description: journal.source ?? undefined,
    tags: [journal.eventType ?? "", journal.source ?? "", journal.productId ?? ""].filter(Boolean),
    content,
    source: "ai_learning",
    updatedAt: journal.updatedAt,
    metadata: {
      brandId: journal.brandId ?? journal.brand?.id ?? journal.product?.brandId,
      productId: journal.productId,
      eventType: journal.eventType,
      source: journal.source,
    },
    raw: {
      journal,
    },
  });
}

export async function indexAIPricingHistory(
  historyId: string,
  scope?: IndexingScope,
): Promise<IndexRecord | null> {
  const history = await prisma.aIPricingHistory.findUnique({
    where: { id: historyId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      product: { select: { id: true, name: true, brandId: true, sku: true } },
    },
  });
  if (!history) return null;
  assertScopeOwnership(history.brandId ?? history.brand?.id ?? history.product?.brandId, history.brand?.tenantId, scope);

  const content = [
    `AI pricing decision ${history.id}`,
    history.channel ? `Channel ${history.channel}` : undefined,
    `Old ${history.oldNet ?? "n/a"}`,
    `New ${history.newNet ?? "n/a"}`,
    history.summary,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: history.id,
    type: "ai-pricing-history",
    brandId: history.brandId ?? history.brand?.id ?? history.product?.brandId,
    tenantId: history.brand?.tenantId,
    title: `Pricing ${history.product?.name ?? history.productId ?? history.channel ?? "decision"}`,
    description: history.summary ?? undefined,
    tags: [history.channel ?? "", history.product?.sku ?? ""].filter(Boolean),
    content,
    source: "ai_pricing_history",
    updatedAt: history.updatedAt,
    metadata: {
      productId: history.productId,
      channel: history.channel,
      oldNet: history.oldNet,
      newNet: history.newNet,
      aiAgent: history.aiAgent,
      confidenceScore: asScore(history.confidenceScore),
      summary: history.summary,
    },
    raw: {
      history,
    },
  });
}

export async function indexKnowledgeDocument(
  documentId: string,
  scope?: IndexingScope,
): Promise<IndexRecord | null> {
  const document = await prisma.knowledgeDocument.findUnique({
    where: { id: documentId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      category: { select: { name: true } },
      product: { select: { id: true, name: true, brandId: true } },
      campaign: { select: { id: true, name: true } },
      tags: { select: { name: true } },
    },
  });
  if (!document) return null;
  assertScopeOwnership(document.brandId ?? document.brand?.id ?? document.product?.brandId, document.brand?.tenantId, scope);

  const tagNames = document.tags?.map((t) => t.name).filter(Boolean) ?? [];
  const content = [
    `Knowledge ${document.title}`,
    document.summary,
    document.content,
    document.category ? `Category ${document.category.name}` : undefined,
    document.sourceType ? `Source ${document.sourceType}` : undefined,
    document.language ? `Language ${document.language}` : undefined,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: document.id,
    type: "knowledge-document",
    brandId: document.brandId ?? document.brand?.id ?? document.product?.brandId,
    tenantId: document.brand?.tenantId,
    title: document.title,
    description: document.summary ?? undefined,
    tags: tagNames,
    content,
    source: "knowledge",
    updatedAt: document.updatedAt,
    metadata: {
      category: document.category?.name,
      productId: document.productId,
      campaignId: document.campaignId,
      sourceType: document.sourceType,
      language: document.language,
      fileUrl: document.fileUrl,
      storageKey: document.storageKey,
      tags: tagNames,
    },
    raw: {
      document,
    },
  });
}

export async function indexSupportTicket(
  ticketId: string,
  scope?: IndexingScope,
): Promise<IndexRecord | null> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      assignedTo: { select: { id: true, email: true } },
      createdBy: { select: { id: true, email: true } },
      tags: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 15,
        include: { sender: { select: { id: true, email: true } } },
      },
    },
  });
  if (!ticket) return null;
  assertScopeOwnership(ticket.brandId, undefined, scope);

  const tagNames = ticket.tags?.map((t) => t.name) ?? [];
  const messageSummary = ticket.messages
    ?.map((m) => `${m.sender?.email ?? "user"}: ${m.content ?? ""}`)
    .slice(-5)
    .join(" | ");

  const content = [
    `Ticket ${ticket.id}`,
    ticket.status ? `Status ${ticket.status}` : undefined,
    ticket.priority ? `Priority ${ticket.priority}` : undefined,
    ticket.category ? `Category ${ticket.category}` : undefined,
    messageSummary,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: ticket.id,
    type: "support-ticket",
    brandId: ticket.brandId,
    tenantId: undefined,
    title: `Ticket ${ticket.id}`,
    description: ticket.category ?? ticket.status ?? undefined,
    tags: [ticket.status ?? "", ticket.priority ?? "", ticket.category ?? "", ...tagNames].filter(Boolean),
    content,
    source: "support",
    updatedAt: ticket.updatedAt,
    metadata: {
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdBy: ticket.createdBy?.email,
      assignedTo: ticket.assignedTo?.email,
      messageCount: ticket.messages?.length,
      tags: tagNames,
    },
    raw: {
      ticket,
    },
  });
}

export async function indexMarketingCampaign(
  campaignId: string,
  scope?: IndexingScope,
): Promise<IndexRecord | null> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      channel: { select: { name: true, type: true } },
      performanceLogs: { orderBy: { date: "desc" }, take: 5 },
    },
  });
  if (!campaign) return null;
  assertScopeOwnership(campaign.brandId ?? campaign.brand?.id, campaign.brand?.tenantId, scope);

  const content = [
    `Campaign ${campaign.name}`,
    campaign.objective ? `Objective ${campaign.objective}` : undefined,
    campaign.status ? `Status ${campaign.status}` : undefined,
    campaign.budget ? `Budget ${campaign.budget}` : undefined,
    campaign.channel ? `Channel ${campaign.channel.name}` : undefined,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  const performance = campaign.performanceLogs?.map((log) => ({
    date: toIso(log.date),
    impressions: log.impressions,
    clicks: log.clicks,
    spend: log.spend,
    conversions: log.conversions,
    revenue: log.revenue,
  }));

  return buildRecord({
    id: campaign.id,
    type: "marketing-campaign",
    brandId: campaign.brandId ?? campaign.brand?.id,
    tenantId: campaign.brand?.tenantId,
    title: campaign.name,
    description: campaign.objective ?? undefined,
    tags: [campaign.status ?? "", campaign.channel?.name ?? "", campaign.channel?.type ?? ""].filter(Boolean),
    content,
    source: "marketing",
    updatedAt: campaign.updatedAt,
    metadata: {
      channel: campaign.channel?.name,
      channelType: campaign.channel?.type,
      status: campaign.status,
      budget: campaign.budget,
      targetSegmentIds: campaign.targetSegmentIds,
      performance,
    },
    raw: {
      campaign,
    },
  });
}

export async function indexSocialSignal(
  signalId: string,
  scope?: IndexingScope,
): Promise<IndexRecord | null> {
  const mention = await prisma.socialMention.findUnique({
    where: { id: signalId },
    include: { brand: { select: { id: true, tenantId: true, name: true } } },
  });
  if (mention) {
    assertScopeOwnership(mention.brandId ?? mention.brand?.id, mention.brand?.tenantId, scope);
    const content = [
      `Social mention ${mention.platform}`,
      mention.author ? `Author ${mention.author}` : undefined,
      mention.keyword ? `Keyword ${mention.keyword}` : undefined,
      mention.content,
      mention.sentiment ? `Sentiment ${mention.sentiment}` : undefined,
    ]
      .filter(Boolean)
      .map(normalizeText)
      .join(" | ");

    return buildRecord({
      id: mention.id,
      type: "social-signal",
      brandId: mention.brandId ?? mention.brand?.id,
      tenantId: mention.brand?.tenantId,
      title: mention.keyword ?? mention.platform,
      description: mention.sentiment ?? undefined,
      tags: [mention.platform, mention.sentiment ?? ""].filter(Boolean),
      content,
      source: "social_mention",
      updatedAt: mention.updatedAt,
      metadata: {
        platform: mention.platform,
        author: mention.author,
        keyword: mention.keyword,
        sentiment: mention.sentiment,
        url: mention.url,
        occurredAt: mention.occurredAt,
      },
      raw: { mention },
    });
  }

  const trend = await prisma.socialTrend.findUnique({
    where: { id: signalId },
    include: { brand: { select: { id: true, tenantId: true, name: true } } },
  });
  if (!trend) return null;
  assertScopeOwnership(trend.brandId ?? trend.brand?.id, trend.brand?.tenantId, scope);

  const content = [
    `Social trend ${trend.topic}`,
    trend.platform ? `Platform ${trend.platform}` : undefined,
    trend.score ? `Score ${trend.score}` : undefined,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: trend.id,
    type: "social-signal",
    brandId: trend.brandId ?? trend.brand?.id,
    tenantId: trend.brand?.tenantId,
    title: trend.topic,
    description: trend.platform ?? undefined,
    tags: [trend.platform ?? "", trend.topic].filter(Boolean),
    content,
    source: "social_trend",
    updatedAt: trend.updatedAt,
    metadata: {
      topic: trend.topic,
      platform: trend.platform,
      score: trend.score,
      trendDataJson: trend.trendDataJson,
    },
    raw: { trend },
  });
}

export async function indexOperationsTask(
  taskId: string,
  scope?: IndexingScope,
): Promise<IndexRecord | null> {
  const task = await prisma.operationsTask.findUnique({
    where: { id: taskId },
    include: { brand: { select: { id: true, tenantId: true, name: true } } },
  });
  if (!task) return null;
  assertScopeOwnership(task.brandId ?? task.brand?.id, task.brand?.tenantId, scope);

  const content = [
    `Operations task ${task.title}`,
    task.status ? `Status ${task.status}` : undefined,
    task.dueDate ? `Due ${toIso(task.dueDate)}` : undefined,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: task.id,
    type: "operations-task",
    brandId: task.brandId ?? task.brand?.id,
    tenantId: task.brand?.tenantId,
    title: task.title,
    description: task.status ?? undefined,
    tags: [task.status ?? ""].filter(Boolean),
    content,
    source: "operations",
    updatedAt: task.updatedAt,
    metadata: {
      status: task.status,
      dueDate: task.dueDate,
    },
    raw: { task },
  });
}

export async function indexActivityLog(logId: string, scope?: IndexingScope): Promise<IndexRecord | null> {
  const rule = await prisma.automationRule.findUnique({
    where: { id: logId },
  });
  if (!rule) return null;
  assertScopeOwnership(rule.brandId, undefined, scope);
  const content = [
    `Activity log for automation rule ${rule.name}`,
    rule.description,
    rule.state === 'ACTIVE' ? "Enabled" : "Disabled",
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" | ");

  return buildRecord({
    id: rule.id,
    type: "activity-log",
    brandId: rule.brandId,
    tenantId: undefined,
    title: rule.name,
    description: rule.description ?? undefined,
    tags: [rule.state === 'ACTIVE' ? "enabled" : "disabled"].filter(Boolean),
    content,
    source: "automation",
    updatedAt: rule.updatedAt,
    metadata: {
      enabled: rule.state === 'ACTIVE',
    },
    raw: {
      rule,
    },
  });
}

export const aiIndexers = {
    brand: indexBrand,
    brandProduct: indexBrandProduct,
    productPricing: indexProductPricing,
    inventoryItem: indexInventoryItem,
    crmClient: indexCRMClient,
    partner: indexPartner,
  dealer: indexDealer,
  stand: indexStand,
  affiliate: indexAffiliate,
  salesRep: indexSalesRepProfile,
  loyaltyAccount: indexLoyaltyAccount,
  automationRule: indexAutomationRule,
  aiInsight: indexAIInsight,
  aiLearning: indexAILearningJournal,
  aiPricingHistory: indexAIPricingHistory,
  knowledgeDocument: indexKnowledgeDocument,
  supportTicket: indexSupportTicket,
  marketingCampaign: indexMarketingCampaign,
  socialSignal: indexSocialSignal,
  operationsTask: indexOperationsTask,
  activityLog: indexActivityLog,
};
