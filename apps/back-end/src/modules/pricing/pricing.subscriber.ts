import { subscribe } from "../../core/events/event-bus.js";
import { PricingEvents } from "./pricing.events.js";

let registered = false;

export function registerPricingAutomationSubscriber() {
  if (registered) return;

  const logEvent = (eventName: string) => async (payload: unknown) => {
    console.info(`[pricing:auto] ${eventName}`, payload);
  };

  subscribe(PricingEvents.DRAFT_APPROVED, logEvent(PricingEvents.DRAFT_APPROVED));
  subscribe(PricingEvents.COMPETITOR_RECORDED, logEvent(PricingEvents.COMPETITOR_RECORDED));
  subscribe(PricingEvents.AI_PLAN_GENERATED, logEvent(PricingEvents.AI_PLAN_GENERATED));

  registered = true;
}
