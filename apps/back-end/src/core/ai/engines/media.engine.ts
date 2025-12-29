import { badRequest, forbidden } from "../../http/errors.js";
import { logger } from "../../logger.js";
import { applySafetyLayers } from "../ai-safety.js";
import {
  createRunId,
  enforceAgentBudget,
  estimateTokens,
  logExecution,
  recordMonitoringEvent,
  recordSafetyEvent,
  type RiskLevel,
} from "../ai-monitoring.js";
import {
  getAvailableImageProviders,
  getAvailableVideoProviders,
  getImageProviderCatalog,
  getVideoProviderCatalog,
  resolveMediaProvider,
} from "../providers/media/media.registry.js";
import { AI_AGENTS_MANIFEST } from "../../../ai/schema/ai-agents-manifest.js";
import type {
  ImageGenerationParams,
  ImageGenerationResult,
  MediaCallContext,
  MediaEngineId,
  MediaProviderKind,
  ImageMediaProvider,
  VideoMediaProvider,
  VideoGenerationParams,
  VideoGenerationResult,
} from "../providers/media/media.types.js";
import type { AIMessage } from "../../ai-service/ai-client.js";

export type MediaEngineKind = MediaProviderKind;

export type ImageEngineRequest = ImageGenerationParams & {
  engineId?: MediaEngineId | "auto";
  namespace?: string;
  agentName?: string;
};

export type VideoEngineRequest = VideoGenerationParams & {
  engineId?: MediaEngineId | "auto";
  namespace?: string;
  agentName?: string;
};

const DEFAULT_IMAGE_NAMESPACE = "media:image";
const DEFAULT_VIDEO_NAMESPACE = "media:video";
const SAFE_IMAGE_PROVIDER_ID: MediaEngineId = "canva-style-mockup";
const SAFE_VIDEO_PROVIDER_ID: MediaEngineId = "placeholder-sora";
const PROMPT_BLOCKLIST = ["nsfw", "nude", "nudity", "gore", "weapon", "blood", "violence", "politics"];

function buildMessages(prompt: string, negativePrompt?: string): AIMessage[] {
  const messages: AIMessage[] = [{ role: "user", content: prompt }];
  if (negativePrompt) {
    messages.push({ role: "user", content: `Avoid: ${negativePrompt}` });
  }
  return messages;
}

function costUnitForProvider(isFree: boolean): number {
  return isFree ? 0 : 1;
}

function dedupeProviders<T extends ImageMediaProvider | VideoMediaProvider>(providers: T[]) {
  const seen = new Set<string>();
  return providers.filter((provider) => {
    if (seen.has(provider.id)) return false;
    seen.add(provider.id);
    return true;
  });
}

function getAgentProviderPreferences(kind: MediaProviderKind, agentName?: string): MediaEngineId[] {
  const catalog = kind === "image" ? getImageProviderCatalog() : getVideoProviderCatalog();
  const validIds = new Set(catalog.map((provider) => provider.id));
  const defaults = [agentName, kind === "image" ? "AI_IMAGE_DESIGNER" : "AI_VIDEO_PRODUCER", "AI_MEDIA_CREATOR", "AI_WHITE_LABEL_ASSISTANT"];
  for (const name of defaults) {
    if (!name) continue;
    const agent = AI_AGENTS_MANIFEST.find((item) => item.name === name);
    if (agent?.providerPreferences?.length) {
      const prefs = agent.providerPreferences.filter((id) => validIds.has(id as MediaEngineId)) as MediaEngineId[];
      if (prefs.length) return prefs;
    }
  }
  return [];
}

function enforceBasicPromptSafety(prompt: string, ctx: MediaCallContext, runId: string, namespace: string) {
  const lower = prompt.toLowerCase();
  if (PROMPT_BLOCKLIST.some((token) => lower.includes(token))) {
    void recordSafetyEvent({
      type: "PROMPT_FIREWALL",
      action: "BLOCK",
      runId,
      namespace,
      riskLevel: "HIGH",
      decision: "blocked",
      detail: { reason: "blocked-keyword", prompt },
      brandId: ctx.brandId ?? null,
      tenantId: ctx.tenantId ?? null,
    });
    throw forbidden("Prompt blocked by media safety rules");
  }
}

function orderProviders(kind: MediaProviderKind): Array<ImageMediaProvider | VideoMediaProvider> {
  const catalog = kind === "image" ? getImageProviderCatalog() : getVideoProviderCatalog();
  return catalog
    .filter((p) => p.available)
    .sort((a, b) => Number(b.isFree) - Number(a.isFree))
    .map((p) => p as ImageMediaProvider | VideoMediaProvider);
}

