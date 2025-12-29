import type { DomainEventHandler } from "../types.js";
import { defineDomainEvent } from "../types.js";
import { domainEventBus } from "../bus.js";

export type AuthLoginSuccessPayload = {
  userId: string;
  email: string;
  tenantId?: string | null;
  role?: string;
};


// تعريف ثابت للحدث فقط (لا يوجد .create)
export const AuthLoginSuccessDefinition = {
  type: "auth.login.success" as const,
};

import type { DomainEvent } from "../types.js";
export type AuthLoginSuccessEvent = DomainEvent<"auth.login.success">;


export function emitAuthLoginSuccess(
  payload: AuthLoginSuccessPayload,
  meta?: Record<string, unknown>,
) {
  const event: AuthLoginSuccessEvent = {
    id: crypto.randomUUID(),
    type: "auth.login.success",
    payload,
    meta,
    occurredAt: new Date(),
  };
  domainEventBus.emit(event.type, event);
  return event;
}



