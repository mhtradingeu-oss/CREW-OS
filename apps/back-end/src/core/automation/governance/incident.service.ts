import { AutomationDetectionSource } from "@prisma/client";
import { conflict } from "../../http/errors.js";
import { logger } from "../../logger.js";
import type { Prisma, AutomationIncidentType, AutomationIncidentSeverity } from "@prisma/client";
import { AutomationGovernanceRepository } from "../../db/repositories/automation-governance.repository.js";
import { automationIncidentTotal } from "./metrics.js";

export type IncidentDetectionInput = {
  incidentType: AutomationIncidentType;
  severity: AutomationIncidentSeverity;
  relatedExecutionId?: string;
  relatedApprovalDecisionId?: string;
  detectedBy?: AutomationDetectionSource;
  detectedById?: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
};

export class AutomationIncidentService {
  constructor(private readonly repository = AutomationGovernanceRepository) {}

  async createIncident(input: IncidentDetectionInput) {
    const incident = await this.repository.createIncident({
      type: input.incidentType,
      severity: input.severity,
      status: "OPEN",
      description: input.description ?? undefined,
      detectedBy: input.detectedBy ?? AutomationDetectionSource.SYSTEM,
      detectedById: input.detectedById ?? undefined,
      relatedExecution: input.relatedExecutionId
        ? { connect: { id: input.relatedExecutionId } }
        : undefined,
      relatedApprovalDecision: input.relatedApprovalDecisionId
        ? { connect: { id: input.relatedApprovalDecisionId } }
        : undefined,
      mitigationNotesJson: undefined,
      resolutionNotesJson: undefined,
      metadataJson: input.metadata ?? undefined,
    });

    automationIncidentTotal.inc({
      type: incident.type,
      severity: incident.severity,
      status: incident.status,
    });

    logger.info("incident.created", {
      incidentId: incident.incidentId,
      type: incident.type,
      severity: incident.severity,
      relatedExecutionId: incident.relatedExecutionId,
      relatedApprovalDecisionId: incident.relatedApprovalDecisionId,
      detectedBy: incident.detectedBy,
    });

    return incident;
  }

  async getIncidentById(incidentId: string) {
    return this.repository.getIncidentById(incidentId);
  }

  async markMitigated(incidentId: string, notes?: string) {
    const incident = await this.repository.getIncidentById(incidentId);
    if (!incident) {
      throw conflict("Incident not found", { incidentId }, "INCIDENT_NOT_FOUND");
    }
    if (incident.status !== "OPEN") {
      throw conflict("Only OPEN incidents can be marked mitigated", { status: incident.status }, "INCIDENT_STATUS_INVALID");
    }
    const updated = await this.repository.updateIncident(incidentId, {
      status: "MITIGATED",
      mitigatedAt: new Date(),
      mitigationNotesJson: notes ? { notes } : undefined,
    });
    logger.info("incident.mitigated", {
      incidentId,
      notes,
    });
    return updated;
  }

  async markResolved(incidentId: string, notes?: string) {
    const incident = await this.repository.getIncidentById(incidentId);
    if (!incident) {
      throw conflict("Incident not found", { incidentId }, "INCIDENT_NOT_FOUND");
    }
    if (incident.status !== "MITIGATED") {
      throw conflict("Only MITIGATED incidents can be resolved", { status: incident.status }, "INCIDENT_STATUS_INVALID");
    }
    const updated = await this.repository.updateIncident(incidentId, {
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolutionNotesJson: notes ? { notes } : undefined,
    });
    logger.info("incident.resolved", {
      incidentId,
      notes,
    });
    return updated;
  }
}

export const automationIncidentService = new AutomationIncidentService();
