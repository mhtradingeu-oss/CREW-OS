import { subscribe } from "../core/events/event-bus.js";
import { registerDomainEventSubscribers } from "../core/events/domain-subscribers.js";
import { logger } from "../core/logger.js";

// ─────────────────────────────────────────────
// Module subscribers (composition root ONLY)
// ─────────────────────────────────────────────
import { registerActivityLogSubscriber } from "../modules/activity-log/activity-log.subscriber.js";
import { registerAutomationEventHandlers } from "../modules/automation/automation.subscriber.js";
import { registerAutomationEngineSubscriber } from "../core/automation/engine/subscriber.js";
import { registerNotificationSubscribers } from "../modules/notification/notification.subscriber.js";
import { registerPricingAutomationSubscriber } from "../modules/pricing/pricing.subscriber.js";

// ─────────────────────────────────────────────
// Event enums (used ONLY for guard registration)
// ─────────────────────────────────────────────
import { PricingEvents } from "../modules/pricing/pricing.events.js";
import { AuthEvents } from "../modules/auth/auth.events.js";
import { InventoryEvents } from "../modules/inventory/inventory.events.js";
import { CrmLeadEvents } from "../modules/crm/crm.events.js";
import { MarketingEvents } from "../modules/marketing/marketing.events.js";
import { BrandEvents } from "../modules/brand/brand.events.js";
import { SecurityGovernanceEvents } from "../modules/security-governance/security-governance.events.js";

// ─────────────────────────────────────────────
// Internal state
// ─────────────────────────────────────────────
let initialized = false;
let domainGuardsRegistered = false;

// ─────────────────────────────────────────────
// Domain guards (payload presence checks)
// ─────────────────────────────────────────────
function registerDomainEventGuards() {
  if (domainGuardsRegistered) return;

  const ensurePayload =
    (eventName: string) =>
    (event: unknown): void => {
      const payload = (event as { payload?: unknown })?.payload;
      if (!payload) {
        logger.warn(`[events] Missing payload for ${eventName}`);
      }
    };

  [
    PricingEvents.CREATED,
    PricingEvents.UPDATED,
    PricingEvents.DELETED,
    PricingEvents.DRAFT_CREATED,
    PricingEvents.DRAFT_PENDING_APPROVAL,
    PricingEvents.DRAFT_APPROVED,
    PricingEvents.DRAFT_REJECTED,
    PricingEvents.COMPETITOR_RECORDED,
    PricingEvents.LOG_RECORDED,
    PricingEvents.AI_SUGGESTED,
    PricingEvents.AI_PLAN_GENERATED,
    PricingEvents.SNAPSHOT_ACCESSED,
  ].forEach((eventName) => subscribe(eventName, ensurePayload(eventName)));

  [
    BrandEvents.CREATED,
    BrandEvents.UPDATED,
    BrandEvents.DELETED,
    BrandEvents.IDENTITY_UPDATED,
    BrandEvents.IDENTITY_AI_GENERATED,
    BrandEvents.RULES_AI_GENERATED,
    BrandEvents.RULES_UPDATED,
    BrandEvents.AI_CONFIG_UPDATED,
  ].forEach((eventName) => subscribe(eventName, ensurePayload(eventName)));

  [
    SecurityGovernanceEvents.POLICY_CREATED,
    SecurityGovernanceEvents.POLICY_UPDATED,
    SecurityGovernanceEvents.POLICY_DELETED,
    SecurityGovernanceEvents.ROLE_ASSIGNED,
    SecurityGovernanceEvents.ROLE_REVOKED,
    SecurityGovernanceEvents.AI_RESTRICTION_UPDATED,
  ].forEach((eventName) => subscribe(eventName, ensurePayload(eventName)));

  [AuthEvents.SESSION_CREATED, AuthEvents.SESSION_REFRESHED].forEach((eventName) =>
    subscribe(eventName, ensurePayload(eventName)),
  );

  [
    InventoryEvents.CREATED,
    InventoryEvents.UPDATED,
    InventoryEvents.DELETED,
    InventoryEvents.STOCK_LOW,
  ].forEach((eventName) => subscribe(eventName, ensurePayload(eventName)));

  [
    CrmLeadEvents.CREATED,
    CrmLeadEvents.UPDATED,
    CrmLeadEvents.DELETED,
    CrmLeadEvents.SCORED,
  ].forEach((eventName) => subscribe(eventName, ensurePayload(eventName)));

  [
    MarketingEvents.CREATED,
    MarketingEvents.UPDATED,
    MarketingEvents.DELETED,
    MarketingEvents.STARTED,
    MarketingEvents.STOPPED,
  ].forEach((eventName) => subscribe(eventName, ensurePayload(eventName)));

  domainGuardsRegistered = true;
}

// ─────────────────────────────────────────────
// Public bootstrap entry
// ─────────────────────────────────────────────
export function initEventHub(): void {
  if (initialized) return;

  registerActivityLogSubscriber();
  registerAutomationEventHandlers();
  registerAutomationEngineSubscriber();
  registerNotificationSubscribers();
  registerPricingAutomationSubscriber();
  registerDomainEventSubscribers();
  registerDomainEventGuards();

  initialized = true;
}
