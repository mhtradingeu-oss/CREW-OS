import { publish, type EventContext } from "../events/event-bus.js";

export type ActivityPayload = {
  action: string;
  module: string;
  actorId?: string;
  actorRole?: string;
  tenantId?: string;
  brandId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
};

export async function publishActivity(
  module: string,
  action: string,
  payload: Omit<ActivityPayload, "action" | "module"> = {},
  context?: EventContext,
) {
  const activityPayload: ActivityPayload = {
    action,
    module,
    actorId: context?.actorUserId ?? payload.actorId,
    actorRole: context?.role ?? payload.actorRole,
    tenantId: context?.tenantId ?? payload.tenantId,
    brandId: context?.brandId ?? payload.brandId,
    ...payload,
    createdAt: payload.createdAt ?? new Date(),
  };
  await publish(`activity.${module}.${action}`, activityPayload, { ...context, module });
}
