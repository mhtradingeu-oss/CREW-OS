import { prisma } from "../../core/prisma.js";
import { buildGovernanceMetadata } from "../../core/utils/governance-metadata.js";

export async function getInsights(filters: any) {
  const {
    tenantId, brandId, partnerId, featureCode, insightType, crew, startDate, endDate,
    page = 1, pageSize = 50,
  } = filters;
  const where: any = {};
  if (tenantId) where.tenantId = tenantId;
  if (brandId) where.brandId = brandId;
  if (partnerId) where.partnerId = partnerId;
  if (featureCode) where.featureCode = featureCode;
  if (insightType) where.insightType = insightType;
  if (crew) where.crew = crew;
  if (startDate || endDate) where.createdAt = {};
  if (startDate) where.createdAt.gte = new Date(startDate);
  if (endDate) where.createdAt.lte = new Date(endDate);

  const skip = (Number(page) - 1) * Number(pageSize);
  const [data, total] = await Promise.all([
    prisma.planIntelligenceInsight.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(pageSize),
    }),
    prisma.planIntelligenceInsight.count({ where }),
  ]);
  return {
    data,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    governance: buildGovernanceMetadata("PlanIntelligenceInsight", filters),
  };
}

export async function getRecommendations(filters: any) {
  const {
    tenantId, brandId, partnerId, featureCode, crew, startDate, endDate,
    page = 1, pageSize = 50,
  } = filters;
  const where: any = {};
  if (tenantId) where.tenantId = tenantId;
  if (brandId) where.brandId = brandId;
  if (partnerId) where.partnerId = partnerId;
  if (featureCode) where.featureCode = featureCode;
  if (crew) where.crew = crew;
  if (startDate || endDate) where.createdAt = {};
  if (startDate) where.createdAt.gte = new Date(startDate);
  if (endDate) where.createdAt.lte = new Date(endDate);

  const skip = (Number(page) - 1) * Number(pageSize);
  const [data, total] = await Promise.all([
    prisma.aICrewRecommendation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(pageSize),
    }),
    prisma.aICrewRecommendation.count({ where }),
  ]);
  return {
    data,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    governance: buildGovernanceMetadata("AICrewRecommendation", filters),
  };
}
