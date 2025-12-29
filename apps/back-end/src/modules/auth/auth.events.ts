import { publish, type EventContext } from "../../core/events/event-bus.js";

export type AuthEventPayload = {
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
  brandId?: string;
};

export enum AuthEvents {
  SESSION_CREATED = "auth.session.created",
  SESSION_REFRESHED = "auth.session.refreshed",
  PASSWORD_RESET_REQUESTED = "auth.password.reset.requested",
}

export async function emitAuthSessionCreated(payload: AuthEventPayload, context?: EventContext) {
  await publish(AuthEvents.SESSION_CREATED, payload, { ...context, module: "auth" });
}

export async function emitAuthSessionRefreshed(payload: AuthEventPayload, context?: EventContext) {
  await publish(AuthEvents.SESSION_REFRESHED, payload, { ...context, module: "auth" });
}

export async function emitAuthPasswordResetRequested(payload: AuthEventPayload, context?: EventContext) {
  await publish(AuthEvents.PASSWORD_RESET_REQUESTED, payload, { ...context, module: "auth" });
}
