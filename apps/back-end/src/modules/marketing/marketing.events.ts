import { publish, type EventContext } from "../../core/events/event-bus.js";
import type {
  CampaignAttributionEventPayload,
  CampaignInteractionEventPayload,
  MarketingCampaignEventPayload,
} from "./marketing.types.js";

export enum MarketingEvents {
  CREATED = "marketing.campaign.created",
  UPDATED = "marketing.campaign.updated",
  DELETED = "marketing.campaign.deleted",
  STARTED = "marketing.campaign.started",
  STOPPED = "marketing.campaign.stopped",
  ATTRIBUTION_CREATED = "marketing.campaign.attribution.created",
  INTERACTION_LOGGED = "marketing.campaign.interaction.logged",
}

export async function emitMarketingCreated(
  payload: MarketingCampaignEventPayload,
  context?: EventContext,
) {
  await publish(MarketingEvents.CREATED, payload, context);
}

export async function emitMarketingUpdated(
  payload: MarketingCampaignEventPayload,
  context?: EventContext,
) {
  await publish(MarketingEvents.UPDATED, payload, context);
}

export async function emitMarketingDeleted(
  payload: MarketingCampaignEventPayload,
  context?: EventContext,
) {
  await publish(MarketingEvents.DELETED, payload, context);
}

export async function emitMarketingCampaignStarted(
  payload: MarketingCampaignEventPayload,
  context?: EventContext,
) {
  await publish(MarketingEvents.STARTED, payload, context);
}

export async function emitMarketingCampaignStopped(
  payload: MarketingCampaignEventPayload,
  context?: EventContext,
) {
  await publish(MarketingEvents.STOPPED, payload, context);
}

export async function emitMarketingCampaignAttribution(
  payload: CampaignAttributionEventPayload,
  context?: EventContext,
) {
  await publish(MarketingEvents.ATTRIBUTION_CREATED, payload, context);
}

export async function emitMarketingCampaignInteractionLogged(
  payload: CampaignInteractionEventPayload,
  context?: EventContext,
) {
  await publish(MarketingEvents.INTERACTION_LOGGED, payload, context);
}
