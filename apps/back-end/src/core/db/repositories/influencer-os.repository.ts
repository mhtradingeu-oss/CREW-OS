import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { buildPagination } from "../../utils/pagination.js";

const statSelect = {
  id: true,
  followers: true,
  engagementRate: true,
  fakeFollowerPct: true,
  audienceMatchScore: true,
  marketFitScore: true,
  authenticityScore: true,
  metricsJson: true,
  collectedAt: true,
} satisfies Prisma.InfluencerStatSnapshotSelect;

export type InfluencerScoreRecord = {
  id: string;
  brandId?: string | null;
  handle: string;
  displayName?: string | null;
  platform: string;
  followers?: number | null;
  engagementRate?: number | null;
  fakeFollowerRisk?: number | null;
  marketFitScore?: number | null;
  authenticityScore?: number | null;
  category?: string | null;
  country?: string | null;
  language?: string | null;
  tags?: string | null;
  status?: string | null;
  riskNotes?: string | null;
  score: number;
  scoreBreakdown: {
    engagement: number;
    marketFit: number;
    authenticity: number;
    fakeFollowerRisk: number;
  };
  latestStat?: Prisma.InfluencerStatSnapshotGetPayload<{ select: typeof statSelect }> | null;
};

type InfluencerProfileWithSnapshots = Prisma.InfluencerProfileGetPayload<{
  include: { statSnapshots: { select: typeof statSelect; orderBy: { collectedAt: "desc" }; take: 1 } };
}>;

type InfluencerStatRecord = Prisma.InfluencerStatSnapshotGetPayload<{ select: typeof statSelect }>;

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

