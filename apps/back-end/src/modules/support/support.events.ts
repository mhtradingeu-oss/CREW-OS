import { publish } from "../../core/events/event-bus.js";
import type { SupportEventPayload } from "./support.types.js";

export enum SupportEvents {
  CREATED = "support.created",
  UPDATED = "support.updated",
  DELETED = "support.deleted",
}

export async function emitSupportCreated(payload: SupportEventPayload) {
  await publish(SupportEvents.CREATED, payload);
}
