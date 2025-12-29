import { publish, type EventContext } from "../../core/events/event-bus.js";
import type { AiBrainEventPayload } from "./ai-brain.types.js";

export enum AiBrainEvents {
  CREATED = "ai-brain.created",
  UPDATED = "ai-brain.updated",
  DELETED = "ai-brain.deleted",
}

export async function emitAiBrainCreated(payload: AiBrainEventPayload, context?: EventContext) {
  await publish(AiBrainEvents.CREATED, payload, context);
}

export async function emitAiBrainUpdated(payload: AiBrainEventPayload, context?: EventContext) {
  await publish(AiBrainEvents.UPDATED, payload, context);
}

export async function emitAiBrainDeleted(payload: AiBrainEventPayload, context?: EventContext) {
  await publish(AiBrainEvents.DELETED, payload, context);
}
