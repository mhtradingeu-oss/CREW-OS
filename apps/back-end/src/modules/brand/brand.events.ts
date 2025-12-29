import { publish, type EventContext } from "../../core/events/event-bus.js";
import type { BrandCreatedPayload } from "./brand.types.js";

export enum BrandEvents {
  CREATED = "brand.created",
  UPDATED = "brand.updated",
  DELETED = "brand.deleted",
  IDENTITY_UPDATED = "brand.identity.updated",
  IDENTITY_AI_GENERATED = "brand.identity.ai_generated",
  RULES_AI_GENERATED = "brand.rules.ai_generated",
  RULES_UPDATED = "brand.rules.updated",
  AI_CONFIG_UPDATED = "brand.ai_config.updated",
}

export async function emitBrandCreated(payload: BrandCreatedPayload, context?: EventContext) {
  await publish(BrandEvents.CREATED, payload, context);
}

export async function emitBrandUpdated(payload: BrandCreatedPayload, context?: EventContext) {
  await publish(BrandEvents.UPDATED, payload, context);
}

export async function emitBrandDeleted(payload: BrandCreatedPayload, context?: EventContext) {
  await publish(BrandEvents.DELETED, payload, context);
}

export async function emitBrandIdentityUpdated(payload: BrandCreatedPayload, context?: EventContext) {
  await publish(BrandEvents.IDENTITY_UPDATED, payload, context);
}

export async function emitBrandIdentityAiGenerated(payload: BrandCreatedPayload, context?: EventContext) {
  await publish(BrandEvents.IDENTITY_AI_GENERATED, payload, context);
}

export async function emitBrandRulesAiGenerated(payload: BrandCreatedPayload, context?: EventContext) {
  await publish(BrandEvents.RULES_AI_GENERATED, payload, context);
}

export async function emitBrandRulesUpdated(payload: BrandCreatedPayload, context?: EventContext) {
  await publish(BrandEvents.RULES_UPDATED, payload, context);
}

export async function emitBrandAiConfigUpdated(payload: BrandCreatedPayload, context?: EventContext) {
  await publish(BrandEvents.AI_CONFIG_UPDATED, payload, context);
}
