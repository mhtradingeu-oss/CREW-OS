import type { AutomationExecutionKillSwitchTarget } from "@prisma/client";
import { env } from "../../config/env.js";
import { forbidden } from "../../http/errors.js";
import { logger } from "../../logger.js";
import { AutomationGovernanceRepository } from "../../db/repositories/automation-governance.repository.js";
import { automationKillSwitchActivated } from "./metrics.js";

export type KillSwitchContext = {
  module: string;
  action: string;
  approvalDecisionId?: string;
  suggestionId?: string;
  executionId?: string;
  brandId?: string;
  correlationId?: string;
};

export class AutomationKillSwitchService {
  constructor(private readonly repository = AutomationGovernanceRepository) {}

  assertGlobalEnabled(context: KillSwitchContext) {
    if (env.AUTOMATION_GLOBAL_DISABLED) {
      this.blockWithMetric("global", context, "Global automation kill switch engaged");
    }
  }

  async ensureApprovalAllowed(approvalId: string, brandId: string | null | undefined, context: KillSwitchContext) {
    await this.assertBrandAllowed(brandId, context);
    await this.assertTargetAllowed("APPROVAL_DECISION", approvalId, context);
  }

  async ensureExecutionAllowed(executionId: string, context: KillSwitchContext) {
    await this.assertTargetAllowed("EXECUTION", executionId, context);
  }

  private async assertBrandAllowed(brandId: string | null | undefined, context: KillSwitchContext) {
    if (!brandId) return;
    const record = await this.repository.getBrandKillSwitch(brandId);
    if (record?.enabled) {
      this.blockWithMetric("brand", { ...context, brandId }, "Brand-level automation kill switch engaged", {
        reason: record.reason,
        activatedById: record.activatedById,
      });
    }
  }

  private async assertTargetAllowed(
    targetType: AutomationExecutionKillSwitchTarget,
    targetId: string,
    context: KillSwitchContext,
  ) {
    const record = await this.repository.findActiveExecutionKillSwitch(targetType, targetId);
    if (record) {
      this.blockWithMetric("execution", { ...context }, "Execution-level kill switch engaged", {
        targetType,
        targetId,
        reason: record.reason,
        incidentId: record.incidentId,
      });
    }
  }

  private blockWithMetric(scope: string, context: KillSwitchContext, message: string, details?: Record<string, unknown>) {
    automationKillSwitchActivated.inc({ scope });
    logger.warn("automation.kill_switch.blocked", {
      ...context,
      scope,
      message,
      ...details,
    });
    throw forbidden("Automation execution blocked by kill switch", "AUTOMATION_KILL_SWITCH");
  }
}

export const automationKillSwitchService = new AutomationKillSwitchService();
