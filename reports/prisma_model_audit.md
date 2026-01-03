# Prisma Model Audit Report

This report catalogs every Prisma model, derives runtime evidence through `rg` searches for `prisma.<model>` calls and repository/service/controller/test patterns, and flags models with no traceable access. 118 models have observable executions while 90 currently show zero proof; those candidates are marked for removal unless a roadmap-approved owner surfaces.

- Runtime-proven models: 118
- Models without runtime evidence (removal candidates): 90

## Model Status Table
Each row carries the first snippet of observable activity (prisma client call or related module import). Owner is currently unknown because no explicit assignment exists in the repo metadata.

| Model | Status | Evidence | Owner |
| --- | --- | --- | --- |
| User | ACTIVE | `await prisma.user.upsert({` in `apps/back-end/src/seeds/users.seed.ts`:18 | Unknown |
| Role | ACTIVE | `const roleRecord = await prisma.role.upsert({` in `apps/back-end/src/modules/security-governance/rbac.seed.ts`:247 | Unknown |
| Permission | ACTIVE | `prisma.permission.upsert({` in `apps/back-end/src/modules/security-governance/rbac.seed.ts`:236 | Unknown |
| RolePermission | ACTIVE | `const existing = await prisma.rolePermission.findFirst({` in `apps/back-end/src/modules/security-governance/rbac.seed.ts`:257 | Unknown |
| Policy | ACTIVE | `const relevantPolicies = await prisma.policy.findMany({` in `apps/back-end/src/core/security/rbac.ts`:99 | Unknown |
| AIRestrictionPolicy | ACTIVE | `return prisma.aIRestrictionPolicy.findMany({ select: { rulesJson: true } });` in `apps/back-end/src/core/db/repositories/ai-orchestrator.repository.ts`:30 | Unknown |
| AuditLog | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| Plan | ACTIVE | `const plans = await prisma.plan.findMany({` in `apps/back-end/src/seeds/tenants.seed.ts`:54 | Unknown |
| Tenant | ACTIVE | `const devTenant = await prisma.tenant.findUnique({` in `apps/back-end/src/seeds/users.seed.ts`:71 | Unknown |
| TenantOnboardingProfile | ACTIVE | `const existing = await prisma.tenantOnboardingProfile.findFirst({` in `apps/back-end/src/seeds/users.seed.ts`:41 | Unknown |
| TenantPlanChange | ACTIVE | `const existingDevPlanChange = await prisma.tenantPlanChange.findFirst({` in `apps/back-end/src/seeds/tenants.seed.ts`:112 | Unknown |
| Brand | ACTIVE | `brandFindUnique: (args: DbFindUniqueArgs) => prisma.brand.findUnique(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:21 | Unknown |
| BrandIdentity | ACTIVE | `await prisma.brandIdentity.upsert({` in `apps/back-end/src/modules/brand/hairoticmen.seed.ts`:178 | Unknown |
| BrandRules | ACTIVE | `async findBrandRules(args: PrismaArgs<typeof prisma.brandRules.findUnique>) {` in `apps/back-end/src/core/db/repositories/brand.repository.ts`:51 | Unknown |
| BrandAIConfig | ACTIVE | `await prisma.brandAIConfig.upsert({` in `apps/back-end/src/modules/brand/hairoticmen.seed.ts`:197 | Unknown |
| BrandCategory | ACTIVE | `const record = await prisma.brandCategory.upsert({` in `apps/back-end/src/modules/brand/hairoticmen.seed.ts`:232 | Unknown |
| BrandProduct | ACTIVE | `brandProductFindUnique: (args: DbFindUniqueArgs) => prisma.brandProduct.findUnique(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:7 | Unknown |
| ProductLocalization | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| ProductCompliance | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| ProductDistributionProfile | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| ProductMarketingProfile | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| ProductSocialProof | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| ProductAnalyticsHook | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| ProductPricing | ACTIVE | `productPricingFindUnique: (args: DbFindUniqueArgs) => prisma.productPricing.findUnique(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:8 | Unknown |
| CompetitorPrice | ACTIVE | `competitorPriceFindMany: (args: DbFindManyArgs) => prisma.competitorPrice.findMany(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:9 | Unknown |
| ProductPriceDraft | ACTIVE | `productPriceDraftFindMany: (args: DbFindManyArgs) => prisma.productPriceDraft.findMany(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:10 | Unknown |
| AIPricingHistory | ACTIVE | `aIPricingHistoryFindMany: (args: DbFindManyArgs) => prisma.aIPricingHistory.findMany(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:11 | Unknown |
| AILearningJournal | ACTIVE | `const journal = await prisma.aILearningJournal.findUnique({` in `apps/back-end/src/ai/indexing/indexers.ts`:880 | Unknown |
| Person | ACTIVE | `const person = await prisma.person.findUnique({` in `apps/back-end/src/ai/indexing/indexers.ts`:418 | Unknown |
| Company | ACTIVE | `const company = await prisma.company.findUnique({` in `apps/back-end/src/ai/indexing/indexers.ts`:460 | Unknown |
| CRMSegment | ACTIVE | `type SegmentListArgs = PrismaArgs<typeof prisma.cRMSegment.findMany>;` in `apps/back-end/src/modules/crm/crm.service.ts`:54 | Unknown |
| Lead | ACTIVE | `type LeadListArgs = PrismaArgs<typeof prisma.lead.findMany>;` in `apps/back-end/src/modules/crm/crm.service.ts`:51 | Unknown |
| CrmCustomer | ACTIVE | `type CrmCustomerSelect = PrismaArgs<typeof prisma.crmCustomer.create>["select"];` in `apps/back-end/src/modules/crm/crm.service.ts`:72 | Unknown |
| LeadSource | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| LeadActivity | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| LeadScoreHistory | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| Pipeline | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| PipelineStage | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| Deal | ACTIVE | `prisma.deal.findMany({` in `apps/back-end/src/modules/ai-brain/ai-kpi.service.ts`:103 | Unknown |
| DealProduct | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| CRMTask | ACTIVE | `return prisma.cRMTask.create({ data });` in `apps/back-end/src/core/db/repositories/sales-reps.repository.ts`:149 | Unknown |
| CRMNote | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| InteractionLog | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| MarketingChannel | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| AudienceSegment | ACTIVE | `audienceSegmentFindMany: (args: DbFindManyArgs) => prisma.audienceSegment.findMany(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:25 | Unknown |
| ContentPlan | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| ContentPlanItem | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| Campaign | ACTIVE | `campaignFindMany: (args: DbFindManyArgs) => prisma.campaign.findMany(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:22 | Unknown |
| CampaignAdSet | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| CampaignAd | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| MarketingPerformanceLog | ACTIVE | `prisma.marketingPerformanceLog.findMany({` in `apps/back-end/src/modules/ai-brain/ai-kpi.service.ts`:91 | Unknown |
| CampaignLeadAttribution | ACTIVE | `type CampaignLeadAttributionCreateArgs = PrismaArgs<typeof prisma.campaignLeadAttribution.create>;` in `apps/back-end/src/core/db/repositories/marketing.repository.ts`:6 | Unknown |
| CampaignInteraction | ACTIVE | `type CampaignInteractionCreateArgs = PrismaArgs<typeof prisma.campaignInteraction.create>;` in `apps/back-end/src/core/db/repositories/marketing.repository.ts`:7 | Unknown |
| SEOContent | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| TrackingProfile | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| TrackedLink | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesRep | ACTIVE | `salesRepFindUnique: (args: DbFindUniqueArgs) => prisma.salesRep.findUnique(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:16 | Unknown |
| SalesTerritory | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesRepTerritoryAssignment | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesRoutePlan | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesRouteStop | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesVisit | ACTIVE | `prisma.salesVisit.count({ where: { repId: filters.repId } }),` in `apps/back-end/src/core/db/repositories/sales-reps.repository.ts`:134 | Unknown |
| SalesVisitNote | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesQuote | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesQuoteItem | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesOrder | ACTIVE | `orderId ? prisma.salesOrder.findUnique({ where: { id: orderId }, select: { id: true, brandId: true …` in `apps/back-end/src/core/db/repositories/crm.repository.ts`:113 | Unknown |
| SalesOrderItem | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesRepTarget | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesRepPerformanceSnapshot | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesRepCommissionScheme | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesRepCommissionRecord | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesRepTask | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesLead | ACTIVE | `prisma.salesLead.count({ where }),` in `apps/back-end/src/core/db/repositories/sales-reps.repository.ts`:111 | Unknown |
| SalesAccount | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesCommissionLog | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| SalesRepKpiSnapshot | ACTIVE | `return prisma.salesRepKpiSnapshot.create({ data });` in `apps/back-end/src/core/db/repositories/sales-reps.repository.ts`:159 | Unknown |
| Partner | ACTIVE | `partnerFindFirst: (args: DbFindFirstArgs) => prisma.partner.findFirst(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:15 | Unknown |
| DealerKpi | ACTIVE | `prisma.dealerKpi.count({ where }),` in `apps/back-end/src/core/db/repositories/dealers.repository.ts`:158 | Unknown |
| PartnerUser | ACTIVE | `partnerUserFindFirst: (args: DbFindFirstArgs) => prisma.partnerUser.findFirst(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:14 | Unknown |
| PartnerContract | ACTIVE | `prisma.partnerContract.count({ where: { partnerId } }),` in `apps/back-end/src/core/db/repositories/partners.repository.ts`:245 | Unknown |
| PartnerPricing | ACTIVE | `prisma.partnerPricing.count({ where: { partnerId } }),` in `apps/back-end/src/core/db/repositories/partners.repository.ts`:251 | Unknown |
| PartnerOrder | ACTIVE | `type PartnerOrderAggregateSummary = Awaited<ReturnType<typeof prisma.partnerOrder.aggregate>>;` in `apps/back-end/src/core/db/repositories/partners.repository.ts`:62 | Unknown |
| PartnerOrderItem | ACTIVE | `type PartnerOrderItemSum = Awaited<ReturnType<typeof prisma.partnerOrderItem.aggregate>>;` in `apps/back-end/src/core/db/repositories/partners.repository.ts`:64 | Unknown |
| PartnerPerformance | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| PartnerTier | ACTIVE | `return prisma.partnerTier.findFirst({` in `apps/back-end/src/core/db/repositories/partners.repository.ts`:427 | Unknown |
| PartnerAIInsight | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StandPartner | ACTIVE | `prisma.standPartner.count({ where: { brandId } }),` in `apps/back-end/src/core/db/repositories/stand.repository.ts`:91 | Unknown |
| Stand | ACTIVE | `const stand = await prisma.stand.findUnique({` in `apps/back-end/src/ai/indexing/indexers.ts`:565 | Unknown |
| StandKpi | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StandLocation | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StandUnit | ACTIVE | `const unitGroups = await prisma.standUnit.groupBy({` in `apps/back-end/src/core/db/repositories/stand.repository.ts`:39 | Unknown |
| StandInventory | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StandInventorySnapshot | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StandOrder | ACTIVE | `const orderGroups = await prisma.standOrder.groupBy({` in `apps/back-end/src/core/db/repositories/stand.repository.ts`:48 | Unknown |
| StandOrderItem | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StandActivityLog | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StandSalesRecord | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StandReward | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StandAIInsight | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StandPackage | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StandLoyaltyLedger | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StandBonusTrigger | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StandPerformanceSnapshot | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StandRefillOrder | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StandRefillItem | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| Affiliate | ACTIVE | `const affiliate = await prisma.affiliate.findUnique({` in `apps/back-end/src/ai/indexing/indexers.ts`:627 | Unknown |
| AffiliateLink | ACTIVE | `const linkSelect: PrismaSelect<typeof prisma.affiliateLink.findMany> = {` in `apps/back-end/src/core/db/repositories/affiliate.repository.ts`:26 | Unknown |
| AffiliatePerformance | ACTIVE | `return prisma.affiliatePerformance.groupBy({` in `apps/back-end/src/core/db/repositories/affiliate.repository.ts`:162 | Unknown |
| AffiliateSale | ACTIVE | `prisma.affiliateSale.aggregate({` in `apps/back-end/src/core/db/repositories/affiliate.repository.ts`:91 | Unknown |
| AffiliateConversion | ACTIVE | `const conversionSelect: PrismaSelect<typeof prisma.affiliateConversion.findMany> = {` in `apps/back-end/src/core/db/repositories/affiliate.repository.ts`:35 | Unknown |
| AffiliatePayout | ACTIVE | `const payoutSelect: PrismaSelect<typeof prisma.affiliatePayout.findMany> = {` in `apps/back-end/src/core/db/repositories/affiliate.repository.ts`:47 | Unknown |
| AffiliateTier | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| AffiliateMediaKit | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| AffiliateAIInsight | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| LoyaltyProgram | ACTIVE | `prisma.loyaltyProgram.count({ where: programWhere }),` in `apps/back-end/src/core/db/repositories/loyalty.repository.ts`:187 | Unknown |
| LoyaltyTier | ACTIVE | `prisma.loyaltyTier.count({ where: { programId } }),` in `apps/back-end/src/core/db/repositories/loyalty.repository.ts`:257 | Unknown |
| LoyaltyCustomer | ACTIVE | `loyaltyCustomerFindUnique: (args: DbFindUniqueArgs) => prisma.loyaltyCustomer.findUnique(toAny(args…` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:17 | Unknown |
| LoyaltyTransaction | ACTIVE | `prisma.loyaltyTransaction.findMany({` in `apps/back-end/src/modules/ai-brain/ai-kpi.service.ts`:95 | Unknown |
| LoyaltyReward | ACTIVE | `prisma.loyaltyReward.count({ where: rewardWhere }),` in `apps/back-end/src/core/db/repositories/loyalty.repository.ts`:193 | Unknown |
| RewardRedemption | ACTIVE | `prisma.rewardRedemption.aggregate({` in `apps/back-end/src/core/db/repositories/loyalty.repository.ts`:194 | Unknown |
| LoyaltyReferral | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| LoyaltyBehaviorEvent | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| Warehouse | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| InventoryItem | ACTIVE | `inventoryItemFindMany: (args: DbFindManyArgs) => prisma.inventoryItem.findMany(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:12 | Unknown |
| InventoryTransaction | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StockAdjustment | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StockTransfer | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| StockTransferItem | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| ReorderSuggestion | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| PurchaseOrder | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| PurchaseOrderItem | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| Shipment | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| ShipmentItem | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| InventoryKPIRecord | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| Invoice | ACTIVE | `invoiceFindUnique: (args: DbFindUniqueArgs) => prisma.invoice.findUnique(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:30 | Unknown |
| EInvoice | ACTIVE | `return prisma.eInvoice.findFirst({` in `apps/back-end/src/core/db/repositories/finance.repository.ts`:206 | Unknown |
| InvoiceItem | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| Payment | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| Expense | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| FinanceExpense | ACTIVE | `financeExpenseFindMany: (args: DbFindManyArgs) => prisma.financeExpense.findMany(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:27 | Unknown |
| RevenueRecord | ACTIVE | `revenueRecordFindMany: (args: DbFindManyArgs) => prisma.revenueRecord.findMany(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:26 | Unknown |
| FinanceInvoice | ACTIVE | `financeInvoiceFindMany: (args: DbFindManyArgs) => prisma.financeInvoice.findMany(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:28 | Unknown |
| ProgramPayout | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| TaxProfile | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| FinancialKPIRecord | ACTIVE | `financialKPIRecordFindMany: (args: DbFindManyArgs) => prisma.financialKPIRecord.findMany(toAny(args…` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:29 | Unknown |
| BudgetPlan | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| BudgetAllocation | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| WhiteLabelBrand | ACTIVE | `prisma.whiteLabelBrand.count({ where }),` in `apps/back-end/src/core/db/repositories/white-label.repository.ts`:149 | Unknown |
| WhiteLabelProduct | ACTIVE | `prisma.whiteLabelProduct.groupBy({` in `apps/back-end/src/core/db/repositories/white-label.repository.ts`:167 | Unknown |
| WhiteLabelPricing | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| WhiteLabelOrder | ACTIVE | `prisma.whiteLabelOrder.groupBy({` in `apps/back-end/src/core/db/repositories/white-label.repository.ts`:173 | Unknown |
| WhiteLabelOrderItem | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| WhiteLabelContract | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| WhiteLabelAIInsight | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| WhiteLabelStore | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| AutomationEvent | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| AutomationRule | ACTIVE | `await prisma.automationRule.deleteMany({ where: { name: SMOKE_RULE_NAME } });` in `apps/back-end/scripts/phase5-automation-smoke.ts`:9 | Unknown |
| AutomationRuleVersion | ACTIVE | `automationRuleVersionFindFirst: (args: DbFindFirstArgs) => prisma.automationRuleVersion.findFirst(t…` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:19 | Unknown |
| AutomationExecutionLog | ACTIVE | `const log = await prisma.automationExecutionLog.create({` in `apps/back-end/src/modules/automation/automation.explain.service.ts`:20 | Unknown |
| AutomationApprovalDecision | ACTIVE | `prisma.automationApprovalDecision.count({ where }),` in `apps/back-end/src/modules/operator-audit/operator-audit.service.ts`:185 | Unknown |
| AutomationExecutionLedger | ACTIVE | `prisma.automationExecutionLedger.count({ where }),` in `apps/back-end/src/modules/operator-audit/operator-audit.service.ts`:249 | Unknown |
| AutomationBrandKillSwitch | ACTIVE | `return prisma.automationBrandKillSwitch.findUnique({` in `apps/back-end/src/core/db/repositories/automation-governance.repository.ts`:6 | Unknown |
| AutomationIncident | ACTIVE | `prisma.automationIncident.count({ where }),` in `apps/back-end/src/modules/operator-audit/operator-audit.service.ts`:346 | Unknown |
| AutomationExecutionKillSwitch | ACTIVE | `return prisma.automationExecutionKillSwitch.findFirst({` in `apps/back-end/src/core/db/repositories/automation-governance.repository.ts`:31 | Unknown |
| AutomationRollbackExecutionLedger | ACTIVE | `prisma.automationRollbackExecutionLedger.count({ where }),` in `apps/back-end/src/modules/operator-audit/operator-audit.service.ts`:435 | Unknown |
| AutomationWorkflow | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| AutomationAuditLog | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| AutomationRun | ACTIVE | `const run = await prisma.automationRun.findFirst({` in `apps/back-end/scripts/phase5-automation-smoke.ts`:49 | Unknown |
| AutomationActionRun | ACTIVE | `return prisma.automationActionRun.findUnique({` in `apps/back-end/src/core/db/repositories/automation.repository.ts`:164 | Unknown |
| AutomationLog | ACTIVE | `automationLogFindMany: (args: DbFindManyArgs) => prisma.automationLog.findMany(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:34 | Unknown |
| ActivityLog | ACTIVE | `activityLogFindMany: (args: DbFindManyArgs) => prisma.activityLog.findMany(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:33 | Unknown |
| ScheduledJob | ACTIVE | `scheduledJobFindMany: (args: DbFindManyArgs) => prisma.scheduledJob.findMany(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:35 | Unknown |
| Notification | ACTIVE | `return prisma.notification.create({` in `apps/back-end/src/core/db/repositories/notification.repository.ts`:7 | Unknown |
| NotificationChannel | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| NotificationTemplate | ACTIVE | `prisma.notificationTemplate.count({ where }),` in `apps/back-end/src/core/db/repositories/communication.repository.ts`:50 | Unknown |
| KnowledgeDocument | ACTIVE | `knowledgeDocumentFindUnique: (args: DbFindUniqueArgs) => prisma.knowledgeDocument.findUnique(toAny(…` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:32 | Unknown |
| KnowledgeCategory | ACTIVE | `return prisma.knowledgeCategory.findUnique({ where, select: { id: true, brandId: true } });` in `apps/back-end/src/core/db/repositories/knowledge-base.repository.ts`:27 | Unknown |
| KnowledgeTag | ACTIVE | `prisma.knowledgeTag.deleteMany({ where: { documentId: id } }),` in `apps/back-end/src/core/db/repositories/knowledge-base.repository.ts`:71 | Unknown |
| KnowledgeSource | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| AIAgentConfig | ACTIVE | `await prisma.aIAgentConfig.upsert({` in `apps/back-end/src/modules/brand/hairoticmen.seed.ts`:287 | Unknown |
| AIInsight | ACTIVE | `aIInsightFindUnique: (args: DbFindUniqueArgs) => prisma.aIInsight.findUnique(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:20 | Unknown |
| AIReport | ACTIVE | `return prisma.aIReport.create({` in `apps/back-end/src/modules/ai-brain/ai-insights.service.ts`:176 | Unknown |
| AIExecutionLog | ACTIVE | `type ExecutionLogFindManyArgs = PrismaArgs<typeof prisma.aIExecutionLog.findMany>;` in `apps/back-end/src/core/db/repositories/ai-monitoring.repository.ts`:5 | Unknown |
| AIMonitoringEvent | ACTIVE | `type MonitoringEventFindManyArgs = PrismaArgs<typeof prisma.aIMonitoringEvent.findMany>;` in `apps/back-end/src/core/db/repositories/ai-monitoring.repository.ts`:4 | Unknown |
| AISafetyEvent | ACTIVE | `type SafetyEventCreateArgs = PrismaArgs<typeof prisma.aISafetyEvent.create>;` in `apps/back-end/src/core/db/repositories/ai-monitoring.repository.ts`:8 | Unknown |
| AIPromptFirewallRule | ACTIVE | `return prisma.aIPromptFirewallRule.findMany({ where: { active: true } });` in `apps/back-end/src/core/db/repositories/ai-safety.repository.ts`:34 | Unknown |
| AISafetyConstraint | ACTIVE | `return prisma.aISafetyConstraint.findMany({ where: { active: true } });` in `apps/back-end/src/core/db/repositories/ai-safety.repository.ts`:38 | Unknown |
| AIBannedAction | ACTIVE | `return prisma.aIBannedAction.findMany();` in `apps/back-end/src/core/db/repositories/ai-safety.repository.ts`:42 | Unknown |
| AIAgentBudget | ACTIVE | `type AgentBudgetFindManyArgs = PrismaArgs<typeof prisma.aIAgentBudget.findMany>;` in `apps/back-end/src/core/db/repositories/ai-monitoring.repository.ts`:10 | Unknown |
| VirtualOfficeMeeting | ACTIVE | `const record = await prisma.virtualOfficeMeeting.create({` in `apps/back-end/src/modules/ai-brain/virtual-office.service.ts`:119 | Unknown |
| VirtualOfficeActionItem | ACTIVE | `const created = await prisma.virtualOfficeActionItem.create({` in `apps/back-end/src/modules/ai-brain/virtual-office.service.ts`:96 | Unknown |
| SocialMention | ACTIVE | `socialMentionFindMany: (args: DbFindManyArgs) => prisma.socialMention.findMany(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:23 | Unknown |
| SocialTrend | ACTIVE | `socialTrendFindMany: (args: DbFindManyArgs) => prisma.socialTrend.findMany(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:24 | Unknown |
| InfluencerProfile | ACTIVE | `return prisma.influencerProfile.findFirst({` in `apps/back-end/src/core/db/repositories/influencer-os.repository.ts`:181 | Unknown |
| InfluencerStatSnapshot | ACTIVE | `return prisma.influencerStatSnapshot.create({` in `apps/back-end/src/core/db/repositories/influencer-os.repository.ts`:245 | Unknown |
| InfluencerDiscoveryTask | ACTIVE | `return prisma.influencerDiscoveryTask.create({` in `apps/back-end/src/core/db/repositories/influencer-os.repository.ts`:161 | Unknown |
| InfluencerNegotiation | ACTIVE | `return prisma.influencerNegotiation.create({` in `apps/back-end/src/core/db/repositories/influencer-os.repository.ts`:310 | Unknown |
| InfluencerCampaignLink | ACTIVE | `return prisma.influencerCampaignLink.create({` in `apps/back-end/src/core/db/repositories/influencer-os.repository.ts`:355 | Unknown |
| CompetitorSocialReport | ACTIVE | `prisma.competitorSocialReport.count({ where }),` in `apps/back-end/src/core/db/repositories/social-intelligence.repository.ts`:404 | Unknown |
| AudienceInsight | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| Ticket | ACTIVE | `ticketFindUnique: (args: DbFindUniqueArgs) => prisma.ticket.findUnique(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:31 | Unknown |
| TicketMessage | ACTIVE | `type TicketMessageCreateArgs = PrismaArgs<typeof prisma.ticketMessage.create>;` in `apps/back-end/src/core/db/repositories/support.repository.ts`:9 | Unknown |
| TicketTag | REMOVE | No runtime references detected in the application layers; flagged for removal until explicit approval arrives. | Unknown |
| TicketAssignment | ACTIVE | `type TicketAssignmentCreateArgs = PrismaArgs<typeof prisma.ticketAssignment.create>;` in `apps/back-end/src/core/db/repositories/support.repository.ts`:11 | Unknown |
| VoiceSession | ACTIVE | `return prisma.voiceSession.create({ data });` in `apps/back-end/src/core/db/repositories/voice.repository.ts`:5 | Unknown |
| VoiceTranscript | ACTIVE | `return prisma.voiceTranscript.create({ data });` in `apps/back-end/src/core/db/repositories/voice.repository.ts`:9 | Unknown |
| OperationsTask | ACTIVE | `operationsTaskFindMany: (args: DbFindManyArgs) => prisma.operationsTask.findMany(toAny(args)),` in `apps/back-end/src/infrastructure/db/prisma-db-gateway.ts`:36 | Unknown |
| AISuggestion | ACTIVE | `it('calls prisma.aISuggestion.findMany and returns mock result', async () => {` in `apps/back-end/src/tests/unit/ai-suggestion.repository.unit.test.ts`:19 | Unknown |

## Enum Usage Table
Enums with zero references should either be deleted from the schema or explicitly approved before the foundation phase proceeds.

| Enum | Status | Evidence | Owner |
| --- | --- | --- | --- |
| AIExecutionStatus | USED | `import type { AIExecutionStatus } from "@prisma/client";` in `apps/back-end/src/core/events/domain/types.ts`:8 | Unknown |
| AIRiskLevel | UNREFERENCED | No imports or type references found in the application code. | Unknown |
| AIMonitoringCategory | UNREFERENCED | No imports or type references found in the application code. | Unknown |
| AIPromptAction | UNREFERENCED | No imports or type references found in the application code. | Unknown |
| AISafetyEventType | USED | `type: incidentType as import("@prisma/client").AISafetyEventType,` in `apps/back-end/src/modules/ai-safety/ai-safety.service.ts`:43 | Unknown |
| AutomationRunStatus | USED | `import type { AutomationActionRunStatus, AutomationRunStatus } from "../../db/repositories/automation-run.repository.js…` in `apps/back-end/src/core/automation/executor/executor.ts`:2 | Unknown |
| AutomationActionRunStatus | USED | `AutomationActionRunStatus as PrismaAutomationActionRunStatus,` in `apps/back-end/src/core/db/repositories/automation-run.repository.ts`:3 | Unknown |
| AutomationRuleLifecycleState | UNREFERENCED | No imports or type references found in the application code. | Unknown |
| AutomationApprovalStatus | USED | `import type { AutomationApprovalStatus } from "@prisma/client";` in `apps/back-end/src/core/automation/types/approval-decision.types.ts`:1 | Unknown |
| AutomationExecutionResult | USED | `import type { AutomationExecutionResult, AutomationIncidentStatus, AutomationIncidentSeverity } from "@prisma/client";` in `apps/back-end/src/modules/operator-audit/operator-audit.types.ts`:1 | Unknown |
| AutomationIncidentType | USED | `import type { Prisma, AutomationIncidentType, AutomationIncidentSeverity } from "@prisma/client";` in `apps/back-end/src/core/automation/governance/incident.service.ts`:4 | Unknown |
| AutomationIncidentSeverity | USED | `import type { AutomationExecutionResult, AutomationIncidentStatus, AutomationIncidentSeverity } from "@prisma/client";` in `apps/back-end/src/modules/operator-audit/operator-audit.types.ts`:1 | Unknown |
| AutomationIncidentStatus | USED | `import type { AutomationExecutionResult, AutomationIncidentStatus, AutomationIncidentSeverity } from "@prisma/client";` in `apps/back-end/src/modules/operator-audit/operator-audit.types.ts`:1 | Unknown |
| AutomationDetectionSource | USED | `import { AutomationDetectionSource } from "@prisma/client";` in `apps/back-end/src/core/automation/governance/incident.service.ts`:1 | Unknown |
| AutomationExecutionKillSwitchTarget | USED | `import type { AutomationExecutionKillSwitchTarget } from "@prisma/client";` in `apps/back-end/src/core/automation/governance/kill-switch.service.ts`:1 | Unknown |
| AutomationRollbackStatus | USED | `import type { Prisma, AutomationRollbackStatus } from "@prisma/client";` in `apps/back-end/src/core/automation/governance/rollback.service.ts`:3 | Unknown |
| TenantPersona | USED | `import type { OnboardingStatus, Prisma, TenantPersona } from "@prisma/client";` in `apps/back-end/src/core/db/repositories/onboarding.repository.ts`:1 | Unknown |
| OnboardingStatus | USED | `import type { OnboardingStatus, Prisma, TenantPersona } from "@prisma/client";` in `apps/back-end/src/core/db/repositories/onboarding.repository.ts`:1 | Unknown |
| AISuggestionStatus | USED | `import { AISuggestionStatus, Prisma } from "@prisma/client";` in `apps/back-end/src/modules/operator-audit/operator-audit.service.ts`:1 | Unknown |

## Relation Risk List
These relations reference models flagged for removal, creating unverified data paths in the schema:

- **Brand.productLocalizations → ProductLocalization** (apps/back-end/prisma/schema.prisma:355) — ProductLocalization has no runtime references.
- **Brand.productComplianceProfiles → ProductCompliance** (apps/back-end/prisma/schema.prisma:356) — ProductCompliance has no runtime references.
- **Brand.productDistributionProfiles → ProductDistributionProfile** (apps/back-end/prisma/schema.prisma:357) — ProductDistributionProfile has no runtime references.
- **Brand.productMarketingProfiles → ProductMarketingProfile** (apps/back-end/prisma/schema.prisma:358) — ProductMarketingProfile has no runtime references.
- **Brand.productSocialProof → ProductSocialProof** (apps/back-end/prisma/schema.prisma:359) — ProductSocialProof has no runtime references.
- **Brand.productAnalyticsHooks → ProductAnalyticsHook** (apps/back-end/prisma/schema.prisma:360) — ProductAnalyticsHook has no runtime references.
- **Brand.leadSources → LeadSource** (apps/back-end/prisma/schema.prisma:388) — LeadSource is unused and the backlink from leads is likewise unproven.
- **Brand.contentPlans → ContentPlan/ContentPlanItem** (apps/back-end/prisma/schema.prisma:370 & 1081) — ContentPlan and ContentPlanItem have no runtime references.
- **Brand.marketingChannels → MarketingChannel** (apps/back-end/prisma/schema.prisma:396) — MarketingChannel has no runtime usage.
- **Campaign.adSets/CampaignAdSet.ads → CampaignAd** (apps/back-end/prisma/schema.prisma:1108-1134) — Neither CampaignAdSet nor CampaignAd has runtime proof.

## Foundation Readiness Verdict
BLOCKED: 90 Prisma models have zero observable runtime usage, and per the governance rule any model without proof blocks the foundation. Remove or explicitly roadmap each unused model before the foundation can advance.
