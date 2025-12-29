export enum AffiliateRewardEvents {
  REWARD_ISSUED = "affiliate.reward.issued",
}

export async function emitAffiliateRewardIssued(payload: AffiliateEventPayload, context?: EventContext) {
  await publish(AffiliateRewardEvents.REWARD_ISSUED, payload, context);
}
import { publish, type EventContext } from "../../core/events/event-bus.js";
import type {
  AffiliateEventPayload,
  AffiliateConversionEventPayload,
  AffiliatePayoutStatusEventPayload,
} from "./affiliate.types.js";

export enum AffiliateEvents {
  CREATED = "affiliate.created",
  UPDATED = "affiliate.updated",
  DELETED = "affiliate.deleted",
  CONVERSION_CREATED = "affiliate.conversion.created",
  PAYOUT_REQUESTED = "affiliate.payout.requested",
  PAYOUT_APPROVED = "affiliate.payout.approved",
  PAYOUT_REJECTED = "affiliate.payout.rejected",
  PAYOUT_PAID = "affiliate.payout.paid",
}

export async function emitAffiliateCreated(payload: AffiliateEventPayload) {
  await publish(AffiliateEvents.CREATED, payload);
}

export async function emitAffiliateConversionCreated(
  payload: AffiliateConversionEventPayload,
  context?: EventContext,
) {
  await publish(AffiliateEvents.CONVERSION_CREATED, payload, context);
}

export async function emitAffiliatePayoutRequested(
  payload: AffiliatePayoutStatusEventPayload,
  context?: EventContext,
) {
  await publish(AffiliateEvents.PAYOUT_REQUESTED, payload, context);
}

export async function emitAffiliatePayoutApproved(
  payload: AffiliatePayoutStatusEventPayload,
  context?: EventContext,
) {
  await publish(AffiliateEvents.PAYOUT_APPROVED, payload, context);
}

export async function emitAffiliatePayoutRejected(
  payload: AffiliatePayoutStatusEventPayload,
  context?: EventContext,
) {
  await publish(AffiliateEvents.PAYOUT_REJECTED, payload, context);
}

export async function emitAffiliatePayoutPaid(
  payload: AffiliatePayoutStatusEventPayload,
  context?: EventContext,
) {
  await publish(AffiliateEvents.PAYOUT_PAID, payload, context);
}
