import { type AIMessage, type AIRequest, runAIRequest } from "../../core/ai-service/ai-client.js";

type WhiteLabelAIInput = Partial<Pick<AIRequest, "model" | "messages" | "temperature">> & {
  prompt?: string;
};

export async function runWhiteLabelAI(input: WhiteLabelAIInput = {}) {
  const baseMessages: AIMessage[] = [
    {
      role: "system",
      content: "You are a helpful assistant that answers questions about the White-Label OS.",
    },
    {
      role: "user",
      content: input.prompt ?? "AI placeholder for white-label",
    },
  ];

  return runAIRequest({
    model: input.model ?? "gpt-4-turbo",
    messages: input.messages ?? baseMessages,
    temperature: input.temperature,
  });
}
