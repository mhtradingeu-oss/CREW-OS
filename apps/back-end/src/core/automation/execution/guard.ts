import type { AutomationApprovalDecision } from "@prisma/client";
import { env } from "../../config/env.js";
import { conflict, forbidden } from "../../http/errors.js";
import { logger } from "../../logger.js";
import { AutomationExecutionRepository } from "../../db/repositories/automation-execution.repository.js";

type GuardInput = {
  approvalDecisionId: string;
  suggestionId: string;
  snapshotHash: string;
  correlationId?: string;
};

const buildContext = (input: GuardInput) => ({
  module: "automation-execution",
  action: "guard",
  approvalDecisionId: input.approvalDecisionId,
  suggestionId: input.suggestionId,
  snapshotHash: input.snapshotHash,
  environment: env.NODE_ENV,
  correlationId: input.correlationId,
});

function logRejected(message: string, context: ReturnType<typeof buildContext>, reason: string) {
  logger.warn("execution.guard.rejected", {
    ...context,
    reason,
    message,
  });
}

type ApprovalRepository = Pick<typeof AutomationExecutionRepository, "getApprovalDecisionById">;

export class AutomationExecutionGuard {
  constructor(
    private readonly repository: ApprovalRepository = AutomationExecutionRepository,
    private readonly killSwitch = automationKillSwitchService,
  ) {}

  async ensureApprovalExecutable(input: GuardInput): Promise<AutomationApprovalDecision> {
    const context = buildContext(input);
    if (!env.AUTOMATION_EXECUTION_ENABLED) {
      logRejected("Feature flag disabled", context, "feature_flag_disabled");
      throw forbidden("Automation execution is disabled", "AUTOMATION_EXECUTION_DISABLED");
    }

    const approval = await this.repository.getApprovalDecisionById(input.approvalDecisionId);
    if (!approval) {
      logRejected("Approval decision missing", context, "missing_approval");
      throw conflict("Approval decision not found", null, "APPROVAL_NOT_FOUND");
    }

    await this.killSwitch.ensureApprovalAllowed(approval.id, approval.suggestion?.brandId, context);

    this.enforceStatus(approval, context);
    this.enforceSuggestionMatching(approval, input, context);
    this.enforceSnapshotMatching(approval, input, context);
    this.enforceEnvironment(approval, context);
    this.enforceFreshness(approval, context);

    return approval;
  }

  private enforceStatus(approval: AutomationApprovalDecision, context: ReturnType<typeof buildContext>) {
    if (approval.status !== "APPROVED") {
      logRejected(`Approval status '${approval.status}' is not APPROVED`, context, "status_invalid");
      throw conflict("Approval decision is not approved", { status: approval.status }, "APPROVAL_STATUS_INVALID");
    }
    if (approval.revokedAt) {
      logRejected("Approval decision revoked", context, "revoked");
      throw conflict("Approval decision has been revoked", { revokedAt: approval.revokedAt }, "APPROVAL_REVOKED");
    }
  }

  private enforceSuggestionMatching(
    approval: AutomationApprovalDecision,
    input: GuardInput,
    context: ReturnType<typeof buildContext>,
  ) {
    if (approval.suggestionId && approval.suggestionId !== input.suggestionId) {
      logRejected("Suggestion mismatch", context, "suggestion_mismatch");
      throw conflict("Approval decision does not match the provided suggestion", null, "APPROVAL_SUGGESTION_MISMATCH");
    }
  }

  private enforceSnapshotMatching(
    approval: AutomationApprovalDecision,
    input: GuardInput,
    context: ReturnType<typeof buildContext>,
  ) {
    if (approval.snapshotHash !== input.snapshotHash) {
      logRejected("Snapshot hash mismatch", context, "snapshot_mismatch");
      throw conflict("Snapshot hash does not match the approved snapshot", null, "SNAPSHOT_MISMATCH");
    }
  }

  private enforceEnvironment(approval: AutomationApprovalDecision, context: ReturnType<typeof buildContext>) {
    if (!approval.environment) {
      logRejected("Approval missing environment metadata", context, "environment_missing");
      throw conflict("Approval decision does not declare an execution environment", null, "ENVIRONMENT_MISSING");
    }
    if (approval.environment !== env.NODE_ENV) {
      logRejected("Environment mismatch", context, "environment_mismatch");
      throw conflict("Approval decision environment does not match current environment", null, "ENVIRONMENT_MISMATCH");
    }
  }

  private enforceFreshness(approval: AutomationApprovalDecision, context: ReturnType<typeof buildContext>) {
    const now = new Date();
    if (approval.expiresAt && approval.expiresAt <= now) {
      logRejected("Approval expired", context, "expired");
      throw conflict("Approval decision has expired", { expiresAt: approval.expiresAt }, "APPROVAL_EXPIRED");
    }
  }
}
