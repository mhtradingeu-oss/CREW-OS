import { publish, type EventContext } from "../../core/events/event-bus.js";
import type {
  LoyaltyEventPayload,
  LoyaltyRewardRedeemedPayload,
  LoyaltyTierChangedPayload,
} from "./loyalty.types.js";

export enum LoyaltyEvents {
  CREATED = "loyalty.created",
  UPDATED = "loyalty.updated",
  DELETED = "loyalty.deleted",
  TIER_CHANGED = "loyalty.tier.changed",
  REWARD_REDEEMED = "loyalty.reward.redeemed",
}

export async function emitLoyaltyCreated(payload: LoyaltyEventPayload, context?: EventContext) {
  await publish(LoyaltyEvents.CREATED, payload, context);
}

export async function emitLoyaltyUpdated(payload: LoyaltyEventPayload, context?: EventContext) {
  await publish(LoyaltyEvents.UPDATED, payload, context);
}

export async function emitLoyaltyDeleted(payload: LoyaltyEventPayload, context?: EventContext) {
  await publish(LoyaltyEvents.DELETED, payload, context);
}

export async function emitLoyaltyTierChanged(
  payload: LoyaltyTierChangedPayload,
  context?: EventContext,
) {
  await publish(LoyaltyEvents.TIER_CHANGED, payload, context);
}

export async function emitLoyaltyRewardRedeemed(
  payload: LoyaltyRewardRedeemedPayload,
  context?: EventContext,
) {
  await publish(LoyaltyEvents.REWARD_REDEEMED, payload, context);
}
