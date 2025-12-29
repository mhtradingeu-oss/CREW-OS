import { publish, type EventContext } from "../../core/events/event-bus.js";
import type {
  WhiteLabelEventPayload,
  WhiteLabelOrderEventPayload,
  WhiteLabelPricingSyncEventPayload,
} from "./white-label.types.js";

export enum WhiteLabelEvents {
  CREATED = "white-label.created",
  UPDATED = "white-label.updated",
  DELETED = "white-label.deleted",
  ORDER_CREATED = "whitelabel.order.created",
  ORDER_STATUS_CHANGED = "whitelabel.order.status.changed",
  PRICING_SYNC_REQUESTED = "whitelabel.pricing.sync.requested",
}

export async function emitWhiteLabelCreated(payload: WhiteLabelEventPayload) {
  await publish(WhiteLabelEvents.CREATED, payload);
}

export async function emitWhiteLabelOrderCreated(
  payload: WhiteLabelOrderEventPayload,
  context?: EventContext,
) {
  await publish(WhiteLabelEvents.ORDER_CREATED, payload, context);
}

export async function emitWhiteLabelOrderStatusChanged(
  payload: WhiteLabelOrderEventPayload,
  context?: EventContext,
) {
  await publish(WhiteLabelEvents.ORDER_STATUS_CHANGED, payload, context);
}

export async function emitWhiteLabelPricingSyncRequested(
  payload: WhiteLabelPricingSyncEventPayload,
  context?: EventContext,
) {
  await publish(WhiteLabelEvents.PRICING_SYNC_REQUESTED, payload, context);
}
