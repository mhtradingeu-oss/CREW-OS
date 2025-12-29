import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

export async function createPricingHistory(data: Prisma.AIPricingHistoryUncheckedCreateInput) {
  return prisma.aIPricingHistory.create({ data });
}
