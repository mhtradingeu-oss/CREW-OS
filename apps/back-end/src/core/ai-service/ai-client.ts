import { logger } from "../logger.js";
import {
  createRunId,
  enforceAgentBudget,
  estimateCostUsd,
  estimateTokens,
  logExecution,
  recordMonitoringEvent,
  type RiskLevel,
} from "../ai/ai-monitoring.js";
import { applySafetyLayers } from "../ai/ai-safety.js";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
} 

export interface AIRequest {
  model?: string;
  messages: AIMessage[];
  temperature?: number;
  namespace?: string;
  agentName?: string;
  brandId?: string | null;
  tenantId?: string | null;
  runId?: string;
  fallbackModels?: string[];
  timeoutMs?: number;
  maxInputTokens?: number;
  requestedActions?: string[];
}

export interface AIResponse {
  success: boolean;
  content: string;
  raw?: unknown;
  error?: string;
  modelUsed?: string;
  runId: string;
  cached?: boolean;
  riskLevel?: RiskLevel;
  tokens?: { prompt: number; completion: number; total: number };
  latencyMs?: number;
}

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const OPENAI_KEY_ENV_NAMES = ["OPENAI_API_KEY", "AI_INTEGRATIONS_OPENAI_API_KEY"];
const OPENAI_BASE_ENV_NAMES = ["OPENAI_BASE_URL", "AI_INTEGRATIONS_OPENAI_BASE_URL"];
const DEFAULT_TEMPERATURE = 0.7;
const AI_TIMEOUT_MS = 45_000;
const MAX_INPUT_TOKENS = Number(process.env.AI_MAX_INPUT_TOKENS ?? 12_000);
const MAX_RETRIES = 2;
const BACKOFF_MS = 450;

function enforceContextLimit(messages: AIMessage[], maxTokens: number) {
  const total = estimateTokens(messages);
  if (total <= maxTokens) return messages;
  const ratio = maxTokens / total;
  return messages.map((msg, idx) => {
    if (idx === 0) return msg;
    const allowedChars = Math.max(32, Math.floor(msg.content.length * ratio));
    return { ...msg, content: msg.content.slice(-allowedChars) };
  });
}

