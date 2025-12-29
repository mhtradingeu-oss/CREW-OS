import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

export const AutomationExecutionRepository = {
  async getApprovalDecisionById(id: string) {
    return prisma.automationApprovalDecision.findUnique({
      where: { id },
      include: {
        suggestion: {
          select: {
            brandId: true,
          },
        },
      },
    });
  },

  async getExecutionById(id: string) {
    return prisma.automationExecutionLedger.findUnique({
      where: { id },
    });
  },

  async logExecution(payload: Prisma.AutomationExecutionLedgerCreateInput) {
    return prisma.automationExecutionLedger.create({
      data: payload,
    });
  },
};
