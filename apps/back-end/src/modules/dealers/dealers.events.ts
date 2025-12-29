import { publish, type EventContext } from "../../core/events/event-bus.js";
import type { DealersEventPayload, DealersKpiEventPayload } from "./dealers.types.js";

export enum DealersEvents {
  CREATED = "dealers.created",
  UPDATED = "dealers.updated",
  DELETED = "dealers.deleted",
  KPI_UPDATED = "dealers.kpi.updated",
}

export async function emitDealersCreated(payload: DealersEventPayload) {
  await publish(DealersEvents.CREATED, payload);
}

export async function emitDealersUpdated(payload: DealersEventPayload) {
  await publish(DealersEvents.UPDATED, payload);
}

export async function emitDealersDeleted(payload: DealersEventPayload) {
  await publish(DealersEvents.DELETED, payload);
}

export async function emitDealersKpiUpdated(
  payload: DealersKpiEventPayload,
  context?: EventContext,
) {
  await publish(DealersEvents.KPI_UPDATED, payload, context);
}