function buildFallbackChain(kind: MediaProviderKind, preferredId?: MediaEngineId, agentName?: string) {
  const ordered = orderProviders(kind);
  const prefs = getAgentProviderPreferences(kind, agentName);
  const safeId = kind === "image" ? SAFE_IMAGE_PROVIDER_ID : SAFE_VIDEO_PROVIDER_ID;

  let chain = ordered;
  if (prefs.length) {
    const preferredProviders = prefs
      .map((id) => ordered.find((provider) => provider.id === id))
      .filter(Boolean) as Array<ImageMediaProvider | VideoMediaProvider>;
    const remaining = ordered.filter((provider) => !prefs.includes(provider.id));
    chain = dedupeProviders([...preferredProviders, ...remaining]);
  }

  if (preferredId) {
    let explicit = ordered.find((p) => p.id === preferredId) as ImageMediaProvider | VideoMediaProvider | undefined;
    if (!explicit) {
      explicit = resolveMediaProvider(kind, preferredId) as ImageMediaProvider | VideoMediaProvider;
    }
    chain = dedupeProviders([explicit, ...chain]);
  }

  if (!chain.some((provider) => provider.id === safeId)) {
    try {
      const safeProvider = resolveMediaProvider(kind, safeId) as ImageMediaProvider | VideoMediaProvider;
      chain = [...chain, safeProvider];
    } catch (err) {
      logger.warn(`[media] safe fallback provider ${safeId} unavailable: ${err instanceof Error ? err.message : err}`, {});
    }
  }

  if (chain.length) {
    return chain;
  }

  throw badRequest("No media providers are available. Configure at least one provider endpoint or API key.");
}

async function enforceBudgets(
  agentName: string,
  ctx: MediaCallContext,
  estimatedTokens: number,
  estimatedCost: number,
) {
  await enforceAgentBudget({
    agentName,
    brandId: ctx.brandId ?? null,
    tenantId: ctx.tenantId ?? null,
    estimatedTokens,
    estimatedCostUsd: estimatedCost,
  });
}

async function runWithMonitoring<TResult>(params: {
  kind: MediaProviderKind;
  providerId: MediaEngineId;
  namespace: string;
  agentName: string;
  ctx: MediaCallContext;
  prompt: string;
  negativePrompt?: string;
  costUnit: number;
  generate: () => Promise<TResult>;
}) {
  const runId = params.ctx.traceId ?? createRunId();
  enforceBasicPromptSafety(params.prompt, params.ctx, runId, params.namespace);
  const messages = buildMessages(params.prompt, params.negativePrompt);
  const { messages: safeMessages, riskLevel } = await applySafetyLayers({
    messages,
    context: {
      namespace: params.namespace,
      agentName: params.agentName,
      brandId: params.ctx.brandId ?? null,
      tenantId: params.ctx.tenantId ?? null,
      runId,
      requestedActions: [params.kind === "image" ? "MEDIA_IMAGE" : "MEDIA_VIDEO"],
    },
  });

  await recordSafetyEvent({
    type: "SAFETY_CONSTRAINT",
    action: "ALLOW",
    runId,
    agentName: params.agentName,
    namespace: params.namespace,
    riskLevel: riskLevel as RiskLevel,
    decision: "allowed",
    detail: { domain: "media", messages: safeMessages.length },
    brandId: params.ctx.brandId ?? null,
    tenantId: params.ctx.tenantId ?? null,
  });

  const estimatedTokens = estimateTokens(safeMessages);
  await enforceBudgets(params.agentName, params.ctx, estimatedTokens, params.costUnit);

  const start = Date.now();
  try {
    const result = await params.generate();
    const latency = Date.now() - start;
    await logExecution({
      runId,
      namespace: params.namespace,
      agentName: params.agentName,
      provider: params.providerId,
      status: "SUCCESS",
      riskLevel: riskLevel as RiskLevel,
      latencyMs: latency,
      promptTokens: estimatedTokens,
      totalTokens: estimatedTokens,
      costUsd: params.costUnit,
      promptPreview: params.prompt.slice(0, 200),
      outputPreview: typeof result === "object" ? JSON.stringify(result).slice(0, 500) : String(result),
      brandId: params.ctx.brandId ?? null,
      tenantId: params.ctx.tenantId ?? null,
    });
    await recordMonitoringEvent({
      category: "PERFORMANCE_METRIC",
      status: "SUCCESS",
      engine: params.providerId,
      namespace: params.namespace,
      agentName: params.agentName,
      riskLevel: riskLevel as RiskLevel,
      brandId: params.ctx.brandId ?? null,
      tenantId: params.ctx.tenantId ?? null,
      metric: { latency, costUnit: params.costUnit, kind: params.kind },
    });
    return { result, riskLevel, runId };
  } catch (error) {
    const latency = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);
    await logExecution({
      runId,
      namespace: params.namespace,
      agentName: params.agentName,
      provider: params.providerId,
      status: "ERROR",
      riskLevel: riskLevel as RiskLevel,
      latencyMs: latency,
      promptTokens: estimatedTokens,
      totalTokens: estimatedTokens,
      costUsd: params.costUnit,
      promptPreview: params.prompt.slice(0, 200),
      errorMessage: message,
      brandId: params.ctx.brandId ?? null,
      tenantId: params.ctx.tenantId ?? null,
    });
    await recordMonitoringEvent({
      category: "ENGINE_HEALTH",
      status: "ERROR",
      engine: params.providerId,
      namespace: params.namespace,
      agentName: params.agentName,
      riskLevel: riskLevel as RiskLevel,
      brandId: params.ctx.brandId ?? null,
      tenantId: params.ctx.tenantId ?? null,
      metric: { error: message, latency },
    });
    throw error;
  }
}

