import { publish } from "../../core/events/event-bus.js";
import type { NotificationCreatedEventPayload, NotificationReadEventPayload } from "./notification.types.js";

export enum NotificationEvents {
  CREATED = "notification.created",
  READ = "notification.read",
}

export async function emitNotificationCreated(payload: NotificationCreatedEventPayload) {
  await publish(NotificationEvents.CREATED, payload);
}

export async function emitNotificationRead(payload: NotificationReadEventPayload) {
  await publish(NotificationEvents.READ, payload);
}
