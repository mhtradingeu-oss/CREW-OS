import assert from "node:assert/strict";
import test from "node:test";
import type { TestContext } from "node:test";
import { generateImage } from "../../core/ai/engines/media.engine.js";
import * as monitoring from "../../core/ai/ai-monitoring.js";
import * as safety from "../../core/ai/ai-safety.js";
import * as registry from "../../core/ai/providers/media/media.registry.js";
import type { ImageMediaProvider, MediaCallContext } from "../../core/ai/providers/media/media.types.js";

const ctx: MediaCallContext = { brandId: "brand-1", tenantId: "tenant-1", namespace: "media:test" };

function stubSafety(t: TestContext) {
  t.mock.method(safety, "applySafetyLayers", async (args: { messages: unknown[] }) => ({ messages: args.messages, riskLevel: "LOW" as const }));
  t.mock.method(monitoring, "logExecution", async () => {});
  t.mock.method(monitoring, "recordMonitoringEvent", async () => {});
  t.mock.method(monitoring, "recordSafetyEvent", async () => {});
  t.mock.method(monitoring, "enforceAgentBudget", async () => {});
}

test("falls back to secondary provider when primary fails", async (t) => {
  stubSafety(t);

  const primary: ImageMediaProvider = {
    id: "sdxl-http",
    kind: "image",
    label: "Primary",
    description: "Primary test provider",
    isFree: false,
    requiresApiKey: false,
    envVarKeys: [],
    enabledByDefault: true,
    async generate() {
      throw new Error("primary failed");
    },
  };

  const fallback: ImageMediaProvider = {
    id: "canva-style-mockup",
    kind: "image",
    label: "Fallback",
    description: "Fallback test provider",
    isFree: true,
    requiresApiKey: false,
    envVarKeys: [],
    enabledByDefault: true,
    async generate(params) {
      return { url: "https://example.com/fallback.png", width: params.width ?? 512, height: params.height ?? 512, provider: "canva-style-mockup" };
    },
  };

  t.mock.method(registry, "getImageProviderCatalog", () => [
    { ...primary, available: true, missingKeys: [] } as any,
    { ...fallback, available: true, missingKeys: [] } as any,
  ]);

  const result = await generateImage({ prompt: "product hero shot", engineId: "sdxl-http" }, ctx);
  assert.equal(result.provider, fallback.id);
  assert.equal(result.url.includes("fallback"), true);
});

test("blocks unsafe prompts before hitting providers", async (t) => {
  stubSafety(t);

  const safeProvider: ImageMediaProvider = {
    id: "canva-style-mockup",
    kind: "image",
    label: "Safe",
    description: "Safe provider",
    isFree: true,
    requiresApiKey: false,
    envVarKeys: [],
    enabledByDefault: true,
    async generate(params) {
      return { url: "https://example.com/safe.png", width: params.width ?? 512, height: params.height ?? 512, provider: "canva-style-mockup" };
    },
  };

  t.mock.method(registry, "getImageProviderCatalog", () => [{ ...safeProvider, available: true, missingKeys: [] } as any]);

  await assert.rejects(() => generateImage({ prompt: "nsfw brand shot" }, ctx), /Prompt blocked/i);
});
