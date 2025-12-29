import { forbidden } from "../../core/http/errors.js";
import type { DbGateway } from "../../core/db/db-gateway.js";
import { aiIndexers } from "../indexing/indexers.js";
import { assertScopeOwnership, type IndexRecord, type IndexingScope } from "../indexing/indexer-types.js";

export type ContextBuilderOptions = IndexingScope & {
  permissions?: string[];
  requiredPermissions?: string[];
  includeEmbeddings?: boolean;
  skipPermissionCheck?: boolean;
};

function nowIso() {
  return new Date().toISOString();
}

function ensurePermissions(required: string[], options?: ContextBuilderOptions) {
  const requiredSet = [...required, ...(options?.requiredPermissions ?? [])];
  if (!requiredSet.length) return;
  if (options?.skipPermissionCheck) return;
  if (options?.role === "SUPER_ADMIN") return;
  const perms = options?.permissions;
  if (!perms || !perms.length) return; // best-effort; controllers can enforce separately
  const allowed = requiredSet.some((perm) => perms.includes(perm) || perms.includes("*"));
  if (!allowed) {
    throw forbidden("Missing permission for AI context");
  }
}

async function maybeEmbed(recordFactory: () => Promise<IndexRecord | null>, options?: ContextBuilderOptions) {
  if (!options?.includeEmbeddings) return undefined;
  return recordFactory();
}

function scopeFrom(brandId?: string | null, tenantId?: string | null) {
  return { brandId: brandId ?? undefined, tenantId: tenantId ?? undefined };
}

export async function buildProductContext(
  db: DbGateway,
  productId: string,
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:product"], options);
  const product = await db.brandProductFindUnique({
    where: { id: productId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true, slug: true, defaultCurrency: true } },
      category: { select: { name: true, slug: true } },
      pricing: true,
      competitorPrices: { orderBy: { createdAt: "desc" }, take: 5 },
      inventoryItems: { orderBy: { updatedAt: "desc" }, take: 5, include: { warehouse: true } },
      aiPricingHistory: { orderBy: { createdAt: "desc" }, take: 5 },
      aiLearningJournal: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  if (!product) return null;
  assertScopeOwnership(product.brandId, undefined, options);

  const competitorSignals = product.competitorPrices?.map((row: any) => ({
    id: row.id,
    competitor: row.competitor,
    country: row.country,
    net: row.priceNet,
    gross: row.priceGross,
    currency: row.currency,
    collectedAt: row.collectedAt,
  })) ?? [];

  const inventorySnapshot = product.inventoryItems?.map((item: any) => ({
    id: item.id,
    warehouseId: item.warehouseId,
    warehouse: item.warehouse?.name,
    quantity: item.quantity,
    updatedAt: item.updatedAt,
  })) ?? [];

  const signals = {
    stockRisk: Math.min(...inventorySnapshot.map((i: any) => i.quantity ?? 0), Infinity),
    competitorPressure: competitorSignals.length,
    lastAiPricingSummary: product.aiPricingHistory?.[0]?.summary,
  };

  const indexRecord = await maybeEmbed(() => aiIndexers.brandProduct(productId, options), options);

  return {
    scope: scopeFrom(product.brandId, undefined),
    fetchedAt: nowIso(),
    entity: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      status: product.status,
      category: product.category,
    },
    related: {
      pricing: product.pricing,
      competitorPrices: competitorSignals,
      inventory: inventorySnapshot,
      aiPricingHistory: product.aiPricingHistory,
      aiLearning: product.aiLearningJournal,
    },
    signals,
    indexRecord,
  };
}

export async function buildPricingContext(
  db: DbGateway,
  productId: string,
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:pricing"], options);
  const pricing = await db.productPricingFindUnique({
    where: { productId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true, defaultCurrency: true } },
      product: { select: { id: true, name: true, brandId: true, slug: true } },
    },
  });
  if (!pricing) return null;
  assertScopeOwnership(pricing.brandId ?? pricing.product?.brandId, pricing.brand?.tenantId, options);

  const competitorPrices = await db.competitorPriceFindMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const drafts = await db.productPriceDraftFindMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const aiHistory = await db.aIPricingHistoryFindMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const signals = {
    vat: pricing.vatPct,
    spread: pricing.b2cGross && pricing.dealerNet ? Number(pricing.b2cGross) - Number(pricing.dealerNet) : undefined,
    openDrafts: drafts.filter((d: any) => d.status === "DRAFT" || d.status === "PENDING").length,
  };

  const indexRecord = await maybeEmbed(() => aiIndexers.productPricing(productId, options), options);

  return {
    scope: scopeFrom(pricing.brandId ?? pricing.product?.brandId, pricing.brand?.tenantId),
    fetchedAt: nowIso(),
    entity: pricing,
    related: {
      competitorPrices,
      drafts,
      aiHistory,
    },
    signals,
    indexRecord,
  };
}

