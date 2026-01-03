import { env } from "../../../core/config/env.js";
import { logger } from "../../../core/logger.js";
import { SimpleCache, hashObject } from "../../../core/ai/ai-utils.js";
import { ApiError } from "../../../core/http/errors.js";
import { runReadOnlySnapshot } from "../../../core/prisma-read-only-guard.js";
import type { AIReadOnlySnapshot } from "./ai-read-only.types.js";
import { buildAIReadOnlySnapshot, AIReadOnlySnapshotOptions, AI_READ_ONLY_WINDOW_MINUTES } from "./ai-read-only.snapshot.js";

const snapshotCache = new SimpleCache<AIReadOnlySnapshot>(env.AI_READ_ONLY_CACHE_TTL_MS);

function createCacheKey(brandId?: string) {
  return hashObject({
    brandId: brandId ?? "global",
    environment: env.NODE_ENV,
    windowMinutes: AI_READ_ONLY_WINDOW_MINUTES,
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  if (timeoutMs <= 0) return promise;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new ApiError(503, `AI read-only snapshot ${label} timed out`, undefined, "AI_READ_ONLY_TIMEOUT"));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function enforceBounds(snapshot: AIReadOnlySnapshot) {
  const rowCount = snapshot.events.moduleBreakdown.length;
  if (rowCount > env.AI_READ_ONLY_MAX_ROWS) {
    throw new ApiError(
      503,
      `AI read-only snapshot row limit exceeded (${rowCount} rows, max ${env.AI_READ_ONLY_MAX_ROWS})`,
      undefined,
      "AI_READ_ONLY_ROW_LIMIT",
    );
  }

  const payloadSize = Buffer.byteLength(JSON.stringify(snapshot));
  if (payloadSize > env.AI_READ_ONLY_MAX_PAYLOAD_BYTES) {
    throw new ApiError(
      503,
      `AI read-only snapshot payload size ${payloadSize} bytes exceeds limit (${env.AI_READ_ONLY_MAX_PAYLOAD_BYTES})`,
      undefined,
      "AI_READ_ONLY_PAYLOAD_LIMIT",
    );
  }
}

function snapshotContextLogging({
  snapshot,
  brandId,
  cacheHit,
  durationMs,
  correlationId,
}: {
  snapshot: AIReadOnlySnapshot;
  brandId?: string;
  cacheHit: boolean;
  durationMs: number;
  correlationId?: string;
}) {
  const brandHash = hashObject({ brandId: brandId ?? "global" });
  logger.info("ai.read-only.snapshot.serve", {
    module: "ai-read-only",
    correlationId,
    snapshotHash: snapshot.snapshotHash,
    aiWindowMinutes: AI_READ_ONLY_WINDOW_MINUTES,
    brandHash,
    cacheHit,
    durationMs,
  });
}

function ensureFeatureEnabled() {
  if (!env.AI_READ_ONLY_ENABLED) {
    throw new ApiError(
      503,
      `AI read-only snapshots are disabled in ${env.NODE_ENV}. Set AI_READ_ONLY_ENABLED to true to enable Phase D.`,
      undefined,
      "AI_READ_ONLY_DISABLED",
    );
  }
}

export const aiReadOnlySnapshotService = {
  async fetchSnapshot(params: { brandId?: string; correlationId?: string }) {
    ensureFeatureEnabled();

    const cacheKey = createCacheKey(params.brandId);
    const cached = snapshotCache.get(cacheKey);
    if (cached) {
      snapshotContextLogging({
        snapshot: cached,
        brandId: params.brandId,
        cacheHit: true,
        durationMs: 0,
        correlationId: params.correlationId,
      });
      return structuredClone(cached);
    }

    const start = Date.now();
    const options: AIReadOnlySnapshotOptions = {
      brandId: params.brandId,
    };

    const snapshot = await withTimeout(
      runReadOnlySnapshot(() => buildAIReadOnlySnapshot(options)),
      env.AI_READ_ONLY_TIMEOUT_MS,
      "generation",
    );

    enforceBounds(snapshot);
    const durationMs = Date.now() - start;
    snapshotContextLogging({
      snapshot,
      brandId: params.brandId,
      cacheHit: false,
      durationMs,
      correlationId: params.correlationId,
    });

    snapshotCache.set(cacheKey, structuredClone(snapshot));
    return structuredClone(snapshot);
  },

  clearCache() {
    snapshotCache.clear();
  },
};
