import type { AIRequest } from "../../core/ai-service/ai-client.js";
import { runAIRequest } from "../../core/ai-service/ai-client.js";

export type MarketingAIInput = Partial<AIRequest> & {
  prompt?: string;
  agent?: string;
};

export async function runMarketingAI(input: MarketingAIInput = {}) {
  const { prompt, agent, messages, ...rest } = input;
  const systemMessage = agent
    ? `You are the ${agent} AI assistant for MH-OS.`
    : "You are the marketing AI assistant for MH-OS.";
  const messagePayload =
    messages ??
    [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt ?? "AI placeholder for marketing" },
    ];
  return runAIRequest({
    ...rest,
    messages: messagePayload,
  });
}
