import { publish } from "../../core/events/event-bus.js";
import type { OperationsEventPayload } from "./operations.types.js";

export enum OperationsEvents {
  CREATED = "operations.created",
  UPDATED = "operations.updated",
  DELETED = "operations.deleted",
}

export async function emitOperationsCreated(payload: OperationsEventPayload) {
  await publish(OperationsEvents.CREATED, payload);
}
