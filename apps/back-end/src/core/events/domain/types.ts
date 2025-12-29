
// Helper for defining domain events (for type safety and registration)
export function defineDomainEvent<T extends DomainEventName>() {
  return {} as unknown as DomainEvent<T>;
}

import type { SecurityEvent } from "../../security/security-events.js";
import type { AIExecutionStatus } from "@prisma/client";

// إضافة دعم لحدث auth.login.success
import type { AuthLoginSuccessPayload } from "./examples/auth-login-success.event.js";

type SecurityPayloadMap = {
  [Event in SecurityEvent as Event["type"]]: Omit<Event, "type">;
};

export type DomainEventPayloadMap =
  SecurityPayloadMap & {
    "auth.login.success": AuthLoginSuccessPayload,
    "competitor.price.updated": {
      competitorId: string,
      productId: string,
      price: number,
      currency: string,
      updatedAt: string,
      brandId?: string,
    },
    "influencer.scored": {
      influencerId: string,
      brandId: string,
      score: number,
      marketFitScore?: number,
      authenticityScore?: number,
      scoredAt: string,
    },
    "media.generated": {
      requestId: string,
      brandId?: string,
      productId?: string,
      state: string,
      generatedAt: string,
    },
    "onboarding.completed": {
      userId: string,
      tenantId: string,
      persona: string,
      completedAt: string,
    },
    "white-label.config.created": {
      configId: string,
      brandId?: string,
      productId?: string,
      createdAt: string,
    },
    "ai.usage.logged": {
      runId: string,
      agentName?: string,
      model?: string,
      provider?: string,
      status: AIExecutionStatus,
      latencyMs?: number,
      totalTokens?: number,
      costUsd?: number,
      brandId?: string,
      tenantId?: string,
    },
    "ai.performance.snapshot": {
      avgLatency: number,
      totalRequests: number,
      errors: number,
      fallbacks: number,
    },
  };
export type DomainEventName = keyof DomainEventPayloadMap;

export interface DomainEventMeta {
  brandId?: string | null;
  tenantId?: string | null;
  actorUserId?: string | null;
  module?: string;
  source?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface DomainEvent<T extends DomainEventName = DomainEventName> {
  id: string;
  type: T;
  payload: DomainEventPayloadMap[T];
  meta?: DomainEventMeta;
  occurredAt: Date;
}

export type DomainEventHandler<T extends DomainEventName = DomainEventName> = (
  event: DomainEvent<T>,
) => Promise<void> | void;

export type DomainEventPublishPayload<T extends DomainEventName = DomainEventName> = {
  type: T;
  payload: DomainEventPayloadMap[T];
  meta?: DomainEventMeta;
};
