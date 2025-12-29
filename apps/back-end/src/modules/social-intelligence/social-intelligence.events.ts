import { publish } from "../../core/events/event-bus.js";
import type { SocialIntelligenceEventPayload } from "./social-intelligence.types.js";

export enum SocialIntelligenceEvents {
  CREATED = "social-intelligence.created",
  UPDATED = "social-intelligence.updated",
  DELETED = "social-intelligence.deleted",
  MENTION_INGESTED = "social.mention.ingested",
  MENTION_SPIKE = "social.mention.spike",
  BRAND_SPIKE = "social.brand.spike",
  TREND_DETECTED = "social.trend.detected",
  TREND_UPDATED = "social.trend.updated",
  INSIGHT_GENERATED = "social.insight.generated",
}

export async function emitSocialIntelligenceCreated(payload: SocialIntelligenceEventPayload) {
  await publish(SocialIntelligenceEvents.CREATED, payload);
}

export async function emitMentionIngested(payload: SocialIntelligenceEventPayload) {
  await publish(SocialIntelligenceEvents.MENTION_INGESTED, payload);
}

export async function emitMentionSpike(payload: SocialIntelligenceEventPayload) {
  await publish(SocialIntelligenceEvents.MENTION_SPIKE, payload);
}

export async function emitBrandSpike(payload: SocialIntelligenceEventPayload) {
  await publish(SocialIntelligenceEvents.BRAND_SPIKE, payload);
}

export async function emitTrendDetected(payload: SocialIntelligenceEventPayload) {
  await publish(SocialIntelligenceEvents.TREND_DETECTED, payload);
}

export async function emitTrendUpdated(payload: SocialIntelligenceEventPayload) {
  await publish(SocialIntelligenceEvents.TREND_UPDATED, payload);
}

export async function emitSocialInsightGenerated(payload: SocialIntelligenceEventPayload) {
  await publish(SocialIntelligenceEvents.INSIGHT_GENERATED, payload);
}
