import { publishDomainEvent } from "../../core/events/event-bus.js";

export async function emitInfluencerScored(payload: {
  influencerId: string;
  brandId: string;
  score: number;
  marketFitScore?: number;
  authenticityScore?: number;
  scoredAt: string;
}) {
  await publishDomainEvent({ type: "influencer.scored", payload });
}
