import { publish } from "../../core/events/event-bus.js";

export enum AutomationEvents {
  CREATED = "automation.created",
  UPDATED = "automation.updated",
  DELETED = "automation.deleted",
}

/**
 * Publish automation created event
 */
export async function publishAutomationCreated(payload: unknown) {
  await publish(AutomationEvents.CREATED, payload);
}

/**
 * Publish automation updated event
 */
export async function publishAutomationUpdated(payload: unknown) {
  await publish(AutomationEvents.UPDATED, payload);
}

/**
 * Publish automation deleted event
 */
export async function publishAutomationDeleted(payload: unknown) {
  await publish(AutomationEvents.DELETED, payload);
}
