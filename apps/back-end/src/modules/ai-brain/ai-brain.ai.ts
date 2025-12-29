import type { AIRequest } from "../../core/ai-service/ai-client.js";
import { runAIRequest } from "../../core/ai-service/ai-client.js";

export type AiBrainAIInput = Partial<AIRequest> & {
  prompt?: string;
  agent?: string;
};

export async function runAiBrainAI(input: AiBrainAIInput = {}) {
  const { prompt, agent, messages, ...rest } = input;
  const systemMessage = agent
    ? `You are the ${agent} AI assistant for MH-OS.`
    : "You are the AI Brain assistant.";
  const messagePayload =
    messages ??
    [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt ?? "AI placeholder for ai-brain" },
    ];
  return runAIRequest({
    ...rest,
    messages: messagePayload,
  });
}
