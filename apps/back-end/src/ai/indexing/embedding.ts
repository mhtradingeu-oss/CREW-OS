import crypto from "crypto";
import { MemoryCache } from "../../core/ai/ai-utils.js";
import type { EmbeddingVector } from "./indexer-types.js";

const EMBEDDING_MODEL = process.env.AI_EMBED_MODEL ?? "text-embedding-3-large";
const OPENAI_KEY_ENV_NAMES = ["OPENAI_API_KEY", "AI_INTEGRATIONS_OPENAI_API_KEY"];
const OPENAI_BASE_ENV_NAMES = ["OPENAI_BASE_URL", "AI_INTEGRATIONS_OPENAI_BASE_URL"];
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_EMBED_DIM = 64;
const embeddingCache = new MemoryCache<EmbeddingVector>(5 * 60_000);

export async function generateEmbedding(text: string, model = EMBEDDING_MODEL): Promise<EmbeddingVector> {
  const normalized = text?.slice(0, 8_000) ?? ""; // guard runaway prompts
  const cacheKey = `${model}:${normalized}`;
  const cached = embeddingCache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    const fallback = deterministicEmbedding(normalized);
    embeddingCache.set(cacheKey, fallback);
    return fallback;
  }

  try {
    const response = await fetch(`${getOpenAIBaseUrl()}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: normalized,
        model,
      }),
    });

    const data = await response.json().catch(() => ({}));
    const vector = (data as { data?: Array<{ embedding?: number[] }> })?.data?.[0]?.embedding;
    if (!response.ok || !Array.isArray(vector)) {
      const fallback = deterministicEmbedding(normalized);
      embeddingCache.set(cacheKey, fallback);
      return fallback;
    }
    const embedding = { vector, model } satisfies EmbeddingVector;
    embeddingCache.set(cacheKey, embedding);
    return embedding;
  } catch {
    const fallback = deterministicEmbedding(normalized);
    embeddingCache.set(cacheKey, fallback);
    return fallback;
  }
}

function deterministicEmbedding(text: string): EmbeddingVector {
  const hash = crypto.createHash("sha256").update(text).digest();
  const vector = Array.from({ length: DEFAULT_EMBED_DIM }, (_, idx) => {
    const byte = hash[idx % hash.length] ?? 0;
    return (byte / 255) * 2 - 1; // map to [-1, 1]
  });
  return { vector, model: "deterministic-fallback" };
}

function getOpenAIApiKey(): string | undefined {
  for (const keyName of OPENAI_KEY_ENV_NAMES) {
    const candidate = process.env[keyName];
    if (candidate?.trim()) return candidate.trim();
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
