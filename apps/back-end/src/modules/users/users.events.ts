import { publish, type EventContext } from "../../core/events/event-bus.js";

export enum UserEvents {
  CREATED = "user.created",
  UPDATED = "user.updated",
  DELETED = "user.deleted",
}

export async function emitUserCreated(
  payload: { id: string; email: string },
  context?: EventContext,
) {
  await publish(UserEvents.CREATED, payload, context);
}

export async function emitUserUpdated(
  payload: { id: string; email: string },
  context?: EventContext,
) {
  await publish(UserEvents.UPDATED, payload, context);
}

export async function emitUserDeleted(
  payload: { id: string; email: string },
  context?: EventContext,
) {
  await publish(UserEvents.DELETED, payload, context);
}
