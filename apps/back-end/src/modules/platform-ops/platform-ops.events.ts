import { publish, type EventContext } from "../../core/events/event-bus.js";

export enum PlatformOpsEvents {
  RBAC_USER_ROLE_ASSIGNED = "rbac.user.role.assigned",
  RBAC_USER_ROLE_REMOVED = "rbac.user.role.removed",
}

export type RoleChangeEventPayload = {
  actorUserId?: string;
  targetUserId: string;
  roleId?: string;
  roleName: string;
  brandId?: string | null;
  tenantId?: string | null;
};

export async function emitUserRoleAssigned(payload: RoleChangeEventPayload) {
  await publish(PlatformOpsEvents.RBAC_USER_ROLE_ASSIGNED, payload, buildContext(payload));
}

export async function emitUserRoleRemoved(payload: RoleChangeEventPayload) {
  await publish(PlatformOpsEvents.RBAC_USER_ROLE_REMOVED, payload, buildContext(payload));
}

function buildContext(payload: RoleChangeEventPayload): EventContext {
  return {
    actorUserId: payload.actorUserId,
    brandId: payload.brandId ?? undefined,
    module: "rbac",
    source: "api",
  };
}
