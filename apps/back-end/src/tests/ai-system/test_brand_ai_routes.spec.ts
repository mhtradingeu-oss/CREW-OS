import assert from "node:assert/strict";
import test from "node:test";
import { router as brandRouter } from "../../modules/brand/brand.routes.js";
import { buildIdentityPrompt, buildRulesConsistencyPrompt } from "../../modules/brand/brand.prompts.js";

test("brand routes expose AI identity and rules endpoints", () => {
  const stack = (brandRouter as any).stack || [];
  const paths = stack
    .map((layer: any) => layer?.route?.path)
    .filter(Boolean);

  assert.ok(paths.includes("/:id/ai/identity"), "AI identity route should be registered");
  assert.ok(paths.includes("/:id/ai/rules"), "AI rules route should be registered");
});

test("identity prompt includes rules and AI config context", () => {
  const prompt = buildIdentityPrompt({
    brandName: "Acme",
    slug: "acme",
    description: "desc",
    identity: { brandId: "b1", toneOfVoice: "warm" } as any,
    rules: { namingRules: "short", restrictedWords: "ban" } as any,
    aiConfig: { aiPersonality: "helper", aiBlockedTopics: ["politics"] } as any,
  });

  assert.ok(prompt.includes("short"), "should include naming rules");
  assert.ok(prompt.includes("ban"), "should include restricted words");
  assert.ok(prompt.includes("helper"), "should include AI personality");
  assert.ok(prompt.includes("politics"), "should include blocked topics");
});

test("rules consistency prompt highlights guardrails", () => {
  const prompt = buildRulesConsistencyPrompt({
    brandName: "Acme",
    slug: "acme",
    rules: { marketingRules: "no claims", allowedWords: "eco" } as any,
    aiConfig: { aiBlockedTopics: ["medical"] } as any,
    identity: { toneOfVoice: "calm", keywords: "green" } as any,
  });

  assert.ok(prompt.includes("no claims"), "should include marketing rules");
  assert.ok(prompt.includes("eco"), "should include allowed words");
  assert.ok(prompt.includes("medical"), "should include AI blocked topics");
  assert.ok(prompt.includes("calm"), "should include identity tone");
});
