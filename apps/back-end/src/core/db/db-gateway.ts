type DbOrderBy = Record<string, unknown> | Array<Record<string, unknown>>;

export type DbBaseQueryArgs = {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
  orderBy?: DbOrderBy;
  take?: number;
  skip?: number;
};

export type DbFindUniqueArgs = DbBaseQueryArgs & { where: Record<string, unknown> };
export type DbFindManyArgs = DbBaseQueryArgs;
export type DbFindFirstArgs = DbBaseQueryArgs;

export interface DbGateway {
  brandProductFindUnique(args: DbFindUniqueArgs): Promise<any | null>;
  productPricingFindUnique(args: DbFindUniqueArgs): Promise<any | null>;
  competitorPriceFindMany(args: DbFindManyArgs): Promise<any[]>;
  productPriceDraftFindMany(args: DbFindManyArgs): Promise<any[]>;
  aIPricingHistoryFindMany(args: DbFindManyArgs): Promise<any[]>;
  inventoryItemFindMany(args: DbFindManyArgs): Promise<any[]>;
  leadFindUnique(args: DbFindUniqueArgs): Promise<any | null>;
  partnerUserFindFirst(args: DbFindFirstArgs): Promise<any | null>;
  partnerFindFirst(args: DbFindFirstArgs): Promise<any | null>;
  salesRepFindUnique(args: DbFindUniqueArgs): Promise<any | null>;
  loyaltyCustomerFindUnique(args: DbFindUniqueArgs): Promise<any | null>;
  automationRuleFindUnique(args: DbFindUniqueArgs): Promise<any | null>;
  automationRuleVersionFindFirst(args: DbFindFirstArgs): Promise<any | null>;
  aIInsightFindUnique(args: DbFindUniqueArgs): Promise<any | null>;
  brandFindUnique(args: DbFindUniqueArgs): Promise<any | null>;
  campaignFindMany(args: DbFindManyArgs): Promise<any[]>;
  socialMentionFindMany(args: DbFindManyArgs): Promise<any[]>;
  socialTrendFindMany(args: DbFindManyArgs): Promise<any[]>;
  audienceSegmentFindMany(args: DbFindManyArgs): Promise<any[]>;
  revenueRecordFindMany(args: DbFindManyArgs): Promise<any[]>;
  financeExpenseFindMany(args: DbFindManyArgs): Promise<any[]>;
  financeInvoiceFindMany(args: DbFindManyArgs): Promise<any[]>;
  financialKPIRecordFindMany(args: DbFindManyArgs): Promise<any[]>;
  invoiceFindUnique(args: DbFindUniqueArgs): Promise<any | null>;
  ticketFindUnique(args: DbFindUniqueArgs): Promise<any | null>;
  knowledgeDocumentFindUnique(args: DbFindUniqueArgs): Promise<any | null>;
  activityLogFindMany(args: DbFindManyArgs): Promise<any[]>;
  automationLogFindMany(args: DbFindManyArgs): Promise<any[]>;
  scheduledJobFindMany(args: DbFindManyArgs): Promise<any[]>;
  operationsTaskFindMany(args: DbFindManyArgs): Promise<any[]>;
}
