import { publishDomainEvent } from "../../core/events/event-bus.js";

export async function emitOnboardingCompleted(payload: {
  userId: string;
  tenantId: string;
  persona: string;
  completedAt: string;
}) {
  await publishDomainEvent({ type: "onboarding.completed", payload });
}
