import { publish, type EventContext } from "../../core/events/event-bus.js";
import type {
  CommunicationEventPayload,
  CommunicationMessageEventPayload,
} from "./communication.types.js";

export enum CommunicationEvents {
  CREATED = "communication.created",
  UPDATED = "communication.updated",
  DELETED = "communication.deleted",
  MESSAGE_SENT = "communication.message.sent",
  MESSAGE_FAILED = "communication.message.failed",
}

export async function emitCommunicationCreated(payload: CommunicationEventPayload) {
  await publish(CommunicationEvents.CREATED, payload);
}

export async function emitCommunicationMessageSent(
  payload: CommunicationMessageEventPayload,
  context?: EventContext,
) {
  await publish(CommunicationEvents.MESSAGE_SENT, payload, context);
}

export async function emitCommunicationMessageFailed(
  payload: CommunicationMessageEventPayload,
  context?: EventContext,
) {
  await publish(CommunicationEvents.MESSAGE_FAILED, payload, context);
}
