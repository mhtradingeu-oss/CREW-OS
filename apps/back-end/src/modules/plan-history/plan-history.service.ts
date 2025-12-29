import { unauthorized } from "../../core/http/errors.js";
import { PlanHistoryRepository } from "../../core/db/repositories/plan-history.repository.js";
import { publish } from "../../core/events/event-bus.js";

/**
 * List plan history for a tenant/user with RBAC enforcement
 */
async function listPlanHistory(userId: string) {
  return PlanHistoryRepository.listPlanHistory(userId, unauthorized);
}

/**
 * Persist an immutable plan change and emit plan.history.recorded
 */
async function recordPlanChange({
  tenantId,
  fromPlanId,
  toPlanId,
  changedByUserId,
  metadata,
}: {
  tenantId: string;
  fromPlanId?: string;
  toPlanId: string;
  changedByUserId: string;
  metadata?: Record<string, unknown>;
}) {
  // Persist via repository (single source of truth)
  const planChange = await PlanHistoryRepository.recordPlanChange({
    tenantId,
    fromPlanId,
    toPlanId,
    changedByUserId,
    metadata,
  });

  // Emit domain event (after successful persistence)
  await publish("plan.history.recorded", {
    planChangeId: planChange.id,
    tenantId,
    fromPlanId,
    toPlanId,
    changedByUserId,
    metadata,
    timestamp: planChange.createdAt,
  });

  return {
    status: "recorded",
    planChangeId: planChange.id,
  };
}

export const planHistoryService = {
  listPlanHistory,
  recordPlanChange,
};
