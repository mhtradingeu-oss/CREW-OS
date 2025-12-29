// Re-export publishDomainEvent for API consistency
export { publishDomainEvent } from "./domain/bus.js";
import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import { logger } from "../logger.js";
// Dev-only audit utility (no prod impact)
let auditCaptureEvent: undefined | ((eventName: string) => void);
if (process.env.NODE_ENV !== "production") {
  try {
    auditCaptureEvent = require("./dev-audit/event-audit-util").auditCaptureEvent;
  } catch {}
}

export type EventContext = {
  actorUserId?: string;
  brandId?: string;
  tenantId?: string;
  role?: string;
  source?: "api" | "system" | "ai" | string;
  module?: string;
  severity?: "info" | "warning" | "critical";
  requestId?: string;
  correlationId?: string;
};

export type EventEnvelope<T = unknown> = {
  id: string;
  name: string;
  payload: T;
  context?: EventContext;
  occurredAt: Date;
};

export type EventHandler<T = unknown> = (event: EventEnvelope<T>) => Promise<void> | void;


export const bus = new EventEmitter();
const ALL_EVENTS = "*";

/**
 * EVENT_ALIASES maps canonical event names to one or more aliases for backward compatibility.
 * Only add aliases for known mismatches or legacy event names.
 * Example: "knowledgebase.document.summarized" -> ["knowledge-base.document.summarized"]
 */
export const EVENT_ALIASES: Record<string, string[]> = {
  // Add more as needed for legacy/typo/format mismatches
  "knowledgebase.document.summarized": ["knowledge-base.document.summarized"],
  // Example: "crm.lead.created": ["crm.lead.new"],
};


/**
 * Publishes an event to the bus, emitting to the original eventName, all aliases, and ALL_EVENTS.
 * Aliases are emitted with a cloned envelope (name === alias), but never recursively.
 * Guards ensure no duplicate or recursive emission.
 */
export async function publish<T = unknown>(
  eventName: string,
  payload: T,
  context?: EventContext
): Promise<void> {
  // Correlation ID propagation
  let correlationId = context?.correlationId || context?.requestId;
  if (!correlationId && typeof global !== 'undefined' && (global as any).req?.context?.correlationId) {
    correlationId = (global as any).req.context.correlationId;
  }
  if (!correlationId) {
    correlationId = randomUUID();
  }
  const moduleVal = context?.module ?? eventName.split(".")[0];
  const envelope: EventEnvelope<T> = {
    id: randomUUID(),
    name: eventName,
    payload,
    context: { ...context, module: moduleVal, correlationId, requestId: context?.requestId || correlationId },
    occurredAt: new Date(),
  };

  logger.info("event.emitted", {
    eventName: envelope.name,
    correlationId,
    module: moduleVal,
  });

  // Emit to the original event name
  bus.emit(eventName, envelope);
  if (auditCaptureEvent) auditCaptureEvent(eventName);

  // Emit to aliases, if any, with cloned envelope (name === alias)
  const aliases = EVENT_ALIASES[eventName] || [];

  for (const alias of aliases) {
    // Guard: skip if alias is same as original
    if (alias === eventName) continue;
    // Guard: prevent recursion/duplication
    // Only emit if alias is not ALL_EVENTS and not original
    if (alias && alias !== ALL_EVENTS) {
      const aliasEnvelope: EventEnvelope<T> = {
        ...envelope,
        name: alias,
      };
      bus.emit(alias, aliasEnvelope);
      if (auditCaptureEvent) auditCaptureEvent(alias);
    }
  }

  // Always emit ALL_EVENTS with the original envelope (name === original)
  bus.emit(ALL_EVENTS, envelope);
}
  

// Alias for compatibility with executor usage
export function emitEvent(event: string, payload: any, context?: EventContext) {
  return publish(event, payload, context);
}

export function subscribe<T = unknown>(
  eventName: string | typeof ALL_EVENTS,
  handler: EventHandler<T>,
): void {
  bus.on(eventName, async (event: EventEnvelope<T>) => {
    const correlationId = event.context?.correlationId || event.context?.requestId;
    const handlerName = handler.name || undefined;
    logger.info("event.handled.start", {
      eventName: event.name,
      correlationId,
      handler: handlerName,
    });
    try {
      await handler(event);
      logger.info("event.handled.success", {
        eventName: event.name,
        correlationId,
        handler: handlerName,
      });
    } catch (err) {
      logger.error("event.handled.error", {
        eventName: event.name,
        correlationId,
        handler: handlerName,
        meta: err,
      });
    }
  });
}

export function subscribeToAll(handler: EventHandler): void {
  subscribe(ALL_EVENTS, handler);
}
