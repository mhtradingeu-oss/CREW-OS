import { prisma, type PrismaArgs, type PrismaSelect } from "../../prisma.js";

type CampaignFindManyArgs = PrismaArgs<typeof prisma.campaign.findMany>;
type CampaignCreateArgs = PrismaArgs<typeof prisma.campaign.create>;
type CampaignUpdateArgs = PrismaArgs<typeof prisma.campaign.update>;
type CampaignLeadAttributionCreateArgs = PrismaArgs<typeof prisma.campaignLeadAttribution.create>;
type CampaignInteractionCreateArgs = PrismaArgs<typeof prisma.campaignInteraction.create>;
type MarketingPerformanceLogCreateArgs = PrismaArgs<typeof prisma.marketingPerformanceLog.create>;
type AIInsightCreateArgs = PrismaArgs<typeof prisma.aIInsight.create>;

type CampaignSelect = CampaignFindManyArgs["select"];
const campaignSelect = {
  id: true,
  brandId: true,
  channelId: true,
  name: true,
  objective: true,
  budget: true,
  status: true,
  targetSegmentIds: true,
  createdAt: true,
  updatedAt: true,
} satisfies CampaignSelect;

type CampaignTargetSegmentSelect = PrismaSelect<typeof prisma.campaign.findUnique>;
const campaignTargetSegmentSelect = {
  id: true,
  brandId: true,
  targetSegmentIds: true,
} satisfies CampaignTargetSegmentSelect;

type CampaignAttributionSelect = NonNullable<CampaignLeadAttributionCreateArgs["select"]>;
const campaignAttributionSelect = {
  id: true,
  campaignId: true,
  brandId: true,
  leadId: true,
  customerId: true,
  source: true,
  createdAt: true,
  updatedAt: true,
} satisfies CampaignAttributionSelect;

type CampaignInteractionSelect = NonNullable<CampaignInteractionCreateArgs["select"]>;
const campaignInteractionSelect = {
  id: true,
  campaignId: true,
  type: true,
  leadId: true,
  customerId: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} satisfies CampaignInteractionSelect;

type CampaignInteractionData = CampaignInteractionCreateArgs["data"];

export type CampaignPayload = Awaited<ReturnType<typeof prisma.campaign.findMany>>[number];
export type CampaignTargetSegmentPayload = Awaited<ReturnType<typeof prisma.campaign.findUnique>>;
export type CampaignAttributionPayload = Awaited<ReturnType<typeof prisma.campaignLeadAttribution.create>>;
export type CampaignInteractionPayload = Awaited<ReturnType<typeof prisma.campaignInteraction.create>>;

export type CampaignTargetSegmentInput = CampaignCreateArgs["data"]["targetSegmentIds"];

export type CampaignWhereInput = CampaignFindManyArgs["where"];
export type CampaignCreateInput = CampaignCreateArgs["data"];
export type CampaignUpdateInput = CampaignUpdateArgs["data"];
export type MarketingPerformanceLogCreateInput = MarketingPerformanceLogCreateArgs["data"];
export type AIInsightCreateInput = AIInsightCreateArgs["data"];
export type NullableJsonNullValueInput = CampaignInteractionData["metadata"] | null;
export type JsonValue = CampaignInteractionData["metadata"];
export type InputJsonValue = CampaignInteractionData["metadata"];

async function listCampaigns(where: CampaignWhereInput, skip: number, take: number) {
  const filteredWhere = where ?? {};
  return prisma.$transaction([
    prisma.campaign.count({ where: filteredWhere }),
    prisma.campaign.findMany({
      where: filteredWhere,
      select: campaignSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);
}

async function findCampaignById(id: string) {
  return prisma.campaign.findUnique({ where: { id }, select: campaignSelect });
}

async function findCampaign(where: CampaignWhereInput) {
  return prisma.campaign.findFirst({ where, select: campaignSelect });
}

async function findCampaignTargetSegments(campaignId: string) {
  return prisma.campaign.findUnique({
    where: { id: campaignId },
    select: campaignTargetSegmentSelect,
  });
}

async function findCampaignsByBrand(brandId?: string | null) {
  return prisma.campaign.findMany({
    where: { brandId: brandId ?? null },
    select: { id: true, name: true },
  });
}

async function createCampaign(data: CampaignCreateInput) {
  return prisma.campaign.create({ data, select: campaignSelect });
}

async function updateCampaign(id: string, data: CampaignUpdateInput) {
  return prisma.campaign.update({ where: { id }, data, select: campaignSelect });
}

async function deleteCampaign(id: string) {
  await prisma.campaign.delete({ where: { id } });
}

async function logPerformance(data: MarketingPerformanceLogCreateInput) {
  await prisma.marketingPerformanceLog.create({ data });
}

async function findLeadById(leadId: string) {
  return prisma.lead.findUnique({
    where: { id: leadId },
    select: { brandId: true },
  });
}

async function findCustomerById(customerId: string) {
  return prisma.crmCustomer.findUnique({
    where: { id: customerId },
    select: { brandId: true },
  });
}

async function createCampaignAttribution(data: CampaignAttributionCreateInput) {
  return prisma.campaignLeadAttribution.create({ data, select: campaignAttributionSelect });
}

async function createCampaignInteraction(data: CampaignInteractionCreateInput) {
  return prisma.campaignInteraction.create({ data, select: campaignInteractionSelect });
}

async function logAIInsight(data: AIInsightCreateInput) {
  await prisma.aIInsight.create({ data });
}

export type CampaignAttributionCreateInput = CampaignLeadAttributionCreateArgs["data"];
export type CampaignInteractionCreateInput = CampaignInteractionCreateArgs["data"];

export const marketingRepository = {
  campaignSelect,
  campaignAttributionSelect,
  campaignInteractionSelect,
  listCampaigns,
  findCampaignById,
  findCampaign,
  findCampaignTargetSegments,
  findCampaignsByBrand,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  logPerformance,
  findLeadById,
  findCustomerById,
  createCampaignAttribution,
  createCampaignInteraction,
  logAIInsight,
};
