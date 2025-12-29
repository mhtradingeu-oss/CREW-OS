import { subscribe } from "./event-bus.js";
import { publishActivity } from "../activity/activity.js";
import { PricingEvents } from "../../modules/pricing/pricing.events.js";
import { InventoryEvents } from "../../modules/inventory/inventory.events.js";
import { CrmLeadEvents } from "../../modules/crm/crm.events.js";
import { MarketingEvents } from "../../modules/marketing/marketing.events.js";
import { AuthEvents } from "../../modules/auth/auth.events.js";
import { SalesRepsEvents } from "../../modules/sales-reps/sales-reps.events.js";
import { StandPosEvents } from "../../modules/stand-pos/stand-pos.events.js";
import { BrandEvents } from "../../modules/brand/brand.events.js";
import { SecurityGovernanceEvents } from "../../modules/security-governance/security-governance.events.js";
import { PartnersEvents } from "../../modules/partners/partners.events.js";
import { registerAiSuggestionApprovedConsumer } from "./consumers/ai-suggestion-approved.consumer.js";

type PayloadWithBrandTenant = { brandId?: string | null; tenantId?: string | null; id?: string }; // minimal shape guard

function toActivityAction(eventName: string) {
  const parts = eventName.split(".");
  return parts.length > 1 ? parts.slice(1).join("_") : eventName;
}

function handleActivity(module: string) {
  return async (payload: unknown, eventName?: string) => {
    const scoped = (payload ?? {}) as PayloadWithBrandTenant;
    await publishActivity(
      module,
      toActivityAction(eventName ?? module),
      {
        entityType: module,
        entityId: scoped.id,
        metadata: payload as Record<string, unknown>,
      },
      { brandId: scoped.brandId ?? undefined, tenantId: scoped.tenantId ?? undefined },
    );
  };
}

export function registerDomainEventSubscribers() {
  registerAiSuggestionApprovedConsumer();

  const mappings: Array<[string, () => Promise<void>]> = [];

  Object.values(PricingEvents).forEach((eventName) => {
    subscribe(eventName, (payload) => handleActivity("pricing")(payload, eventName));
  });
  Object.values(InventoryEvents).forEach((eventName) => {
    subscribe(eventName, (payload) => handleActivity("inventory")(payload, eventName));
  });
  Object.values(CrmLeadEvents).forEach((eventName) => {
    subscribe(eventName, (payload) => handleActivity("crm")(payload, eventName));
  });
  Object.values(MarketingEvents).forEach((eventName) => {
    subscribe(eventName, (payload) => handleActivity("marketing")(payload, eventName));
  });
  Object.values(AuthEvents).forEach((eventName) => {
    subscribe(eventName, (payload) => handleActivity("auth")(payload, eventName));
  });
  Object.values(SalesRepsEvents).forEach((eventName) => {
    subscribe(eventName, (payload) => handleActivity("sales-reps")(payload, eventName));
  });
  Object.values(StandPosEvents).forEach((eventName) => {
    subscribe(eventName, (payload) => handleActivity("stand-pos")(payload, eventName));
  });

  Object.values(BrandEvents).forEach((eventName) => {
    subscribe(eventName, (payload) => handleActivity("brand")(payload, eventName));
  });

  Object.values(SecurityGovernanceEvents).forEach((eventName) => {
    subscribe(eventName, (payload) => handleActivity("security")(payload, eventName));
  });

  Object.values(PartnersEvents).forEach((eventName) => {
    subscribe(eventName, (payload) => handleActivity("partners")(payload, eventName));
  });

  // mappings placeholder ensures we can extend without unused variable lint issues.
  void mappings;
}
