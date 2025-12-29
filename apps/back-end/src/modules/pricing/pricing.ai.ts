import type { AIRequest } from "../../core/ai-service/ai-client.js";
import { runAIRequest } from "../../core/ai-service/ai-client.js";

export type PricingAIInput = Partial<AIRequest> & {
  prompt?: string;
  agent?: string;
};

export async function runPricingAI(input: PricingAIInput = {}) {
  const { prompt, agent, messages, ...rest } = input;
  const systemMessage = agent
    ? `You are the ${agent} AI assistant for MH-OS.`
    : "You are the pricing AI assistant for MH-OS.";
  const messagePayload =
    messages ??
    [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt ?? "AI placeholder for pricing" },
    ];
  return runAIRequest({
    ...rest,
    messages: messagePayload,
  });
}
