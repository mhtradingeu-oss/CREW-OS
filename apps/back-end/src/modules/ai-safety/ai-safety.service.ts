import * as aiMonitoringRepo from "../../core/db/repositories/ai-monitoring.repository.js";
import { publish } from "../../core/events/event-bus.js";
import { forbidden } from "../../core/http/errors.js";

/**
 * Persist an AI safety incident and link to AI output/request.
 * Only callable by admin (RBAC enforced at route/controller).
 * Emits ai.safety.incident.recorded and ai.safety.action.taken events.
 * No AI execution occurs here.
 * Human override path is supported via actionType: 'OVERRIDE'.
 */
export async function recordAISafetyIncident({
  runId,
  agentName,
  namespace,
  outputPreview,
  incidentType,
  description,
  actionType,
  actionTaken,
  userId,
  brandId,
  tenantId,
  riskLevel = "HIGH",
  detail = {},
}: {
  runId: string;
  agentName?: string;
  namespace?: string;
  outputPreview?: string;
  incidentType: string;
  description: string;
  actionType: "BLOCK" | "WARN" | "OVERRIDE" | string;
  actionTaken?: string;
  userId: string;
  brandId?: string;
  tenantId?: string;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  detail?: Record<string, unknown>;
}) {
  // Persist incident
  const incident = await aiMonitoringRepo.createSafetyEvent({
    type: incidentType as import("@prisma/client").AISafetyEventType,
    action: actionType,
    runId,
    agentName,
    namespace,
    riskLevel,
    decision: actionTaken,
    detail: {
      ...detail,
      description,
      outputPreview,
      userId,
    },
    brandId: brandId ?? undefined,
    tenantId,
  });

  // Emit incident recorded event
  await publish("ai.safety.incident.recorded", {
    incidentId: incident.id,
    runId,
    agentName,
    namespace,
    incidentType,
    actionType,
    actionTaken,
    userId,
    brandId,
    tenantId,
    riskLevel,
    description,
    outputPreview,
    detail,
  });

  // If human override, emit action taken event
  if (actionType === "OVERRIDE") {
    await publish("ai.safety.action.taken", {
      incidentId: incident.id,
      runId,
      agentName,
      namespace,
      actionType,
      actionTaken,
      userId,
      brandId,
      tenantId,
      riskLevel,
      description,
      outputPreview,
      detail,
    });
  }

  return { status: "recorded", incidentId: incident.id };
}
import * as aiSafetyRepository from "../../core/db/repositories/ai-safety.repository.js";
import { recordSafetyEvent } from "../../core/ai/ai-monitoring.js";

export async function listFirewallRules() {
  return aiSafetyRepository.listFirewallRules();
}

export async function createFirewallRule(payload: aiSafetyRepository.FirewallRulePayload) {
  return aiSafetyRepository.createFirewallRule(payload);
}

export async function listConstraints() {
  return aiSafetyRepository.listConstraints();
}

export async function createConstraint(payload: aiSafetyRepository.SafetyConstraintPayload) {
  return aiSafetyRepository.createConstraint(payload);
}

export async function listBannedActions() {
  return aiSafetyRepository.listBannedActions();
}

export async function createBannedAction(payload: aiSafetyRepository.BannedActionPayload) {
  return aiSafetyRepository.createBannedAction(payload);
}

export async function recordOversight(payload: {
  runId?: string;
  agentName?: string;
  namespace?: string;
  decision: string;
  notes?: string;
  riskLevel?: string;
}) {
  await recordSafetyEvent({
    type: "OVERSIGHT",
    action: payload.decision,
    runId: payload.runId,
    agentName: payload.agentName,
    namespace: payload.namespace,
    decision: payload.decision,
    riskLevel: (payload.riskLevel ?? "MEDIUM") as any,
    detail: { notes: payload.notes },
  });
  return { status: "recorded" };
}

export async function recordRedTeamFinding(payload: {
  runId?: string;
  scenario: string;
  outcome?: string;
  severity?: string;
}) {
  await recordSafetyEvent({
    type: "RED_TEAM",
    action: payload.scenario,
    runId: payload.runId,
    decision: payload.outcome ?? "recorded",
    riskLevel: (payload.severity ?? "HIGH") as any,
    detail: { scenario: payload.scenario, outcome: payload.outcome },
  });
  return { status: "recorded" };
}

export async function testPrompt(payload: { prompt: string; mode?: string; context?: Record<string, unknown> }) {
  return {
    status: "ok",
    prompt: payload.prompt,
    mode: payload.mode ?? "safety-check",
    context: payload.context,
  };
}
