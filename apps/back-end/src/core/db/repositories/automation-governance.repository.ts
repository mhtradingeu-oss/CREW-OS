import type { Prisma, AutomationExecutionKillSwitchTarget } from "@prisma/client";
import { prisma } from "../../prisma.js";

export const AutomationGovernanceRepository = {
  async getBrandKillSwitch(brandId: string) {
    return prisma.automationBrandKillSwitch.findUnique({
      where: { brandId },
    });
  },

  async createIncident(payload: Prisma.AutomationIncidentCreateInput) {
    return prisma.automationIncident.create({
      data: payload,
    });
  },

  async getIncidentById(incidentId: string) {
    return prisma.automationIncident.findUnique({
      where: { incidentId },
    });
  },

  async updateIncident(incidentId: string, data: Prisma.AutomationIncidentUpdateInput) {
    return prisma.automationIncident.update({
      where: { incidentId },
      data,
    });
  },

  async findActiveExecutionKillSwitch(targetType: AutomationExecutionKillSwitchTarget, targetId: string) {
    return prisma.automationExecutionKillSwitch.findFirst({
      where: { targetType, targetId, isActive: true },
    });
  },

  async createExecutionKillSwitch(payload: Prisma.AutomationExecutionKillSwitchCreateInput) {
    return prisma.automationExecutionKillSwitch.create({
      data: payload,
    });
  },

  async createRollbackExecution(payload: Prisma.AutomationRollbackExecutionLedgerCreateInput) {
    return prisma.automationRollbackExecutionLedger.create({
      data: payload,
    });
  },

  async getRollbackByExecutionId(executionId: string) {
    return prisma.automationRollbackExecutionLedger.findFirst({
      where: { executionId },
    });
  },

  async getRollbackById(id: string) {
    return prisma.automationRollbackExecutionLedger.findUnique({
      where: { id },
    });
  },

  async updateRollbackExecution(
    id: string,
    data: Prisma.AutomationRollbackExecutionLedgerUpdateInput,
  ) {
    return prisma.automationRollbackExecutionLedger.update({
      where: { id },
      data,
    });
  },
};