export async function runAIRequest(req: AIRequest): Promise<AIResponse> {
  const runId = req.runId ?? createRunId();
  const start = Date.now();
  const namespace = req.namespace ?? "global";
  const primaryModel = req.model ?? process.env.AI_MODEL_MHOS ?? "gpt-4-turbo";
  const models = [primaryModel, ...(req.fallbackModels ?? [])];
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    const errMessage =
      "AI provider not configured. Set OPENAI_API_KEY or AI_INTEGRATIONS_OPENAI_API_KEY and restart the server.";
    logger.error(`[AI] ${errMessage}`, {});
    return { success: false, content: "", error: errMessage, runId };
  }

  const limitedMessages = enforceContextLimit(
    req.messages,
    req.maxInputTokens ?? MAX_INPUT_TOKENS,
  );
  const { messages: safeMessages, riskLevel } = await applySafetyLayers({
    messages: limitedMessages,
    context: {
      namespace,
      agentName: req.agentName,
      brandId: req.brandId,
      tenantId: req.tenantId,
      runId,
      requestedActions: req.requestedActions,
    },
  });

  const promptTokens = estimateTokens(safeMessages);
  const estimatedCost = estimateCostUsd(promptTokens, primaryModel);
  await enforceAgentBudget({
    agentName: req.agentName ?? namespace,
    brandId: req.brandId,
    tenantId: req.tenantId,
    estimatedTokens: promptTokens,
    estimatedCostUsd: estimatedCost,
  });

  let lastError: string | undefined;
  for (const model of models) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const attemptStart = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), req.timeoutMs ?? AI_TIMEOUT_MS);
        const response = await fetch(getOpenAIEndpoint(), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: safeMessages,
            temperature:
              req.temperature ?? Number(process.env.AI_MODEL_TEMPERATURE ?? DEFAULT_TEMPERATURE),
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await response.json().catch(() => ({}));
        const latency = Date.now() - attemptStart;
        const preview = safeMessages
          .map((msg) => `${msg.role}:${msg.content}`)
          .join(" | ")
          .slice(0, 120);
        logger.info(`[AI] Model=${model} Latency=${latency}ms Preview=${preview}`);

        if (!response.ok) {
          const errorMessage =
            (data as { error?: { message?: string } })?.error?.message ??
            `OpenAI responded with status ${response.status}`;
          lastError = errorMessage;
          await recordMonitoringEvent({
            category: "ENGINE_HEALTH",
            status: "ERROR",
            engine: model,
            namespace,
            riskLevel: "MEDIUM",
            brandId: req.brandId,
            tenantId: req.tenantId,
            metric: { errorMessage, statusCode: response.status },
          });
          if (attempt < MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS * (attempt + 1)));
            continue;
          }
          break;
        }

        const firstChoice = (data as { choices?: Array<{ message?: { content?: string } }> })
          ?.choices?.[0];
        const content = firstChoice?.message?.content?.toString()?.trim?.() ?? "";
        const completionTokens = Number((data as any)?.usage?.completion_tokens ?? 0);
        const totalTokens = Number((data as any)?.usage?.total_tokens ?? promptTokens + completionTokens);
        const costUsd = estimateCostUsd(totalTokens, model);
        const executionStatus = model !== primaryModel || attempt > 0 ? "FALLBACK" : "SUCCESS";

        await logExecution({
          runId,
          namespace,
          agentName: req.agentName,
          model,
          status: executionStatus,
          riskLevel,
          latencyMs: latency,
          promptTokens,
          completionTokens,
          totalTokens,
          costUsd,
          promptPreview: preview,
          outputPreview: content,
          brandId: req.brandId,
          tenantId: req.tenantId,
        });

        await recordMonitoringEvent({
          category: "PERFORMANCE_METRIC",
          status: executionStatus,
          engine: model,
          namespace,
          agentName: req.agentName,
          riskLevel,
          brandId: req.brandId,
          tenantId: req.tenantId,
          metric: { latency, promptTokens, totalTokens, costUsd, attempt },
        });

        return {
          success: true,
          content,
          raw: data,
          modelUsed: model,
          runId,
          riskLevel,
          tokens: { prompt: promptTokens, completion: completionTokens, total: totalTokens },
          latencyMs: latency,
        };
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : String(err);
        lastError = errMessage;
        await recordMonitoringEvent({
          category: "ENGINE_HEALTH",
          status: "ERROR",
          engine: model,
          namespace,
          riskLevel: "MEDIUM",
          brandId: req.brandId,
          tenantId: req.tenantId,
          metric: { error: errMessage },
        });
        await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS * (attempt + 1)));
      }
    }
  }

  logger.error(`[AI ERROR] ${lastError ?? "Unknown AI failure"}`, {});
  await logExecution({
    runId,
    namespace,
    agentName: req.agentName,
    model: primaryModel,
    status: "ERROR",
    riskLevel,
    promptTokens,
    totalTokens: promptTokens,
    costUsd: estimatedCost,
    errorMessage: lastError,
    brandId: req.brandId,
    tenantId: req.tenantId,
  });
  return {
    success: false,
    content: "",
    error: lastError ?? "AI provider error",
    runId,
    riskLevel,
  };
}

export function isAIConfigured(): boolean {
  return Boolean(getOpenAIApiKey());
}

function getOpenAIApiKey(): string | undefined {
  for (const envName of OPENAI_KEY_ENV_NAMES) {
    const candidate = process.env[envName];
    if (candidate?.trim()) {
      return candidate.trim();
    }
  }
  return undefined;
}

function getOpenAIBaseUrl(): string {
  for (const envName of OPENAI_BASE_ENV_NAMES) {
    const candidate = process.env[envName];
    if (candidate?.trim()) {
      return candidate.trim().replace(/\/+$/, "");
    }
  }
  return DEFAULT_OPENAI_BASE_URL;
}

function getOpenAIEndpoint(): string {
  return `${getOpenAIBaseUrl()}/chat/completions`;
}

/**
 * Example usage:
 *
 * const response = await runAIRequest({
 *   model: "gpt-4-turbo",
 *   messages: [
 *     { role: "system", content: "You are a helpful assistant." },
 *     { role: "user", content: "Return a friendly greeting." },
 *   ],
 * });
 *
 * if (response.success) {
 *   console.log(response.content);
 * }
 */
