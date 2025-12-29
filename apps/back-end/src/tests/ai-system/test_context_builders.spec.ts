import assert from "node:assert/strict";
import test from "node:test";
import { buildPromptFromContexts, mergeContexts, safeTruncate } from "../../core/ai/pipeline/pipeline-utils.js";

const sampleContexts = {
  product: { id: "prod_1", name: "Sample" },
  pricing: null,
  inventory: undefined,
  brand: { id: "brand_1", policy: "guarded" },
};

test("mergeContexts drops empty values", () => {
  const merged = mergeContexts(sampleContexts);
  assert.ok(merged.product);
  assert.ok(merged.brand);
  assert.ok(!("pricing" in merged));
  assert.ok(!("inventory" in merged));
});

test("buildPromptFromContexts keeps agent and task details", () => {
  const prompt = buildPromptFromContexts(
    "pricing-strategist",
    { input: { productId: "prod_1" }, message: "price check" },
    mergeContexts(sampleContexts),
    { expected: "json" },
  );
  assert.match(prompt, /pricing-strategist/);
  assert.match(prompt, /prod_1/);
});

test("safeTruncate marks truncated output", () => {
  const long = "x".repeat(9000);
  const truncated = safeTruncate(long, 1000);
  assert.ok(truncated.includes("truncated"));
});