export async function buildInventoryContext(
  db: DbGateway,
  input: string | { productId?: string; warehouseId?: string },
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:inventory"], options);
  const productId = typeof input === "string" ? input : input.productId;
  const warehouseId = typeof input === "string" ? undefined : input.warehouseId;

  const items = await db.inventoryItemFindMany({
    where: {
      ...(productId ? { productId } : {}),
      ...(warehouseId ? { warehouseId } : {}),
      ...(options?.brandId ? { brandId: options.brandId } : {}),
    },
    include: {
      product: { select: { id: true, name: true, brandId: true, sku: true } },
      warehouse: { select: { id: true, name: true, location: true } },
      brand: { select: { id: true, tenantId: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 25,
  });

  if (!items.length) return null;
  const primary = items[0]!;
  assertScopeOwnership(primary.brandId ?? primary.product?.brandId, primary.brand?.tenantId, options);

  const signals = {
    lowStock: items.filter((i: any) => i.quantity <= 5).map((i: any) => ({ id: i.id, quantity: i.quantity })),
    totalUnits: items.reduce((sum: any, i: any) => sum + (i.quantity ?? 0), 0),
  };

  const indexRecord = await maybeEmbed(() => aiIndexers.inventoryItem(primary.id, options), options);

  return {
    scope: scopeFrom(primary.brandId ?? primary.product?.brandId, primary.brand?.tenantId),
    fetchedAt: nowIso(),
    entity: {
      productId: primary.productId,
      warehouseId,
    },
    inventory: items.map((i: any) => ({
      id: i.id,
      productId: i.productId,
      sku: i.product?.sku,
      productName: i.product?.name,
      warehouseId: i.warehouseId,
      warehouse: i.warehouse?.name,
      location: i.warehouse?.location,
      quantity: i.quantity,
      updatedAt: i.updatedAt,
    })),
    signals,
    indexRecord,
  };
}

export async function buildCRMClientContext(
  db: DbGateway,
  clientId: string,
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:crm"], options);
  const client = await db.leadFindUnique({
    where: { id: clientId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      person: true,
      company: true,
      stage: { select: { id: true, name: true } },
      tasks: { orderBy: { createdAt: "desc" }, take: 5 },
      deals: { orderBy: { createdAt: "desc" }, take: 5 },
      activities: { orderBy: { createdAt: "desc" }, take: 5 },
      scores: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  if (!client) return null;
  assertScopeOwnership(client.brandId ?? client.brand?.id, client.brand?.tenantId, options);

  const signals = {
    score: client.score,
    stage: client.stage?.name ?? client.stageId,
    tasksOpen: client.tasks.filter((t: any) => t.status !== "done").length,
  };

  const indexRecord = await maybeEmbed(() => aiIndexers.crmClient(clientId, options), options);

  return {
    scope: scopeFrom(client.brandId ?? client.brand?.id, client.brand?.tenantId),
    fetchedAt: nowIso(),
    lead: client,
    related: {
      person: client.person,
      company: client.company,
      deals: client.deals,
      tasks: client.tasks,
      activities: client.activities,
      scores: client.scores,
    },
    signals,
    indexRecord,
  };
}

export async function buildPartnerContext(
  db: DbGateway,
  input: string | { partnerUserId?: string; partnerId?: string; userId?: string },
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:partner"], options);

  const partnerUserId = typeof input === "string" ? input : input.partnerUserId ?? input.userId;
  const partnerId = typeof input === "string" ? undefined : input.partnerId;

  const partnerUser = partnerUserId
    ? await db.partnerUserFindFirst({
        where: { userId: partnerUserId },
        include: {
          user: { select: { id: true, email: true, role: true } },
          partner: {
            include: {
              brand: { select: { id: true, tenantId: true, name: true } },
              tier: { select: { name: true } },
              performance: { orderBy: { createdAt: "desc" }, take: 1 },
              orders: { orderBy: { createdAt: "desc" }, take: 3 },
            },
          },
        },
      })
    : null;

  const partnerRecord = partnerUser?.partner
    ? partnerUser.partner
    : partnerId
      ? await db.partnerFindFirst({
          where: { id: partnerId },
          include: {
            brand: { select: { id: true, tenantId: true, name: true } },
            tier: { select: { name: true } },
            performance: { orderBy: { createdAt: "desc" }, take: 1 },
            orders: { orderBy: { createdAt: "desc" }, take: 3 },
          },
        })
      : null;

  if (!partnerRecord) return null;

  assertScopeOwnership(partnerRecord.brandId ?? partnerRecord.brand?.id, partnerRecord.brand?.tenantId, options);

  const indexRecord = await maybeEmbed(() => aiIndexers.partner(partnerRecord.id, options), options);

  const signals = {
    performance: partnerRecord.performance?.[0]?.kpiJson,
    tier: partnerRecord.tier?.name,
    status: partnerRecord.status,
  };

  return {
    scope: scopeFrom(partnerRecord.brandId ?? partnerRecord.brand?.id, partnerRecord.brand?.tenantId),
    fetchedAt: nowIso(),
    partner: partnerRecord,
    user: partnerUser?.user,
    orders: partnerRecord.orders,
    signals,
    indexRecord,
  };
}

export async function buildSalesRepContext(
  db: DbGateway,
  salesRepId: string,
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:sales"], options);
  const rep = await db.salesRepFindUnique({
    where: { id: salesRepId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      user: { select: { id: true, email: true, role: true } },
      performance: { orderBy: { createdAt: "desc" }, take: 2 },
      targets: { orderBy: { createdAt: "desc" }, take: 2 },
      tasks: { orderBy: { createdAt: "desc" }, take: 5 },
      routes: { orderBy: { createdAt: "desc" }, take: 3 },
      visits: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!rep) return null;
  assertScopeOwnership(rep.brandId ?? rep.brand?.id, rep.brand?.tenantId, options);

  const signals = {
    status: rep.status,
    region: rep.region,
    activeTasks: rep.tasks.filter((t: any) => t.status !== "done").length,
    performance: rep.performance?.[0]?.kpiJson,
  };

  const indexRecord = await maybeEmbed(() => aiIndexers.salesRep(salesRepId, options), options);

  return {
    scope: scopeFrom(rep.brandId ?? rep.brand?.id, rep.brand?.tenantId),
    fetchedAt: nowIso(),
    rep,
    performance: rep.performance,
    targets: rep.targets,
    tasks: rep.tasks,
    routes: rep.routes,
    visits: rep.visits,
    signals,
    indexRecord,
  };
}

export async function buildLoyaltyAccountContext(
  db: DbGateway,
  loyaltyCustomerId: string,
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:loyalty"], options);
  const account = await db.loyaltyCustomerFindUnique({
    where: { id: loyaltyCustomerId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      program: { select: { id: true, name: true } },
      tierInfo: { select: { id: true, name: true } },
      transactions: { orderBy: { createdAt: "desc" }, take: 5 },
      behaviors: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!account) return null;
  assertScopeOwnership(account.brandId ?? account.brand?.id, account.brand?.tenantId, options);

  const signals = {
    points: account.pointsBalance,
    tier: account.tier ?? account.tierInfo?.name,
    recentBehavior: account.behaviors?.[0]?.eventType,
  };

  const indexRecord = await maybeEmbed(() => aiIndexers.loyaltyAccount(loyaltyCustomerId, options), options);

  return {
    scope: scopeFrom(account.brandId ?? account.brand?.id, account.brand?.tenantId),
    fetchedAt: nowIso(),
    account,
    transactions: account.transactions,
    behaviors: account.behaviors,
    signals,
    indexRecord,
  };
}

export async function buildAutomationContext(
  db: DbGateway,
  ruleId: string,
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:automation"], options);

  const rule = await db.automationRuleFindUnique({
    where: { id: ruleId },
    include: {
      executionLogs: { orderBy: { runAt: "desc" }, take: 5 },
    },
  });
  if (!rule) return null;
  assertScopeOwnership(rule.brandId, undefined, options);
  const activeVersion = await db.automationRuleVersionFindFirst({
    where: { ruleId: rule.id, state: 'ACTIVE' },
    orderBy: { versionNumber: 'desc' },
  });
  const signals = {
    enabled: rule.state === 'ACTIVE',
    lastRunAt: rule.lastRunAt,
    lastRunStatus: rule.lastRunStatus,
  };

  const indexRecord = await maybeEmbed(() => aiIndexers.automationRule(ruleId, options), options);

  return {
    scope: scopeFrom(rule.brandId, undefined),
    fetchedAt: nowIso(),
    rule,
    executionLogs: rule.executionLogs,
    signals,
    indexRecord,
  };
}

export async function buildAIInsightContext(
  db: DbGateway,
  insightId: string,
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:insight"], options);
  const insight = await db.aIInsightFindUnique({
    where: { id: insightId },
  });
  if (!insight) return null;
  assertScopeOwnership(insight.brandId, undefined, options);
  const signals = { entityType: insight.entityType, os: insight.os };
  const indexRecord = await maybeEmbed(() => aiIndexers.aiInsight(insightId, options), options);
  return {
    scope: scopeFrom(insight.brandId, undefined),
    fetchedAt: nowIso(),
    insight,
    signals,
    indexRecord,
  };
}

export async function buildBrandContext(
  db: DbGateway,
  brandId: string,
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:brand"], options);
  const brand = await db.brandFindUnique({
    where: { id: brandId },
    include: {
      identity: true,
      rules: true,
      aiConfig: true,
    },
  });

  if (!brand) return null;
  assertScopeOwnership(brand.id, brand.tenantId, options);

  const indexRecord = await maybeEmbed(() => aiIndexers.brand(brandId, options), options);

  return {
    scope: scopeFrom(brand.id, brand.tenantId),
    fetchedAt: nowIso(),
    brand: {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      identity: brand.identity,
      strategy: brand.rules?.marketingRules ?? brand.description,
      positioning: brand.identity?.persona ?? brand.rules?.namingRules,
      aiConfig: brand.aiConfig,
    },
    policies: brand.rules,
    indexRecord,
  };
}

export async function buildMarketingContext(
  db: DbGateway,
  brandId: string,
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:marketing"], options);
  const brand = await db.brandFindUnique({
    where: { id: brandId },
    select: { id: true, name: true, slug: true, tenantId: true },
  });
  if (!brand) return null;
  assertScopeOwnership(brand.id, brand.tenantId, options);

  const [campaigns, socialMentions, socialTrends, audienceSegments] = await Promise.all([
    db.campaignFindMany({
      where: { brandId },
      include: {
        channel: { select: { name: true, type: true } },
        performanceLogs: { orderBy: { date: "desc" }, take: 3 },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    db.socialMentionFindMany({ where: { brandId }, orderBy: { occurredAt: "desc" }, take: 8 }),
    db.socialTrendFindMany({ where: { brandId }, orderBy: { updatedAt: "desc" }, take: 5 }),
    db.audienceSegmentFindMany({
      where: { brandId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { audienceInsights: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
  ]);

  const campaignsSummary = campaigns.map((c: any) => ({
    id: c.id,
    name: c.name,
    objective: c.objective,
    status: c.status,
    budget: c.budget,
    channel: c.channel,
      performance: c.performanceLogs?.map((p: any) => ({
      date: p.date,
      impressions: p.impressions,
      clicks: p.clicks,
      spend: p.spend,
      conversions: p.conversions,
      revenue: p.revenue,
    })),
  }));

  const socialSignals = [
    ...socialMentions.map((s: any) => ({
      id: s.id,
      platform: s.platform,
      sentiment: s.sentiment,
      keyword: s.keyword,
      occurredAt: s.occurredAt,
      url: s.url,
      content: s.content,
    })),
    ...socialTrends.map((t: any) => ({
      id: t.id,
      platform: t.platform,
      topic: t.topic,
      score: t.score,
    })),
  ];

  const audiences = audienceSegments.map((segment: any) => ({
    id: segment.id,
    name: segment.name,
    filters: segment.filters,
    latestInsight: segment.audienceInsights?.[0]?.summary,
  }));

  const indexRecords = options?.includeEmbeddings
    ? await Promise.all(
      campaigns.slice(0, 3).map((c: any) => aiIndexers.marketingCampaign(c.id, options)),
      )
    : undefined;

  return {
    scope: scopeFrom(brand.id, brand.tenantId),
    fetchedAt: nowIso(),
    brand,
    campaignsSummary,
    socialSignals,
    audiences,
    indexRecords: indexRecords?.filter(Boolean),
  };
}

export async function buildFinanceContext(
  db: DbGateway,
  brandId: string,
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:finance"], options);
  const brand = await db.brandFindUnique({
    where: { id: brandId },
    select: { id: true, name: true, slug: true, tenantId: true },
  });
  if (!brand) return null;
  assertScopeOwnership(brand.id, brand.tenantId, options);

  const [revenues, expenses, invoices, kpis] = await Promise.all([
    db.revenueRecordFindMany({ where: { brandId }, orderBy: { createdAt: "desc" }, take: 12 }),
    db.financeExpenseFindMany({ where: { brandId }, orderBy: { incurredAt: "desc" }, take: 12 }),
    db.financeInvoiceFindMany({ where: { brandId }, orderBy: { issuedAt: "desc" }, take: 8 }),
    db.financialKPIRecordFindMany({ where: { brandId }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);

  const revenueByChannel = revenues.reduce<Record<string, number>>((acc, r) => {
    const channel = r.channel ?? "unknown";
    const amount = Number(r.amount ?? 0);
    acc[channel] = (acc[channel] ?? 0) + amount;
    return acc;
  }, {});

  const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
  const revenueTotal = revenues.reduce((sum, r) => sum + Number(r.amount ?? 0), 0);

  return {
    scope: scopeFrom(brand.id, brand.tenantId),
    fetchedAt: nowIso(),
    brand,
    revenueSummary: {
      total: revenueTotal,
      byChannel: revenueByChannel,
      latest: revenues,
    },
    marginSummary: {
      totalRevenue: revenueTotal,
      totalExpense: expenseTotal,
      margin: revenueTotal - expenseTotal,
    },
    channels: Object.entries(revenueByChannel).map(([channel, amount]: [string, number]) => ({ channel, amount })),
    invoices,
    kpis,
  };
}

export async function buildInvoiceContext(
  db: DbGateway,
  invoiceId: string,
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:finance"], options);
  const invoice = await db.invoiceFindUnique({
    where: { id: invoiceId },
    include: {
      items: { include: { product: { select: { id: true, name: true, sku: true, brandId: true } } } },
      brand: { select: { id: true, tenantId: true, name: true, defaultCurrency: true } },
    },
  });

  if (!invoice) return null;

  assertScopeOwnership(invoice.brandId ?? invoice.brand?.id, invoice.brand?.tenantId, options);

  const items = invoice.items.map((item: any) => ({
    id: item.id,
    productId: item.productId,
    sku: item.product?.sku,
    name: item.product?.name,
    quantity: item.quantity,
    unitPriceNet: Number(item.unitPriceNet),
    vatPct: item.vatPct ? Number(item.vatPct) : null,
  }));

  return {
    scope: scopeFrom(invoice.brandId ?? invoice.brand?.id, invoice.brand?.tenantId),
    fetchedAt: nowIso(),
    invoice: {
      id: invoice.id,
      customerType: invoice.customerType,
      customerId: invoice.customerId,
      status: invoice.status,
      totalNet: invoice.totalNet ? Number(invoice.totalNet) : null,
      totalGross: invoice.totalGross ? Number(invoice.totalGross) : null,
      currency: invoice.currency ?? invoice.brand?.defaultCurrency ?? "EUR",
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    },
    items,
    brand: invoice.brand,
  };
}

export async function buildSupportContext(
  db: DbGateway,
  ticketId: string,
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:support"], options);
  const ticket = await db.ticketFindUnique({
    where: { id: ticketId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      assignedTo: { select: { id: true, email: true } },
      createdBy: { select: { id: true, email: true } },
      tags: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 25,
        include: { sender: { select: { id: true, email: true } } },
      },
    },
  });

  if (!ticket) return null;
  assertScopeOwnership(ticket.brandId ?? ticket.brand?.id, ticket.brand?.tenantId, options);

  const indexRecord = await maybeEmbed(() => aiIndexers.supportTicket(ticketId, options), options);

  return {
    scope: scopeFrom(ticket.brandId ?? ticket.brand?.id, ticket.brand?.tenantId),
    fetchedAt: nowIso(),
    ticket: {
      id: ticket.id,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      tags: ticket.tags?.map((t: any) => t.name) ?? [],
    },
    messages: ticket.messages?.map((m: any) => ({
      id: m.id,
      sender: m.sender?.email,
      content: m.content,
      createdAt: m.createdAt,
    })),
    relatedUserOrClient: {
      createdBy: ticket.createdBy,
      assignedTo: ticket.assignedTo,
      contactId: ticket.contactId,
    },
    relatedBrand: ticket.brand,
    indexRecord,
  };
}

export async function buildKnowledgeBaseContext(
  db: DbGateway,
  documentId: string,
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:kb"], options);
  const document = await db.knowledgeDocumentFindUnique({
    where: { id: documentId },
    include: {
      brand: { select: { id: true, tenantId: true, name: true } },
      category: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, brandId: true } },
      campaign: { select: { id: true, name: true } },
      tags: { select: { name: true } },
    },
  });
  if (!document) return null;
  assertScopeOwnership(document.brandId ?? document.brand?.id ?? document.product?.brandId, document.brand?.tenantId, options);

  const indexRecord = await maybeEmbed(() => aiIndexers.knowledgeDocument(documentId, options), options);

  return {
    scope: scopeFrom(document.brandId ?? document.brand?.id ?? document.product?.brandId, document.brand?.tenantId),
    fetchedAt: nowIso(),
    document: {
      id: document.id,
      title: document.title,
      summary: document.summary,
      category: document.category,
      tags: document.tags?.map((t: any) => t.name) ?? [],
      sourceType: document.sourceType,
      language: document.language,
      fileUrl: document.fileUrl,
    },
    brand: document.brand,
    relatedEntities: {
      product: document.product,
      campaign: document.campaign,
    },
    indexRecord,
  };
}

export async function buildOperationsContext(
  db: DbGateway,
  brandId: string,
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:operations"], options);
  const brand = await db.brandFindUnique({
    where: { id: brandId },
    select: { id: true, name: true, slug: true, tenantId: true },
  });
  if (!brand) return null;
  assertScopeOwnership(brand.id, brand.tenantId, options);

  const [activityLogs, automationLogs, scheduledJobs, operationsTasks] = await Promise.all([
    db.activityLogFindMany({ where: { brandId }, orderBy: { createdAt: "desc" }, take: 15 }),
    db.automationLogFindMany({ where: { brandId }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.scheduledJobFindMany({ where: { brandId }, orderBy: { updatedAt: "desc" }, take: 10 }),
    db.operationsTaskFindMany({ where: { brandId }, orderBy: { updatedAt: "desc" }, take: 10 }),
  ]);

  const incidents = automationLogs.filter((log: any) => log.result && log.result.toLowerCase().includes("error"));
  const health = {
    openOpsTasks: operationsTasks.filter((t: any) => t.status !== "done" && t.status !== "resolved").length,
    recentErrors: incidents.length,
  };

  const indexRecord = options?.includeEmbeddings && activityLogs[0]
    ? await aiIndexers.activityLog(activityLogs[0].id, options)
    : undefined;

  return {
    scope: scopeFrom(brand.id, brand.tenantId),
    fetchedAt: nowIso(),
    brand,
    health,
    incidents,
    automations: automationLogs,
    auditHighlights: activityLogs,
    scheduledJobs,
    operationsTasks,
    indexRecord,
  };
}

export async function buildNotificationContext(
  db: DbGateway,
  brandId: string,
  options?: ContextBuilderOptions,
) {
  ensurePermissions(["ai:context:notification"], options);
  const brand = await db.brandFindUnique({
    where: { id: brandId },
    select: { id: true, tenantId: true, name: true },
  });

  if (!brand) return null;
  assertScopeOwnership(brand.id, brand.tenantId, options);

  return {
    scope: scopeFrom(brand.id, brand.tenantId),
    fetchedAt: nowIso(),
    brand: { id: brand.id, name: brand.name },
    recent: [],
    note: "Notification context not implemented yet; returning empty stub.",
  };
}
