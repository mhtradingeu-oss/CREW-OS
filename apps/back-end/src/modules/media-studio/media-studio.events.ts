import { publishDomainEvent } from "../../core/events/event-bus.js";

export async function emitMediaGenerated(payload: {
  requestId: string;
  brandId?: string;
  productId?: string;
  state: string;
  generatedAt: string;
}) {
  await publishDomainEvent({ type: "media.generated", payload });
}
