import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { buildPagination } from "../../utils/pagination.js";
import type {
  CompetitorSocialReportRecord,
  CreateInfluencerInput,
  CreateTrendInput,
  IngestMentionInput,
  IngestTrendInput,
  InfluencerRecord,
  PaginatedResponse,
  SocialAISummaryResult,
  SocialMentionRecord,
  SocialTrendRecord,
} from "../../../modules/social-intelligence/social-intelligence.types.js";

const mentionSelect = {
  id: true,
  brandId: true,
  platform: true,
  author: true,
  keyword: true,
  content: true,
  sentiment: true,
  url: true,
  occurredAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SocialMentionSelect;

const influencerSelect = {
  id: true,
  brandId: true,
  handle: true,
  platform: true,
  followers: true,
  engagementRate: true,
  profileUrl: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InfluencerProfileSelect;

const trendSelect = {
  id: true,
  brandId: true,
  topic: true,
  platform: true,
  score: true,
  trendDataJson: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SocialTrendSelect;

const competitorSelect = {
  id: true,
  brandId: true,
  competitor: true,
  period: true,
  summary: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CompetitorSocialReportSelect;

const aiInsightSelect = {
  id: true,
  brandId: true,
  os: true,
  entityType: true,
  entityId: true,
  summary: true,
  details: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AIInsightSelect;

type PaginationResult = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

function resolvePagination(page?: number, pageSize?: number): PaginationResult {
  const normalizedPage = Number.isFinite(page ?? NaN) && (page ?? 0) > 0 ? Math.floor(page ?? 0) : 1;
  const normalizedPageSize =
    Number.isFinite(pageSize ?? NaN) && (pageSize ?? 0) > 0 ? Math.floor(pageSize ?? 0) : 20;
  const { skip, take } = buildPagination({ page: normalizedPage, pageSize: normalizedPageSize });
  return { page: normalizedPage, pageSize: take, skip, take };
}

function mapMention(record: Prisma.SocialMentionGetPayload<{ select: typeof mentionSelect }>): SocialMentionRecord {
  return {
    id: record.id,
    brandId: record.brandId ?? null,
    platform: record.platform,
    author: record.author ?? null,
    keyword: record.keyword ?? null,
    content: record.content ?? null,
    sentiment: record.sentiment ?? null,
    url: record.url ?? null,
    occurredAt: record.occurredAt ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapInfluencer(record: Prisma.InfluencerProfileGetPayload<{ select: typeof influencerSelect }>): InfluencerRecord {
  return {
    id: record.id,
    brandId: record.brandId ?? null,
    handle: record.handle,
    platform: record.platform,
    followers: record.followers ?? null,
    engagementRate: record.engagementRate ?? null,
    profileUrl: record.profileUrl ?? null,
    tags: record.tags ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapTrend(record: Prisma.SocialTrendGetPayload<{ select: typeof trendSelect }>): SocialTrendRecord {
  return {
    id: record.id,
    brandId: record.brandId ?? null,
    topic: record.topic,
    platform: record.platform ?? null,
    score: record.score ?? null,
    trendData: record.trendDataJson ? JSON.parse(record.trendDataJson) : null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapCompetitorReport(
  record: Prisma.CompetitorSocialReportGetPayload<{ select: typeof competitorSelect }>,
): CompetitorSocialReportRecord {
  return {
    id: record.id,
    brandId: record.brandId ?? null,
    competitor: record.competitor ?? null,
    period: record.period ?? null,
    summary: record.summary ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapAIInsight(record: Prisma.AIInsightGetPayload<{ select: typeof aiInsightSelect }>): SocialAISummaryResult {
  return {
    id: record.id,
    summary: record.summary ?? "",
    details: record.details ?? "",
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

type MentionListParams = {
  brandId?: string;
  platform?: string;
  sentiment?: string;
  keyword?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

type InfluencerListParams = {
  brandId?: string;
  platform?: string;
  tag?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

type TrendListParams = {
  brandId?: string;
  platform?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

type CompetitorListParams = {
  brandId?: string;
  competitor?: string;
  page?: number;
  pageSize?: number;
};

type CreateInsightInput = {
  brandId: string;
  os: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  details: string;
};

async function listMentions(params: MentionListParams): Promise<PaginatedResponse<SocialMentionRecord>> {
  const { page, pageSize, skip, take } = resolvePagination(params.page, params.pageSize);
  const where: Prisma.SocialMentionWhereInput = {};
  if (params.brandId) where.brandId = params.brandId;
  if (params.platform) where.platform = params.platform;
  if (params.sentiment) where.sentiment = params.sentiment;
  if (params.keyword) where.keyword = params.keyword;
  if (params.search) {
    where.OR = [
      { author: { contains: params.search, mode: "insensitive" } },
      { content: { contains: params.search, mode: "insensitive" } },
    ];
  }
  const [total, rows] = await prisma.$transaction([
    prisma.socialMention.count({ where }),
    prisma.socialMention.findMany({
      where,
      select: mentionSelect,
      orderBy: { occurredAt: "desc" },
      skip,
      take,
    }),
  ]);
  return { items: rows.map(mapMention), total, page, pageSize };
}

async function getMentionById(id: string): Promise<SocialMentionRecord | null> {
  const record = await prisma.socialMention.findUnique({ where: { id }, select: mentionSelect });
  return record ? mapMention(record) : null;
}

async function createMention(input: IngestMentionInput): Promise<SocialMentionRecord> {
  const mention = await prisma.socialMention.create({
    data: {
      brandId: input.brandId,
      platform: input.platform,
      author: input.author ?? null,
      keyword: input.keyword ?? null,
      content: input.content ?? null,
      sentiment: input.sentiment ?? null,
      url: input.url ?? null,
      occurredAt: input.occurredAt ?? new Date(),
    },
    select: mentionSelect,
  });
  return mapMention(mention);
}

async function listInfluencers(params: InfluencerListParams): Promise<PaginatedResponse<InfluencerRecord>> {
  const { page, pageSize, skip, take } = resolvePagination(params.page, params.pageSize);
  const where: Prisma.InfluencerProfileWhereInput = {};
  if (params.brandId) where.brandId = params.brandId;
  if (params.platform) where.platform = params.platform;
  if (params.tag) where.tags = { contains: params.tag, mode: "insensitive" };
  if (params.search) {
    where.OR = [
      { handle: { contains: params.search, mode: "insensitive" } },
      { profileUrl: { contains: params.search, mode: "insensitive" } },
    ];
  }
  const [total, rows] = await prisma.$transaction([
    prisma.influencerProfile.count({ where }),
    prisma.influencerProfile.findMany({
      where,
      select: influencerSelect,
      orderBy: { followers: "desc" },
      skip,
      take,
    }),
  ]);
  return { items: rows.map(mapInfluencer), total, page, pageSize };
}

async function createInfluencer(input: CreateInfluencerInput): Promise<InfluencerRecord> {
  const record = await prisma.influencerProfile.create({
    data: {
      brandId: input.brandId ?? null,
      handle: input.handle,
      platform: input.platform,
      followers: input.followers ?? null,
      engagementRate: input.engagementRate ?? null,
      profileUrl: input.profileUrl ?? null,
      tags: input.tags ?? null,
    },
    select: influencerSelect,
  });
  return mapInfluencer(record);
}

async function findInfluencerById(id: string): Promise<InfluencerRecord | null> {
  const record = await prisma.influencerProfile.findUnique({ where: { id }, select: influencerSelect });
  return record ? mapInfluencer(record) : null;
}

async function updateInfluencer(id: string, input: Partial<CreateInfluencerInput>): Promise<InfluencerRecord> {
  const updated = await prisma.influencerProfile.update({
    where: { id },
    data: {
      brandId: input.brandId,
      handle: input.handle,
      platform: input.platform,
      followers: input.followers,
      engagementRate: input.engagementRate,
      profileUrl: input.profileUrl,
      tags: input.tags,
    },
    select: influencerSelect,
  });
  return mapInfluencer(updated);
}

async function deleteInfluencer(id: string) {
  await prisma.influencerProfile.delete({ where: { id } });
}

async function listTrends(params: TrendListParams): Promise<PaginatedResponse<SocialTrendRecord>> {
  const { page, pageSize, skip, take } = resolvePagination(params.page, params.pageSize);
  const where: Prisma.SocialTrendWhereInput = {};
  if (params.brandId) where.brandId = params.brandId;
  if (params.platform) where.platform = params.platform;
  if (params.search) where.topic = { contains: params.search, mode: "insensitive" };
  const [total, rows] = await prisma.$transaction([
    prisma.socialTrend.count({ where }),
    prisma.socialTrend.findMany({
      where,
      select: trendSelect,
      orderBy: { score: "desc" },
      skip,
      take,
    }),
  ]);
  return { items: rows.map(mapTrend), total, page, pageSize };
}

async function findTrendById(id: string): Promise<SocialTrendRecord | null> {
  const record = await prisma.socialTrend.findUnique({ where: { id }, select: trendSelect });
  return record ? mapTrend(record) : null;
}

async function findTrendByUniqueKey(opts: {
  brandId: string;
  topic: string;
  platform?: string | null;
}): Promise<SocialTrendRecord | null> {
  const where: Prisma.SocialTrendWhereInput = {
    brandId: opts.brandId,
    topic: opts.topic,
  };
  if (opts.platform !== undefined) {
    where.platform = opts.platform;
  }
  const record = await prisma.socialTrend.findFirst({
    where,
    select: trendSelect,
  });
  return record ? mapTrend(record) : null;
}

async function createTrend(input: CreateTrendInput): Promise<SocialTrendRecord> {
  const record = await prisma.socialTrend.create({
    data: {
      brandId: input.brandId ?? null,
      topic: input.topic,
      platform: input.platform ?? null,
      score: input.score ?? null,
      trendDataJson: input.trendData ? JSON.stringify(input.trendData) : null,
    },
    select: trendSelect,
  });
  return mapTrend(record);
}

async function updateTrend(id: string, input: Partial<CreateTrendInput>): Promise<SocialTrendRecord> {
  const record = await prisma.socialTrend.update({
    where: { id },
    data: {
      brandId: input.brandId,
      topic: input.topic,
      platform: input.platform,
      score: input.score,
      trendDataJson: input.trendData !== undefined ? JSON.stringify(input.trendData) : undefined,
    },
    select: trendSelect,
  });
  return mapTrend(record);
}

async function deleteTrend(id: string) {
  await prisma.socialTrend.delete({ where: { id } });
}

async function listCompetitorReports(
  params: CompetitorListParams,
): Promise<PaginatedResponse<CompetitorSocialReportRecord>> {
  const { page, pageSize, skip, take } = resolvePagination(params.page, params.pageSize);
  const where: Prisma.CompetitorSocialReportWhereInput = {};
  if (params.brandId) where.brandId = params.brandId;
  if (params.competitor) {
    where.competitor = { contains: params.competitor, mode: "insensitive" };
  }
  const [total, rows] = await prisma.$transaction([
    prisma.competitorSocialReport.count({ where }),
    prisma.competitorSocialReport.findMany({
      where,
      select: competitorSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);
  return { items: rows.map(mapCompetitorReport), total, page, pageSize };
}

async function getRecentMentionsForBrand(brandId: string, limit = 20): Promise<SocialMentionRecord[]> {
  const rows = await prisma.socialMention.findMany({
    where: { brandId },
    orderBy: { occurredAt: "desc" },
    take: limit,
    select: mentionSelect,
  });
  return rows.map(mapMention);
}

async function getRecentTrendsForBrand(brandId: string, limit = 10): Promise<SocialTrendRecord[]> {
  const rows = await prisma.socialTrend.findMany({
    where: { brandId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: trendSelect,
  });
  return rows.map(mapTrend);
}

async function getRecentCompetitorReportsForBrand(
  brandId: string,
  limit = 5,
): Promise<CompetitorSocialReportRecord[]> {
  const rows = await prisma.competitorSocialReport.findMany({
    where: { brandId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: competitorSelect,
  });
  return rows.map(mapCompetitorReport);
}

async function findInsight(
  brandId: string,
  entityType: string,
  entityId: string,
): Promise<SocialAISummaryResult | null> {
  const insight = await prisma.aIInsight.findFirst({
    where: { brandId, os: "social", entityType, entityId },
    orderBy: { updatedAt: "desc" },
    select: aiInsightSelect,
  });
  if (!insight) return null;
  return mapAIInsight(insight);
}

async function createInsight(input: CreateInsightInput): Promise<SocialAISummaryResult> {
  const insight = await prisma.aIInsight.create({
    data: {
      brandId: input.brandId,
      os: input.os,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      details: input.details,
    },
    select: aiInsightSelect,
  });
  return mapAIInsight(insight);
}

export const socialIntelligenceRepository = {
  listMentions,
  getMentionById,
  createMention,
  listInfluencers,
  createInfluencer,
  findInfluencerById,
  updateInfluencer,
  deleteInfluencer,
  listTrends,
  findTrendById,
  findTrendByUniqueKey,
  createTrend,
  updateTrend,
  deleteTrend,
  listCompetitorReports,
  getRecentMentionsForBrand,
  getRecentTrendsForBrand,
  getRecentCompetitorReportsForBrand,
  findInsight,
  createInsight,
};
