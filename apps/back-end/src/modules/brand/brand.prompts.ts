import type { BrandAIConfigResponse, BrandIdentityResponse, BrandRulesResponse } from "./brand.types.js";

export function buildIdentityPrompt(payload: {
  brandName: string;
  slug: string;
  description?: string | null;
  identity?: BrandIdentityResponse | null;
  rules?: BrandRulesResponse | null;
  aiConfig?: BrandAIConfigResponse | null;
  forceRegenerate?: boolean;
}) {
  const lines: string[] = [];
  lines.push("You are the MH-OS brand strategist. Provide concise, safe guidance.");
  lines.push(`Brand: ${payload.brandName} (${payload.slug})`);
  lines.push(`Description: ${payload.description ?? "Not provided"}`);
  lines.push(`Vision: ${payload.identity?.vision ?? "Not provided"}`);
  lines.push(`Mission: ${payload.identity?.mission ?? "Not provided"}`);
  lines.push(`Tone of Voice: ${payload.identity?.toneOfVoice ?? "Not provided"}`);
  lines.push(`Persona: ${payload.identity?.persona ?? "Not provided"}`);
  lines.push(`Keywords: ${payload.identity?.keywords ?? "Not provided"}`);
  lines.push(`Values: ${payload.identity?.values ?? "Not provided"}`);
  if (payload.rules) {
    lines.push("Guardrails:");
    lines.push(`- Naming: ${payload.rules.namingRules ?? "n/a"}`);
    lines.push(`- Marketing: ${payload.rules.marketingRules ?? "n/a"}`);
    lines.push(`- Restricted words: ${payload.rules.restrictedWords ?? "n/a"}`);
    lines.push(`- Allowed words: ${payload.rules.allowedWords ?? "n/a"}`);
    lines.push(`- AI restrictions: ${payload.rules.aiRestrictions ?? "n/a"}`);
  }
  if (payload.aiConfig) {
    lines.push("AI Persona:");
    lines.push(`- Personality: ${payload.aiConfig.aiPersonality ?? "n/a"}`);
    lines.push(`- Tone: ${payload.aiConfig.aiTone ?? "n/a"}`);
    lines.push(`- Content style: ${payload.aiConfig.aiContentStyle ?? "n/a"}`);
    lines.push(`- Pricing style: ${payload.aiConfig.aiPricingStyle ?? "n/a"}`);
    lines.push(`- Blocked topics: ${(payload.aiConfig.aiBlockedTopics ?? []).join(", ") || "n/a"}`);
  }
  if (payload.forceRegenerate) {
    lines.push("Force regenerate requested: true");
  }
  lines.push(
    "Output must start with 'Summary:' then 'Details:' describing tone guidance, keywords, and safety reminders. Do not include restricted words or blocked topics.",
  );
  return lines.join("\n");
}

export function buildRulesConsistencyPrompt(payload: {
  brandName: string;
  slug: string;
  rules: BrandRulesResponse | null;
  aiConfig?: BrandAIConfigResponse | null;
  identity?: BrandIdentityResponse | null;
  forceRegenerate?: boolean;
}) {
  const lines: string[] = [];
  lines.push("You are the MH-OS compliance reviewer. Evaluate brand rules for clarity and conflicts.");
  lines.push(`Brand: ${payload.brandName} (${payload.slug})`);
  const rules = payload.rules;
  lines.push(`Naming rules: ${rules?.namingRules ?? "Not provided"}`);
  lines.push(`Description rules: ${rules?.descriptionRules ?? "Not provided"}`);
  lines.push(`Marketing rules: ${rules?.marketingRules ?? "Not provided"}`);
  lines.push(`Discount rules: ${rules?.discountRules ?? "Not provided"}`);
  lines.push(`Pricing constraints: ${rules?.pricingConstraints ?? "Not provided"}`);
  lines.push(`Restricted words: ${rules?.restrictedWords ?? "Not provided"}`);
  lines.push(`Allowed words: ${rules?.allowedWords ?? "Not provided"}`);
  lines.push(`AI restrictions: ${rules?.aiRestrictions ?? "Not provided"}`);
  if (payload.aiConfig) {
    lines.push("AI Config:");
    lines.push(`- Blocked topics: ${(payload.aiConfig.aiBlockedTopics ?? []).join(", ") || "n/a"}`);
    lines.push(`- Enabled actions: ${(payload.aiConfig.aiEnabledActions ?? []).join(", ") || "n/a"}`);
  }
  if (payload.identity) {
    lines.push("Identity context:");
    lines.push(`- Tone: ${payload.identity.toneOfVoice ?? "n/a"}`);
    lines.push(`- Keywords: ${payload.identity.keywords ?? "n/a"}`);
  }
  if (payload.forceRegenerate) {
    lines.push("Force regenerate requested: true");
  }
  lines.push(
    "Return a short 'Summary:' line plus a bullet list under 'Details:' highlighting conflicts, missing guardrails, and unsafe areas. If restricted/blocked words appear, mark them as 'violation'.",
  );
  return lines.join("\n");
}
