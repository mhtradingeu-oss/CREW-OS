import {
  findRecentTickets,
  findTicketWithMessages,
} from "../../db/repositories/support.repository.js";
import { runAIRequest, type AIMessage } from "../../ai-service/ai-client.js";
import { createRunId, recordMonitoringEvent } from "../ai-monitoring.js";
import { detectLanguage } from "../ai-utils.js";

export type SupportEngineParams = {
  brandId: string;
  tenantId?: string;
  userId?: string;
  channel?: string;
  message: string;
  locale?: string;
  ticketId?: string;
  contactId?: string;
};

export type SupportEngineResult = {
  answer: string;
  suggestedActions: string[];
  language: string;
};

function buildFallback(message: string, locale: string): SupportEngineResult {
  return {
    answer: locale === "ar"
      ? "تم استلام طلبك. سنراجع تذكرتك ونعود إليك قريباً."
      : locale === "de"
        ? "Wir haben Ihre Anfrage erhalten und melden uns zeitnah."
        : "We received your request and will get back shortly.",
    suggestedActions: ["tag:review", "set_status:OPEN"],
    language: locale,
  };
}

async function buildSupportContext(params: SupportEngineParams) {
  const tickets = await findRecentTickets(params.brandId);

  const activeTicket = params.ticketId
    ? await findTicketWithMessages(params.ticketId, { order: "asc" })
    : null;

  return {
    activeTicket,
    recentTickets: tickets,
  };
}

export async function runSupportEngine(params: SupportEngineParams): Promise<SupportEngineResult> {
  const locale = params.locale ?? detectLanguage(params.message);
  const runId = createRunId();
  const supportContext = await buildSupportContext(params);

  const messages: AIMessage[] = [
    {
      role: "system",
      content:
        "You are AI_SUPPORT_AGENT for MH-OS. Respond concisely and safely. Return JSON with keys answer, suggestedActions (array), language.",
    },
    {
      role: "user",
      content: JSON.stringify({
        message: params.message,
        channel: params.channel,
        locale,
        brandId: params.brandId,
        tenantId: params.tenantId,
        ticketId: params.ticketId,
        contactId: params.contactId,
        context: supportContext,
      }),
    },
  ];

  const response = await runAIRequest({
    messages,
    namespace: "support-engine",
    agentName: "AI_SUPPORT_AGENT",
    brandId: params.brandId,
    tenantId: params.tenantId,
    runId,
    requestedActions: ["create_ticket", "reply_ticket"],
  });

  let parsed: SupportEngineResult | null = null;
  if (response.success && response.content) {
    try {
      const obj = JSON.parse(response.content) as Partial<SupportEngineResult>;
      parsed = {
        answer: typeof obj.answer === "string" ? obj.answer : buildFallback(params.message, locale).answer,
        suggestedActions: Array.isArray(obj.suggestedActions)
          ? obj.suggestedActions.filter((a): a is string => typeof a === "string")
          : [],
        language: obj.language ?? locale,
      };
    } catch {
      parsed = null;
    }
  }

  const result = parsed ?? buildFallback(params.message, locale);

  await recordMonitoringEvent({
    category: "AGENT_ACTIVITY",
    status: response.success ? "SUCCESS" : "FALLBACK",
    agentName: "AI_SUPPORT_AGENT",
    engine: "support-engine",
    namespace: "support",
    brandId: params.brandId,
    tenantId: params.tenantId,
  });

  return result;
}
