import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

const insightSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AIInsightSelect;

export async function createFinanceAIInsight(data: Prisma.AIInsightUncheckedCreateInput) {
  return prisma.aIInsight.create({ data, select: insightSelect });
}

export async function createFinanceAILearningJournal(data: Prisma.AILearningJournalUncheckedCreateInput) {
  return prisma.aILearningJournal.create({ data });
}
