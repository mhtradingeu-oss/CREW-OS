import { env } from "../../../core/config/env.js";
import { logger } from "../../../core/logger.js";
import { SimpleCache } from "../../../core/ai/ai-utils.js";
import { buildAIReadOnlySnapshot } from "../ai-read-only/ai-read-only.snapshot.js";
import { buildSuggestionsFromSnapshot } from "./ai-suggestions.engine.js";
import { validateSuggestionsPayload } from "./ai-suggestions.guard.js";
import {
  AI_SUGGESTIONS_OUTPUT_TYPE,
  AI_SUGGESTIONS_VERSION,
  AI_SUGGESTIONS_DECLARATION,
} from "./ai-suggestions.constants.js";
import type { AISuggestionsReadout } from "./ai-suggestions.types.js";
import type { AIReadOnlySnapshot } from "../ai-read-only/ai-read-only.types.js";

const cache = new SimpleCache<AISuggestionsReadout>(env.AI_SUGGESTIONS_CACHE_TTL_MS);

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  if (timeoutMs <= 0) return promise;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`AI suggestions ${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export const aiSuggestionsService = {
  async getSuggestions(params: { brandId?: string; correlationId?: string }) {
    if (!env.AI_SUGGESTIONS_ENABLED) {
      throw new Error("AI suggestions are disabled");
    }

    const cacheKey = params.brandId ?? "global";
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const start = Date.now();

    try {
      const snapshot = (await withTimeout(
        buildAIReadOnlySnapshot(),
        env.AI_SUGGESTIONS_TIMEOUT_MS,
        "snapshot",
      )) as AIReadOnlySnapshot;
      const suggestionsPayload = buildSuggestionsFromSnapshot(snapshot);
      const inputPayload = JSON.stringify(snapshot);
      const inputSizeBytes = Buffer.byteLength(inputPayload);
      const durationMs = Date.now() - start;
      const payload = {
        version: AI_SUGGESTIONS_VERSION,
        declaration: AI_SUGGESTIONS_DECLARATION,
        generatedAt: snapshot.generatedAt,
        snapshotHash: snapshot.snapshotHash,
        suggestions: suggestionsPayload.suggestions,
        riskFlags: suggestionsPayload.riskFlags,
        improvementIdeas: suggestionsPayload.improvementIdeas,
        metadata: {
          aiVersion: AI_SUGGESTIONS_VERSION,
          outputType: AI_SUGGESTIONS_OUTPUT_TYPE,
          inputSizeBytes,
          durationMs,
        },
      };

      const validated = validateSuggestionsPayload(payload);
      const result: AISuggestionsReadout = {
        payload: validated,
        snapshot,
      };
      cache.set(cacheKey, result);

      logger.info("ai.suggestions.generated", {
        module: "ai-suggestions",
        correlationId: params.correlationId,
        brandId: params.brandId,
        snapshotHash: snapshot.snapshotHash,
        aiVersion: AI_SUGGESTIONS_VERSION,
        durationMs,
        suggestionIds: validated.suggestions.map((suggestion) => suggestion.id),
        confidenceLevels: validated.suggestions.map((suggestion) => suggestion.confidence),
      });

      return result;
    } catch (error) {
      logger.error("ai.suggestions.failed", {
        module: "ai-suggestions",
        correlationId: params.correlationId,
        brandId: params.brandId,
        error,
      });
      throw error;
    }
  },
};
