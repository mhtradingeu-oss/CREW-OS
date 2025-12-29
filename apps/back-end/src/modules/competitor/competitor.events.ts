import { publishDomainEvent } from "../../core/events/event-bus.js";

export async function emitCompetitorPriceUpdated(payload: {
  competitorId: string;
  productId: string;
  price: number;
  currency: string;
  updatedAt: string;
  brandId?: string;
}) {
  await publishDomainEvent({ type: "competitor.price.updated", payload });
}
