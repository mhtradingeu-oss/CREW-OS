import crypto from "crypto";
import { runAIRequest, type AIRequest, type AIResponse } from "../ai-service/ai-client.js";

export type CacheEntry<T> = { value: T; expiresAt: number };

export class SimpleCache<T> {
  constructor(private ttlMs: number) {}
  private store = new Map<string, CacheEntry<T>>();

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

export function hashPayload(input: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export class MemoryCache<T> {
  constructor(private readonly ttlMs = 60_000) {}
  private store = new Map<string, CacheEntry<T>>();

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

export function hashObject(obj: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

export type CachedAIResponse<T> = {
  result: T;
  raw?: AIResponse & { status?: string };
  cached?: boolean;
};

export async function safeAIRequest<T>(
  request: AIRequest,
  fallback: () => T,
  options?: { runId?: string },
): Promise<CachedAIResponse<T>> {
  try {
    const response = await runAIRequest(options?.runId ? { ...request, runId: options.runId } : request);
    if (response.success && response.content) {
      try {
        const parsed = JSON.parse(response.content) as T;
        return { result: parsed, raw: response };
      } catch {
        /* swallow JSON errors and fall through to fallback */
        return { result: fallback(), raw: { ...response, status: "FALLBACK" } };
      }
    }
  } catch {
    /* ignore AI errors and use fallback */
  }
  return { result: fallback() };
}

// Lightweight language guesser for ar/de/en; defaults to "en".
export function detectLanguage(text: string | undefined | null): string {
  if (!text || typeof text !== "string") return "en";
  const sample = text.slice(0, 256).toLowerCase();
  // Arabic unicode range quick check
  if (/[\u0600-\u06FF]/.test(sample)) return "ar";
  const germanHints = ["und", "der", "die", "das", "nicht", "für", "mit", "danke", "bitte"];
  const englishHints = ["the", "and", "please", "thanks", "ticket", "support"];
  const hitGerman = germanHints.some((w) => sample.includes(` ${w} `) || sample.startsWith(`${w} `));
  const hitEnglish = englishHints.some((w) => sample.includes(` ${w} `) || sample.startsWith(`${w} `));
  if (hitGerman && !hitEnglish) return "de";
  if (hitEnglish && !hitGerman) return "en";
  return hitGerman ? "de" : "en";
}
