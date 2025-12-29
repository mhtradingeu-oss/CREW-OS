import { publish } from "../../core/events/event-bus.js";
import type { AdminEventPayload } from "./admin.types.js";

export enum AdminEvents {
  CREATED = "admin.created",
  UPDATED = "admin.updated",
  DELETED = "admin.deleted",
}

export async function emitAdminCreated(payload: AdminEventPayload) {
  await publish(AdminEvents.CREATED, payload);
}
