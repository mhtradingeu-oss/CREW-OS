import { prisma } from "../../core/prisma.js";
import type { DbGateway, DbFindManyArgs, DbFindUniqueArgs, DbFindFirstArgs } from "../../core/db/db-gateway.js";

const toAny = (args: Record<string, unknown>) => args as any;

export const prismaDbGateway: DbGateway = {
  brandProductFindUnique: (args: DbFindUniqueArgs) => prisma.brandProduct.findUnique(toAny(args)),
  productPricingFindUnique: (args: DbFindUniqueArgs) => prisma.productPricing.findUnique(toAny(args)),
  competitorPriceFindMany: (args: DbFindManyArgs) => prisma.competitorPrice.findMany(toAny(args)),
  productPriceDraftFindMany: (args: DbFindManyArgs) => prisma.productPriceDraft.findMany(toAny(args)),
  aIPricingHistoryFindMany: (args: DbFindManyArgs) => prisma.aIPricingHistory.findMany(toAny(args)),
  inventoryItemFindMany: (args: DbFindManyArgs) => prisma.inventoryItem.findMany(toAny(args)),
  leadFindUnique: (args: DbFindUniqueArgs) => prisma.lead.findUnique(toAny(args)),
  partnerUserFindFirst: (args: DbFindFirstArgs) => prisma.partnerUser.findFirst(toAny(args)),
  partnerFindFirst: (args: DbFindFirstArgs) => prisma.partner.findFirst(toAny(args)),
  salesRepFindUnique: (args: DbFindUniqueArgs) => prisma.salesRep.findUnique(toAny(args)),
  loyaltyCustomerFindUnique: (args: DbFindUniqueArgs) => prisma.loyaltyCustomer.findUnique(toAny(args)),
  automationRuleFindUnique: (args: DbFindUniqueArgs) => prisma.automationRule.findUnique(toAny(args)),
  automationRuleVersionFindFirst: (args: DbFindFirstArgs) => prisma.automationRuleVersion.findFirst(toAny(args)),
  aIInsightFindUnique: (args: DbFindUniqueArgs) => prisma.aIInsight.findUnique(toAny(args)),
  brandFindUnique: (args: DbFindUniqueArgs) => prisma.brand.findUnique(toAny(args)),
  campaignFindMany: (args: DbFindManyArgs) => prisma.campaign.findMany(toAny(args)),
  socialMentionFindMany: (args: DbFindManyArgs) => prisma.socialMention.findMany(toAny(args)),
  socialTrendFindMany: (args: DbFindManyArgs) => prisma.socialTrend.findMany(toAny(args)),
  audienceSegmentFindMany: (args: DbFindManyArgs) => prisma.audienceSegment.findMany(toAny(args)),
  revenueRecordFindMany: (args: DbFindManyArgs) => prisma.revenueRecord.findMany(toAny(args)),
  financeExpenseFindMany: (args: DbFindManyArgs) => prisma.financeExpense.findMany(toAny(args)),
  financeInvoiceFindMany: (args: DbFindManyArgs) => prisma.financeInvoice.findMany(toAny(args)),
  financialKPIRecordFindMany: (args: DbFindManyArgs) => prisma.financialKPIRecord.findMany(toAny(args)),
  invoiceFindUnique: (args: DbFindUniqueArgs) => prisma.invoice.findUnique(toAny(args)),
  ticketFindUnique: (args: DbFindUniqueArgs) => prisma.ticket.findUnique(toAny(args)),
  knowledgeDocumentFindUnique: (args: DbFindUniqueArgs) => prisma.knowledgeDocument.findUnique(toAny(args)),
  activityLogFindMany: (args: DbFindManyArgs) => prisma.activityLog.findMany(toAny(args)),
  automationLogFindMany: (args: DbFindManyArgs) => prisma.automationLog.findMany(toAny(args)),
  scheduledJobFindMany: (args: DbFindManyArgs) => prisma.scheduledJob.findMany(toAny(args)),
  operationsTaskFindMany: (args: DbFindManyArgs) => prisma.operationsTask.findMany(toAny(args)),
};
