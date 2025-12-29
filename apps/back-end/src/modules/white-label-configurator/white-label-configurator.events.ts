import { publishDomainEvent } from "../../core/events/event-bus.js";

export async function emitWhiteLabelConfigCreated(payload: {
  configId: string;
  brandId?: string;
  productId?: string;
  createdAt: string;
}) {
  await publishDomainEvent({ type: "white-label.config.created", payload });
}
