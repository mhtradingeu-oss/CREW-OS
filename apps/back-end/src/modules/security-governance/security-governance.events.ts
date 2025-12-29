import { publish, type EventContext } from "../../core/events/event-bus.js";
import type { SecurityGovernanceEventPayload } from "./security-governance.types.js";

export enum SecurityGovernanceEvents {
  POLICY_CREATED = "security.policy.created",
  POLICY_UPDATED = "security.policy.updated",
  POLICY_DELETED = "security.policy.deleted",
  ROLE_ASSIGNED = "security.role.assigned",
  ROLE_REVOKED = "security.role.revoked",
  AI_RESTRICTION_UPDATED = "ai.restriction.updated",
}

export async function emitPolicyCreated(payload: SecurityGovernanceEventPayload) {
  await publish(SecurityGovernanceEvents.POLICY_CREATED, payload, buildContext(payload));
}

export async function emitPolicyUpdated(payload: SecurityGovernanceEventPayload) {
  await publish(SecurityGovernanceEvents.POLICY_UPDATED, payload, buildContext(payload));
}

export async function emitPolicyDeleted(payload: SecurityGovernanceEventPayload) {
  await publish(SecurityGovernanceEvents.POLICY_DELETED, payload, buildContext(payload));
}

export async function emitRoleAssigned(payload: { userId: string; role: string; actorUserId?: string }) {
  await publish(
    SecurityGovernanceEvents.ROLE_ASSIGNED,
    payload,
    { actorUserId: payload.actorUserId, module: "security", source: "api" },
  );
}

export async function emitRoleRevoked(payload: { userId: string; role: string; actorUserId?: string }) {
  await publish(
    SecurityGovernanceEvents.ROLE_REVOKED,
    payload,
    { actorUserId: payload.actorUserId, module: "security", source: "api" },
  );
}

export async function emitAiRestrictionUpdated(payload: { id: string; name: string; actorUserId?: string }) {
  await publish(
    SecurityGovernanceEvents.AI_RESTRICTION_UPDATED,
    payload,
    { actorUserId: payload.actorUserId, module: "security", source: "api" },
  );
}

function buildContext(payload: SecurityGovernanceEventPayload): EventContext {
  return {
    actorUserId: payload.actorUserId,
    brandId: payload.brandId ?? undefined,
    module: "security",
    source: "api",
  };
}
