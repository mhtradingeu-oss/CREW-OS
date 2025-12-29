import { findTicketWithMessages } from "../../db/repositories/support.repository.js";
import { runAIRequest, type AIMessage } from "../../ai-service/ai-client.js";
import { createRunId, recordMonitoringEvent } from "../ai-monitoring.js";
import { detectLanguage } from "../ai-utils.js";
import type { TicketRoutingResult } from "../../../modules/support/support.types.js";

export type SupportRouterParams = {
  ticketId?: string;
  brandId: string;
  tenantId?: string;
  message: string;
  locale?: string;
};

function fallbackRouting(locale: string): TicketRoutingResult {
  return {
    topic: "general",
    urgency: "normal",
    sentiment: "neutral",
    suggestedOwner: "support.queue",
    escalationNeeded: false,
    language: locale,
  };
}

async function buildRoutingContext(params: SupportRouterParams) {
  const ticket = params.ticketId
    ? await findTicketWithMessages(params.ticketId, { order: "asc", take: 10 })
    : null;
  return { ticket };
}

export async function runSupportRouter(params: SupportRouterParams): Promise<TicketRoutingResult> {
  const locale = params.locale ?? detectLanguage(params.message);
  const runId = createRunId();
  const context = await buildRoutingContext(params);

  const messages: AIMessage[] = [
    {
      role: "system",
      content:
        "You are AI_TICKET_ROUTER. Classify support tickets. Return JSON with keys: topic, urgency, sentiment, suggestedOwner, escalationNeeded (boolean), language.",
    },
    {
      role: "user",
      content: JSON.stringify({
        message: params.message,
        locale,
        brandId: params.brandId,
        tenantId: params.tenantId,
        ticket: context.ticket,
      }),
    },
  ];

  const response = await runAIRequest({
    messages,
    namespace: "support-router",
    agentName: "AI_TICKET_ROUTER",
    brandId: params.brandId,
    tenantId: params.tenantId,
    runId,
    requestedActions: ["classify_ticket"],
  });

  let parsed: TicketRoutingResult | null = null;
  if (response.success && response.content) {
    try {
      const obj = JSON.parse(response.content) as Partial<TicketRoutingResult>;
      parsed = {
        topic: typeof obj.topic === "string" ? obj.topic : undefined,
        urgency: typeof obj.urgency === "string" ? obj.urgency : undefined,
        sentiment: typeof obj.sentiment === "string" ? obj.sentiment : undefined,
        suggestedOwner: typeof obj.suggestedOwner === "string" ? obj.suggestedOwner : undefined,
        escalationNeeded: typeof obj.escalationNeeded === "boolean" ? obj.escalationNeeded : false,
        language: obj.language ?? locale,
      };
    } catch {
      parsed = null;
    }
  }

  const result = parsed ?? fallbackRouting(locale);

  await recordMonitoringEvent({
    category: "AGENT_ACTIVITY",
    status: response.success ? "SUCCESS" : "FALLBACK",
    agentName: "AI_TICKET_ROUTER",
    engine: "support-router",
    namespace: "support",
    brandId: params.brandId,
    tenantId: params.tenantId,
  });

  return result;
}
