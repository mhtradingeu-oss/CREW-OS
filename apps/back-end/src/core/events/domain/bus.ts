import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import type {
  DomainEvent,
  DomainEventHandler,
  DomainEventName,
  DomainEventPublishPayload,
} from "./types.js";


export const domainEventBus = new EventEmitter();
const ALL_DOMAIN_EVENTS = Symbol("ALL_DOMAIN_EVENTS");


function createDomainEvent<T extends DomainEventName>(payload: DomainEventPublishPayload<T>): DomainEvent<T> {
  const { id, occurredAt, ...rest } = payload;
  return {
    id: id ?? randomUUID(),
    occurredAt: occurredAt ?? new Date(),
    ...rest,
  } as DomainEvent<T>;
}

export function publishDomainEvent<T extends DomainEventName>(payload: DomainEventPublishPayload<T>): DomainEvent<T> {
  const event = createDomainEvent(payload);
  domainEventBus.emit(event.type, event);
  domainEventBus.emit(ALL_DOMAIN_EVENTS, event);
  return event;
}

export function subscribeToDomainEvent<T extends DomainEventName>(
  eventName: T,
  handler: DomainEventHandler<T>,
): void {
  domainEventBus.on(eventName, (event: DomainEvent<T>) => {
    void handler(event);
  });
}

export function subscribeToAllDomainEvents(handler: DomainEventHandler<DomainEventName>): void {
  domainEventBus.on(ALL_DOMAIN_EVENTS, (event: DomainEvent) => {
    void handler(event);
  });
}