export function listImageEngines() {
  return getImageProviderCatalog();
}

export function listVideoEngines() {
  return getVideoProviderCatalog();
}

export async function generateImage(
  request: ImageEngineRequest,
  ctx: MediaCallContext,
): Promise<ImageGenerationResult & { riskLevel?: RiskLevel; runId: string }> {
  if (!request.prompt?.trim()) {
    throw badRequest("prompt is required for image generation");
  }
  const preferredId = request.engineId === "auto" ? undefined : request.engineId;
  const namespace = request.namespace ?? ctx.namespace ?? DEFAULT_IMAGE_NAMESPACE;
  const agentName = request.agentName ?? "AI_IMAGE_DESIGNER";
  const providers = buildFallbackChain("image", preferredId, agentName) as ImageMediaProvider[];
  let lastError: unknown;

  for (const provider of providers) {
    const costUnit = costUnitForProvider((provider as any).isFree ?? false);
    try {
      const { result, riskLevel, runId } = await runWithMonitoring<ImageGenerationResult>({
        kind: "image",
        providerId: provider.id,
        namespace,
        agentName,
        ctx,
        prompt: request.prompt,
        negativePrompt: request.negativePrompt,
        costUnit,
        generate: () => provider.generate(request, ctx),
      });
      if (provider.id !== preferredId && preferredId) {
        logger.warn(`[media] image fallback used provider ${provider.id} instead of ${preferredId}`, {});
      }
      return { ...result, riskLevel, runId };
    } catch (err) {
      lastError = err;
      logger.warn(`[media] provider ${provider.id} failed, attempting fallback`, { error: err });
    }
  }

  throw lastError ?? badRequest("Image generation failed for all providers");
}

export async function generateVideo(
  request: VideoEngineRequest,
  ctx: MediaCallContext,
): Promise<VideoGenerationResult & { riskLevel?: RiskLevel; runId: string }> {
  if (!request.prompt?.trim()) {
    throw badRequest("prompt is required for video generation");
  }
  const preferredId = request.engineId === "auto" ? undefined : request.engineId;
  const namespace = request.namespace ?? ctx.namespace ?? DEFAULT_VIDEO_NAMESPACE;
  const agentName = request.agentName ?? "AI_VIDEO_PRODUCER";
  const providers = buildFallbackChain("video", preferredId, agentName) as VideoMediaProvider[];
  let lastError: unknown;

  for (const provider of providers) {
    const costUnit = costUnitForProvider((provider as any).isFree ?? false);
    try {
      const { result, riskLevel, runId } = await runWithMonitoring<VideoGenerationResult>({
        kind: "video",
        providerId: provider.id,
        namespace,
        agentName,
        ctx,
        prompt: request.prompt,
        costUnit,
        generate: () => provider.generate(request, ctx),
      });
      if (provider.id !== preferredId && preferredId) {
        logger.warn(`[media] video fallback used provider ${provider.id} instead of ${preferredId}`, {});
      }
      return { ...result, riskLevel, runId };
    } catch (err) {
      lastError = err;
      logger.warn(`[media] provider ${provider.id} failed, attempting fallback`, { error: err });
    }
  }

  throw lastError ?? badRequest("Video generation failed for all providers");
}

export function getDefaultImageProviderId(): MediaEngineId | undefined {
  const available = getAvailableImageProviders();
  return available[0]?.id;
}

export function getDefaultVideoProviderId(): MediaEngineId | undefined {
  const available = getAvailableVideoProviders();
  return available[0]?.id;
}
