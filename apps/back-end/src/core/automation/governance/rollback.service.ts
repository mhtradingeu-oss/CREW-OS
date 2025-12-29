import { conflict } from "../../http/errors.js";
import { logger } from "../../logger.js";
import type { Prisma, AutomationRollbackStatus } from "@prisma/client";
import { env } from "../../config/env.js";
import { AutomationExecutionRepository } from "../../db/repositories/automation-execution.repository.js";
import { AutomationGovernanceRepository } from "../../db/repositories/automation-governance.repository.js";
import { automationIncidentService } from "./incident.service.js";
import { automationRollbackTotal } from "./metrics.js";

export type RollbackRequestInput = {
  executionId: string;
  incidentId: string;
  approvedById: string;
  approvedAt?: Date;
  reason: string;
  snapshotReference: string;
  scopeDescription: string;
  requestedById?: string;
  metadata?: Prisma.InputJsonValue;
};

export type RollbackFinalizeInput = {
  rollbackId: string;
  status: AutomationRollbackStatus;
  metadata?: Prisma.InputJsonValue;
  notes?: string;
  executedAt?: Date;
};

export class AutomationRollbackService {
  constructor(
    private readonly governanceRepository = AutomationGovernanceRepository,
    private readonly executionRepository = AutomationExecutionRepository,
    private readonly incidentService = automationIncidentService,
  ) {}

  async requestRollback(input: RollbackRequestInput) {
    if (!input.reason.trim()) {
      throw conflict("Rollback reason is required", null, "ROLLBACK_REASON_MISSING");
    }
    if (!input.snapshotReference.trim()) {
      throw conflict("Rollback snapshot reference is required", null, "ROLLBACK_SNAPSHOT_MISSING");
    }
    if (!input.scopeDescription.trim()) {
      throw conflict("Rollback scope description is required", null, "ROLLBACK_SCOPE_MISSING");
    }

    const execution = await this.executionRepository.getExecutionById(input.executionId);
    if (!execution) {
      throw conflict("Original execution not found", { executionId: input.executionId }, "EXECUTION_NOT_FOUND");
    }
    if (execution.result !== "FAILED" && execution.result !== "SUCCESS") {
      throw conflict(
        "Rollback is only allowed for FAILED or SUCCESS executions",
        { result: execution.result },
        "ROLLBACK_EXECUTION_INVALID",
      );
    }

    const rollbackWindowMs = env.AUTOMATION_ROLLBACK_WINDOW_MINUTES * 60 * 1000;
    if (Date.now() - execution.executedAt.getTime() > rollbackWindowMs) {
      throw conflict("Rollback window has expired", null, "ROLLBACK_WINDOW_EXCEEDED");
    }

    const incident = await this.incidentService.getIncidentById(input.incidentId);
    if (!incident) {
      throw conflict("Incident missing for rollback", { incidentId: input.incidentId }, "INCIDENT_REQUIRED_FOR_ROLLBACK");
    }
    if (incident.relatedExecutionId && incident.relatedExecutionId !== execution.id) {
      throw conflict(
        "Incident does not match the execution",
        { incidentId: incident.incidentId, executionId: execution.id },
        "INCIDENT_EXECUTION_MISMATCH",
      );
    }
    if (incident.status !== "OPEN") {
      throw conflict(
        "Rollback requires an OPEN incident before mitigation",
        { incidentId: incident.incidentId, status: incident.status },
        "INCIDENT_NOT_OPEN",
      );
    }

    const existingRollback = await this.governanceRepository.getRollbackByExecutionId(execution.id);
    if (existingRollback) {
      throw conflict("Rollback already recorded for execution", null, "ROLLBACK_ALREADY_EXISTS");
    }

    await this.incidentService.markMitigated(incident.incidentId, "Rollback approved");

    const rollback = await this.governanceRepository.createRollbackExecution({
      execution: { connect: { id: execution.id } },
      incident: { connect: { incidentId: incident.incidentId } },
      approvedById: input.approvedById,
      approvedAt: input.approvedAt ?? new Date(),
      reason: input.reason,
      snapshotReference: input.snapshotReference,
      scopeDescription: input.scopeDescription,
      status: "PENDING",
      requestedById: input.requestedById ?? input.approvedById,
      metadataJson: input.metadata ?? undefined,
    });

    automationRollbackTotal.inc({ stage: "started", status: "PENDING" });
    logger.info("rollback.started", {
      rollbackId: rollback.id,
      executionId: rollback.executionId,
      incidentId: rollback.incidentId,
      approvedById: rollback.approvedById,
      scopeDescription: rollback.scopeDescription,
    });

    return rollback;
  }

  async finalizeRollback(input: RollbackFinalizeInput) {
    const rollback = await this.governanceRepository.getRollbackById(input.rollbackId);
    if (!rollback) {
      throw conflict("Rollback record not found", { rollbackId: input.rollbackId }, "ROLLBACK_NOT_FOUND");
    }
    if (rollback.status !== "PENDING") {
      throw conflict(
        "Only pending rollbacks can be finalized",
        { status: rollback.status },
        "ROLLBACK_ALREADY_FINALIZED",
      );
    }

    const existingMetadata = rollback.metadataJson ?? undefined;
    const metadataJson = input.metadata ?? existingMetadata;
    const updated = await this.governanceRepository.updateRollbackExecution(rollback.id, {
      status: input.status,
      metadataJson,
      executedAt: input.executedAt ?? new Date(),
    });

    automationRollbackTotal.inc({ stage: "finalized", status: input.status });
    const logEvent = input.status === "EXECUTED" ? "rollback.completed" : "rollback.failed";
    const logLevel = input.status === "FAILED" ? "warn" : "info";
    logger[logLevel](logEvent, {
      rollbackId: updated.id,
      executionId: updated.executionId,
      incidentId: updated.incidentId,
      status: updated.status,
      notes: input.notes,
    });

    if (input.status === "EXECUTED") {
      await this.incidentService.markResolved(updated.incidentId, input.notes);
    }

    return updated;
  }
}

export const automationRollbackService = new AutomationRollbackService();
