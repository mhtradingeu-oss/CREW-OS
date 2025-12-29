import { publish, type EventContext } from "../../core/events/event-bus.js";

type PricingEventPayload = {
  id: string;
  productId: string;
  brandId?: string;
};

export enum PricingEvents {
  CREATED = "pricing.created",
  UPDATED = "pricing.updated",
  DELETED = "pricing.deleted",
  DRAFT_CREATED = "pricing.draft.created",
  DRAFT_PENDING_APPROVAL = "pricing.draft.pending_approval",
  DRAFT_APPROVED = "pricing.draft.approved",
  DRAFT_REJECTED = "pricing.draft.rejected",
  COMPETITOR_RECORDED = "pricing.competitor.recorded",
  LOG_RECORDED = "pricing.log.recorded",
  AI_SUGGESTED = "pricing.ai.suggested",
  AI_PLAN_GENERATED = "pricing.ai.plan.generated",
  SNAPSHOT_ACCESSED = "pricing.snapshot.accessed",
}

export async function emitPricingCreated(payload: PricingEventPayload, context?: EventContext) {
  await publish(PricingEvents.CREATED, payload, context);
}

export async function emitPricingUpdated(payload: PricingEventPayload, context?: EventContext) {
  await publish(PricingEvents.UPDATED, payload, context);
}

export async function emitPricingDeleted(payload: PricingEventPayload, context?: EventContext) {
  await publish(PricingEvents.DELETED, payload, context);
}

export async function emitPricingDraftCreated(
  payload: PricingEventPayload,
  context?: EventContext,
) {
  await publish(PricingEvents.DRAFT_CREATED, payload, context);
}

export async function emitPricingDraftPendingApproval(
  payload: PricingEventPayload,
  context?: EventContext,
) {
  await publish(PricingEvents.DRAFT_PENDING_APPROVAL, payload, context);
}

export async function emitPricingDraftApproved(
  payload: PricingEventPayload,
  context?: EventContext,
) {
  await publish(PricingEvents.DRAFT_APPROVED, payload, context);
}

export async function emitPricingDraftRejected(
  payload: PricingEventPayload,
  context?: EventContext,
) {
  await publish(PricingEvents.DRAFT_REJECTED, payload, context);
}

export async function emitCompetitorPriceRecorded(
  payload: PricingEventPayload,
  context?: EventContext,
) {
  await publish(PricingEvents.COMPETITOR_RECORDED, payload, context);
}

export async function emitPricingLogRecorded(payload: PricingEventPayload, context?: EventContext) {
  await publish(PricingEvents.LOG_RECORDED, payload, context);
}

export async function emitPricingAISuggested(payload: PricingEventPayload, context?: EventContext) {
  await publish(PricingEvents.AI_SUGGESTED, payload, context);
}

export async function emitPricingPlanGenerated(payload: PricingEventPayload, context?: EventContext) {
  await publish(PricingEvents.AI_PLAN_GENERATED, payload, context);
}

export async function emitPricingSnapshotAccessed(
  payload: PricingEventPayload,
  context?: EventContext,
) {
  await publish(PricingEvents.SNAPSHOT_ACCESSED, payload, context);
}
