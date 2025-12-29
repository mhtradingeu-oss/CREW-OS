import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

export async function createInsight(data: Prisma.AIInsightUncheckedCreateInput) {
  return prisma.aIInsight.create({ data });
}