type ScoreListParams = {
  brandId?: string;
  platform?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

type NegotiationListParams = {
  brandId?: string;
  page?: number;
  pageSize?: number;
};

type CampaignLinkListParams = {
  brandId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

type InfluencerProfileInput = {
  brandId?: string | null;
  handle: string;
  displayName?: string | null;
  platform: string;
  followers?: number | null;
  engagementRate?: number | null;
  fakeFollowerRisk?: number | null;
  marketFitScore?: number | null;
  authenticityScore?: number | null;
  category?: string | null;
  country?: string | null;
  language?: string | null;
  contactEmail?: string | null;
  tags?: string | null;
  profileUrl?: string | null;
  riskNotes?: string | null;
};

type DiscoveryTaskInput = {
  brandId: string | null;
  query?: string | null;
  categories?: string | null;
  platforms?: string | null;
  status: string;
  resultCount: number;
  findingsJson: string;
  requestedByUserId?: string | null;
};

type NegotiationResult = Prisma.InfluencerNegotiationGetPayload<{ include: { influencer: true } }>;

type CampaignLinkResult = Prisma.InfluencerCampaignLinkGetPayload<{ include: { influencer: true; campaign: true } }>;

function computeBreakdown(
  profile: { engagementRate?: number | null; marketFitScore?: number | null; authenticityScore?: number | null; fakeFollowerRisk?: number | null },
  stat?: { engagementRate?: number | null; marketFitScore?: number | null; authenticityScore?: number | null; fakeFollowerPct?: number | null },
) {
  const engagement = (stat?.engagementRate ?? profile.engagementRate ?? 0) / 10;
  const marketFit = (stat?.marketFitScore ?? profile.marketFitScore ?? 0) / 10;
  const authenticity = (stat?.authenticityScore ?? profile.authenticityScore ?? 0.5);
  const fakeRisk = stat?.fakeFollowerPct ?? profile.fakeFollowerRisk ?? 0;
  const score = Math.round(
    Math.max(0, Math.min(100, (0.35 * marketFit + 0.3 * engagement + 0.2 * authenticity + 0.15 * (1 - fakeRisk)) * 100)),
  );
  return {
    score,
    breakdown: {
      engagement: Number((engagement * 100).toFixed(1)),
      marketFit: Number((marketFit * 100).toFixed(1)),
      authenticity: Number((authenticity * 100).toFixed(1)),
      fakeFollowerRisk: Number(((fakeRisk ?? 0) * 100).toFixed(1)),
    },
  };
}

export function mapProfileToScoreRecord(profile: InfluencerProfileWithSnapshots, stat: InfluencerStatRecord | null) {
  const breakdown = computeBreakdown(profile, stat ?? undefined);
  return {
    id: profile.id,
    brandId: profile.brandId ?? undefined,
    handle: profile.handle,
    displayName: profile.displayName,
    platform: profile.platform,
    followers: profile.followers,
    engagementRate: stat?.engagementRate ?? profile.engagementRate,
    fakeFollowerRisk: stat?.fakeFollowerPct ?? profile.fakeFollowerRisk,
    marketFitScore: stat?.marketFitScore ?? profile.marketFitScore,
    authenticityScore: stat?.authenticityScore ?? profile.authenticityScore,
    category: profile.category,
    country: profile.country,
    language: profile.language,
    tags: profile.tags,
    status: profile.status,
    riskNotes: profile.riskNotes,
    score: breakdown.score,
    scoreBreakdown: breakdown.breakdown,
    latestStat: stat ?? profile.statSnapshots?.[0] ?? undefined,
  } satisfies InfluencerScoreRecord;
}

async function createDiscoveryTask(input: DiscoveryTaskInput) {
  return prisma.influencerDiscoveryTask.create({
    data: {
      brandId: input.brandId,
      query: input.query ?? null,
      categories: input.categories ?? null,
      platforms: input.platforms ?? null,
      status: input.status,
      resultCount: input.resultCount,
      findingsJson: input.findingsJson,
      requestedByUserId: input.requestedByUserId ?? null,
    },
    select: { id: true },
  });
}

async function findProfileByHandle(filters: {
  brandId: string | null;
  handle: string;
  platform: string;
}): Promise<{ id: string } | null> {
  return prisma.influencerProfile.findFirst({
    where: { handle: filters.handle, platform: filters.platform, brandId: filters.brandId },
    select: { id: true },
  });
}

async function createProfile(data: InfluencerProfileInput) {
  return prisma.influencerProfile.create({
    data: {
      brandId: data.brandId ?? null,
      handle: data.handle,
      displayName: data.displayName ?? data.handle,
      platform: data.platform,
      followers: data.followers ?? null,
      engagementRate: data.engagementRate ?? null,
      fakeFollowerRisk: data.fakeFollowerRisk ?? null,
      marketFitScore: data.marketFitScore ?? null,
      authenticityScore: data.authenticityScore ?? null,
      category: data.category ?? null,
      country: data.country ?? null,
      language: data.language ?? null,
      contactEmail: data.contactEmail ?? null,
      tags: data.tags ?? null,
      profileUrl: data.profileUrl ?? null,
      riskNotes: data.riskNotes ?? null,
    },
    include: { statSnapshots: { select: statSelect, orderBy: { collectedAt: "desc" }, take: 1 } },
  });
}

async function updateProfile(id: string, data: InfluencerProfileInput) {
  return prisma.influencerProfile.update({
    where: { id },
    data: {
      brandId: data.brandId ?? null,
      handle: data.handle,
      displayName: data.displayName,
      platform: data.platform,
      followers: data.followers ?? null,
      engagementRate: data.engagementRate ?? null,
      fakeFollowerRisk: data.fakeFollowerRisk ?? null,
      marketFitScore: data.marketFitScore ?? null,
      authenticityScore: data.authenticityScore ?? null,
      category: data.category ?? null,
      country: data.country ?? null,
      language: data.language ?? null,
      tags: data.tags ?? null,
      profileUrl: data.profileUrl ?? null,
      riskNotes: data.riskNotes ?? null,
    },
    include: { statSnapshots: { select: statSelect, orderBy: { collectedAt: "desc" }, take: 1 } },
  });
}

async function createStatSnapshot(data: {
  influencerId: string;
  brandId: string | null;
  followers?: number | null;
  engagementRate?: number | null;
  fakeFollowerPct?: number | null;
  marketFitScore?: number | null;
  authenticityScore?: number | null;
  metricsJson?: Record<string, unknown> | null;
}) {
  return prisma.influencerStatSnapshot.create({
    data: {
      influencerId: data.influencerId,
      brandId: data.brandId,
      followers: data.followers ?? null,
      engagementRate: data.engagementRate ?? null,
      fakeFollowerPct: data.fakeFollowerPct ?? null,
      marketFitScore: data.marketFitScore ?? null,
      authenticityScore: data.authenticityScore ?? null,
      metricsJson: data.metricsJson ? JSON.stringify(data.metricsJson) : null,
    },
    select: statSelect,
  });
}

async function listScores(params: ScoreListParams): Promise<PaginatedResult<InfluencerScoreRecord>> {
  const { page = 1, pageSize = 20, skip, take } = (() => {
    const normalizedPage = Math.max(1, params.page ?? 1);
    const normalizedPageSize = Math.max(1, params.pageSize ?? 20);
    const pagination = buildPagination({ page: normalizedPage, pageSize: normalizedPageSize });
    return { page: normalizedPage, pageSize: pagination.take, skip: pagination.skip, take: pagination.take };
  })();
  const where: Prisma.InfluencerProfileWhereInput = {};
  if (params.brandId) where.brandId = params.brandId;
  if (params.platform) where.platform = params.platform;
  if (params.category) where.category = { contains: params.category, mode: "insensitive" };
  if (params.search) {
    where.OR = [
      { handle: { contains: params.search, mode: "insensitive" } },
      { displayName: { contains: params.search, mode: "insensitive" } },
      { tags: { contains: params.search, mode: "insensitive" } },
    ];
  }
  const [total, rows] = await prisma.$transaction([
    prisma.influencerProfile.count({ where }),
    prisma.influencerProfile.findMany({
      where,
      include: { statSnapshots: { select: statSelect, orderBy: { collectedAt: "desc" }, take: 1 } },
      orderBy: { followers: "desc" },
      skip,
      take,
    }),
  ]);
  return {
    items: rows.map((row) => mapProfileToScoreRecord(row, row.statSnapshots?.[0] ?? null)),
    total,
    page,
    pageSize: take,
  };
}

async function findInfluencerById(id: string) {
  return prisma.influencerProfile.findUnique({
    where: { id },
    include: { statSnapshots: { select: statSelect, orderBy: { collectedAt: "desc" }, take: 1 } },
  });
}

async function createNegotiation(data: {
  brandId?: string | null;
  influencerId: string;
  status: string;
  terms: Record<string, unknown>;
  notes?: string | null;
}) {
  return prisma.influencerNegotiation.create({
    data: {
      brandId: data.brandId ?? null,
      influencerId: data.influencerId,
      status: data.status,
      lastSuggestedAt: new Date(),
      termsJson: JSON.stringify(data.terms),
      notes: data.notes ?? null,
    },
    include: { influencer: true },
  });
}

async function listNegotiations(params: NegotiationListParams): Promise<PaginatedResult<NegotiationResult>> {
  const normalizedPage = Math.max(1, params.page ?? 1);
  const normalizedPageSize = Math.max(1, params.pageSize ?? 20);
  const { skip, take } = buildPagination({ page: normalizedPage, pageSize: normalizedPageSize });
  const where: Prisma.InfluencerNegotiationWhereInput = {};
  if (params.brandId) where.brandId = params.brandId;
  const [total, rows] = await prisma.$transaction([
    prisma.influencerNegotiation.count({ where }),
    prisma.influencerNegotiation.findMany({
      where,
      include: { influencer: true },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
  ]);
  return { items: rows, total, page: normalizedPage, pageSize: take };
}

async function findCampaignById(id: string) {
  return prisma.campaign.findUnique({ where: { id }, select: { id: true } });
}

async function createCampaignLink(data: {
  brandId: string | null;
  influencerId: string;
  campaignId?: string | null;
  role?: string | null;
  trackingUrl?: string | null;
  status?: string;
  performance?: Record<string, unknown> | null;
}) {
  return prisma.influencerCampaignLink.create({
    data: {
      brandId: data.brandId,
      influencerId: data.influencerId,
      campaignId: data.campaignId ?? null,
      role: data.role ?? null,
      trackingUrl: data.trackingUrl ?? null,
      status: data.status ?? "active",
      performanceJson: data.performance ? JSON.stringify(data.performance) : null,
    },
    include: { influencer: true, campaign: true },
  });
}

async function listCampaignLinks(params: CampaignLinkListParams): Promise<PaginatedResult<CampaignLinkResult>> {
  const normalizedPage = Math.max(1, params.page ?? 1);
  const normalizedPageSize = Math.max(1, params.pageSize ?? 20);
  const { skip, take } = buildPagination({ page: normalizedPage, pageSize: normalizedPageSize });
  const where: Prisma.InfluencerCampaignLinkWhereInput = {};
  if (params.brandId) where.brandId = params.brandId;
  if (params.status) where.status = params.status;
  const [total, rows] = await prisma.$transaction([
    prisma.influencerCampaignLink.count({ where }),
    prisma.influencerCampaignLink.findMany({
      where,
      include: { influencer: true, campaign: true },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
  ]);
  return { items: rows, total, page: normalizedPage, pageSize: take };
}

export const influencerOSRepository = {
  createDiscoveryTask,
  findProfileByHandle,
  createProfile,
  updateProfile,
  createStatSnapshot,
  listScores,
  findInfluencerById,
  createNegotiation,
  listNegotiations,
  findCampaignById,
  createCampaignLink,
  listCampaignLinks,
};
