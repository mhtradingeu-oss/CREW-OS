import { publish } from "../../core/events/event-bus.js";
import type { StandEventPayload } from "./stand.types.js";

export enum StandEvents {
  CREATED = "stand.created",
  UPDATED = "stand.updated",
  DELETED = "stand.deleted",
}

export async function emitStandCreated(payload: StandEventPayload) {
  await publish(StandEvents.CREATED, payload);
}
