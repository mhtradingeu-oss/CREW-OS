import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

const aiInsightSelect = {
  id: true,
} satisfies Prisma.AIInsightSelect;

async function createAIInsight(input: {
  brandId?: string | null;
  os: string;
  entityType: string;
  entityId: string;
  summary: string;
  details: string;
}) {
  return prisma.aIInsight.create({
    data: {
      brandId: input.brandId ?? null,
      os: input.os,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      details: input.details,
    },
    select: aiInsightSelect,
  });
}

export const mediaStudioRepository = {
  createAIInsight,
};
