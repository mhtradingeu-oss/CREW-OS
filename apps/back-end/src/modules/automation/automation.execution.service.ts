import { automationExecutionFailed, automationExecutionLatency, automationExecutionTotal } from "../../core/automation/execution/metrics.js";
import { AutomationExecutionGuard } from "../../core/automation/execution/guard.js";
import { AutomationExecutionActionContext } from "../../core/automation/execution/types.js";
import { resolveAutomationExecutionAction } from "../../core/automation/execution/actions.js";
import { AutomationExecutionRepository } from "../../core/db/repositories/automation-execution.repository.js";
import { logger } from "../../core/logger.js";
import type { KillSwitchContext } from "../../core/automation/governance/kill-switch.service.js";
import { createId } from "@paralleldrive/cuid2";
import type {
  ExecuteAutomationActionRequest,
  ExecuteAutomationActionResponse,
} from "./automation.execution.types.js";
import { ApiError } from "../../core/http/errors.js";
import type { Prisma } from "@prisma/client";
import type { AutomationKillSwitchService } from "../../core/automation/governance/kill-switch.service.js";
import { automationKillSwitchService } from "../../core/automation/governance/kill-switch.service.js";
import { automationIncidentService } from "../../core/automation/governance/incident.service.js";

export class AutomationExecutionService {
  private readonly guard: AutomationExecutionGuard;
  private readonly repository: typeof AutomationExecutionRepository;
  private readonly killSwitchService: AutomationKillSwitchService;
  private readonly incidentService: typeof automationIncidentService;

  constructor(
    guard?: AutomationExecutionGuard,
    repository = AutomationExecutionRepository,
    killSwitchService = automationKillSwitchService,
    incidentService = automationIncidentService,
  ) {
    this.repository = repository;
    this.killSwitchService = killSwitchService;
    this.incidentService = incidentService;
    this.guard = guard ?? new AutomationExecutionGuard(repository, killSwitchService);
  }

  async execute(
    input: ExecuteAutomationActionRequest,
    userId: string,
  ): Promise<ExecuteAutomationActionResponse> {
    const correlationId = input.correlationId;
    const globalKillContext: KillSwitchContext = buildKillSwitchContext({
      correlationId,
      approvalDecisionId: input.approvalDecisionId,
      suggestionId: input.suggestionId,
    });
    this.killSwitchService.assertGlobalEnabled(globalKillContext);
    const approval = await this.guard.ensureApprovalExecutable({
      approvalDecisionId: input.approvalDecisionId,
      suggestionId: input.suggestionId,
      snapshotHash: input.snapshotHash,
      correlationId,
    });

    const action = input.action;
    const actionDefinition = resolveAutomationExecutionAction(action.type);
    const executionId = createId();
    const context: AutomationExecutionActionContext = {
      executionId,
      correlationId,
      approvalDecisionId: approval.id,
      suggestionId: input.suggestionId,
      snapshotHash: input.snapshotHash,
      environment: approval.environment,
      executedBy: {
        connect: { id: userId }
      },
    };

    const logContext = {
      module: "automation-execution",
      action: "execute",
      ...context,
      actionType: action.type,
    };

    logger.info("execution.start", logContext);
    const startedAt = Date.now();

    try {
      const actionKillContext: KillSwitchContext = buildKillSwitchContext({
        correlationId,
        approvalDecisionId: approval.id,
        suggestionId: input.suggestionId,
        executionId,
        brandId: approval.suggestion?.brandId,
      });
      await this.killSwitchService.ensureExecutionAllowed(executionId, actionKillContext);
      const actionResult = await actionDefinition.execute(action.payload as any, context);
      const durationSeconds = Math.max(0, Date.now() - startedAt) / 1000;
      await this.repository.logExecution({
        id: executionId,
        approvalDecision: {
          connect: { id: approval.id },
        },
        suggestionId: input.suggestionId,
        snapshotHash: input.snapshotHash,
        environment: approval.environment,
        executedBy: {
          connect: { id: userId },
        },
        executedAt: new Date(),
        result: "SUCCESS",
        actionType: action.type,
        actionPayloadJson: (action.payload ?? undefined) as Prisma.InputJsonValue | undefined,
        metadataJson: (actionResult.data ?? undefined) as Prisma.InputJsonValue | undefined,
      });
      automationExecutionTotal.inc({ result: "success" });
      automationExecutionLatency.observe({ result: "success" }, durationSeconds);
      logger.info("execution.success", { ...logContext, status: "SUCCESS", durationSeconds });
      return {
        executionId,
        approvalDecisionId: approval.id,
        suggestionId: input.suggestionId,
        status: "SUCCESS",
        actionResult: actionResult.data,
      };
    } catch (error: unknown) {
      await this.recordExecutionIncident(executionId, approval, userId, error);
      const durationSeconds = Math.max(0, Date.now() - startedAt) / 1000;
      automationExecutionFailed.inc();
      automationExecutionTotal.inc({ result: "failed" });
      automationExecutionLatency.observe({ result: "failed" }, durationSeconds);
      const errorCode = error instanceof ApiError && error.code ? error.code : "AUTOMATION_EXECUTION_FAILED";
      await this.repository.logExecution({
        id: executionId,
        approvalDecision: {
          connect: { id: approval.id },
        },
        suggestionId: input.suggestionId,
        snapshotHash: input.snapshotHash,
        environment: approval.environment,
        executedBy: {
          connect: { id: userId },
        },
        executedAt: new Date(),
        result: "FAILED",
        errorCode,
        errorMessage: error instanceof Error ? error.message : String(error),
        actionType: action.type,
        actionPayloadJson: (action.payload ?? undefined) as Prisma.InputJsonValue | undefined,
        metadataJson: error instanceof ApiError && error.details
          ? (error.details as Prisma.InputJsonValue)
          : undefined,
      });
      logger.error("execution.failed", {
        ...logContext,
        status: "FAILED",
        durationSeconds,
        error,
      });
      throw error;
    }
  }

  private async recordExecutionIncident(
    executionId: string,
    approval: Awaited<ReturnType<AutomationExecutionGuard["ensureApprovalExecutable"]>>,
    userId: string,
    error: unknown,
  ) {
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = error instanceof ApiError && error.code ? error.code : "AUTOMATION_EXECUTION_FAILED";
      await this.incidentService.createIncident({
        incidentType: "AUTOMATION_FAILURE",
        severity: "HIGH",
        relatedExecutionId: executionId,
        relatedApprovalDecisionId: approval.id,
        detectedBy: "SYSTEM",
        detectedById: userId,
        description: errorMessage,
        metadata: {
          errorCode,
          errorMessage,
          stack: error instanceof Error && error.stack ? error.stack : undefined,
        },
      });
    } catch (incidentError) {
      logger.warn("incident.record.failed", {
        executionId,
        approvalDecisionId: approval.id,
        error: incidentError,
      });
    }
  }
}

export const automationExecutionService = new AutomationExecutionService();

function buildKillSwitchContext(params: {
  correlationId?: string;
  approvalDecisionId?: string;
  suggestionId?: string;
  executionId?: string;
  brandId?: string | null;
}): KillSwitchContext {
  return {
    module: "automation-execution",
    action: "execute",
    correlationId: params.correlationId,
    approvalDecisionId: params.approvalDecisionId,
    suggestionId: params.suggestionId,
    executionId: params.executionId,
    brandId: params.brandId ?? undefined,
  };
}
