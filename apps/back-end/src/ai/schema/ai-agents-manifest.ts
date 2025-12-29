export type AgentContextRequirement = {
  name: string;
  builder: string;
  required: boolean;
  fields: string[];
};

export type AgentOutputFormat = {
  description: string;
  schema: Record<string, unknown>;
};

export type AgentSafetyRule = {
  permissions: string[];
  brandScoped?: boolean;
  tenantScoped?: boolean;
  blockedTopics?: string[];
  piiGuard?: boolean;
};

export type AgentBudgetProfile = {
  dailyLimit?: number;
  monthlyLimit?: number;
  currency?: string;
  alertThreshold?: number;
};

// Autonomy semantics:
// - viewer: read-only, analysis only. No side effects; may summarize, classify, or recommend next questions.
// - advisor: can propose drafts/recommendations; must not directly change state or message users.
// - operator: may request side-effectful actions but only within allowedActions, and should default to human approval.
export type AIAgentDefinition = {
  name: string;
  scope: string;
  role?: string; // يميز الدور داخل الدومين
  priority?: number; // ترتيب التوجيه
  model?: string;
  description: string;
  capabilities: string[];
  inputContexts: AgentContextRequirement[];
  output: AgentOutputFormat;
  safety: AgentSafetyRule;
  bootPrompt?: string;
  safetyRules?: string[];
  riskScore?: number;
  restrictedDomains?: string[];
  allowedActions?: string[];
  providerPreferences?: string[];
  defaultLocales?: string[];
  autonomyLevel?: AutonomyLevel;
  requiredContexts?: string[];
  defaultModel?: string;
  fallbackModels?: string[];
  budgetProfile?: AgentBudgetProfile;
};

export type AIAgentManifestSeed = Omit<AIAgentDefinition, "autonomyLevel"> & {
  autonomyLevel?: AutonomyLevelInput;
};

import { logger } from "../../core/logger.js";
import {
  AutonomyLevel,
  AutonomyLevelInput,
  DEFAULT_AUTONOMY_LEVEL,
  normalizeAutonomyLevel,
  ALLOWED_PRIORITY_ONE_LEVELS,
} from "../../core/ai/autonomy/autonomy-levels.js";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_FALLBACK_MODELS = ["gpt-3.5-turbo"];
const DEFAULT_ALLOWED_ACTIONS = ["analyze", "summarize", "recommend", "draft"];
const DEFAULT_BUDGET: AgentBudgetProfile = { dailyLimit: 1, monthlyLimit: 20, currency: "USD", alertThreshold: 0.75 };
const DEFAULT_RISK_SCORE = 35;

const CANONICAL_SCOPE_MAP: Record<string, string> = {
  pricing: "pricing",
  price: "pricing",
  competitor: "competitor",
  product: "product",
  marketing: "marketing",
  crm: "crm",
  sales: "sales",
  inventory: "inventory",
  finance: "finance",
  partner: "partner",
  dealer: "dealer",
  stand: "stand",
  loyalty: "loyalty",
  automation: "automation",
  insight: "insight",
  reporting: "reporting",
  kpi: "kpi",
  support: "support",
  notification: "notification",
  media: "media",
  influencer: "influencer",
  social: "social",
  voice: "voice",
  operations: "operations",
  knowledge: "knowledge",
  governance: "governance",
};

function canonicalizeScope(scope: string) {
  return CANONICAL_SCOPE_MAP[scope] ?? scope;
}

function buildBootPrompt(agent: AIAgentDefinition): string {
  const tone = agent.scope.includes("governance") ? "formal, risk-aware" : "concise, ops-first";
  const safety = (agent.safetyRules ?? agent.safety.blockedTopics ?? []).join("; ") || "Follow policy, no side effects";
  const responsibilities = agent.capabilities.join("; ");
  const scopeLine = `OS scope: ${canonicalizeScope(agent.scope)} | Autonomy: ${normalizeAutonomyLevel(agent.autonomyLevel)}`;
  return [
    `Role: ${agent.name}. Tone: ${tone}.`,
    `Responsibilities: ${responsibilities}.`,
    scopeLine,
    `Safety: ${safety}. Respect brand/tenant isolation and RBAC.`,
    "Always prefer deterministic JSON aligned to the declared output schema. Escalate uncertainty to human reviewers.",
  ].join(" ");
}

const BASE_AI_AGENTS_MANIFEST: AIAgentManifestSeed[] = [
  {
    name: "product-qa",
    scope: "product",
    description: "Understands product specs, compliance and positioning.",
    // Product intelligence fallback; defers to the product manager for final decisions.
    priority: 2,
    capabilities: [
      "Answer product and SKU level questions",
      "Summarize competitive positioning",
      "Highlight missing specs or compliance risks",
    ],
    inputContexts: [
      { name: "product", builder: "buildProductContext", required: true, fields: ["entity", "signals"] },
      { name: "pricing", builder: "buildPricingContext", required: false, fields: ["related.pricing", "signals.spread"] },
      { name: "inventory", builder: "buildInventoryContext", required: false, fields: ["inventory", "signals.stockRisk"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Structured product intel for downstream AI agents",
      schema: {
        summary: "string",
        risks: ["string"],
        recommendedActions: ["string"],
        sources: ["context:product", "context:pricing", "context:inventory"],
      },
    },
    safety: {
      permissions: ["ai:context:product"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["leaking private supplier terms", "sharing unrelated tenant data"],
    },
  },
  {
    name: "pricing-strategist",
    scope: "pricing",
    description: "Generates price moves, rationales, and guardrails.",
    // Primary pricing strategist owning rationales and approvals; enforces guardrails before any change.
    priority: 1,
    capabilities: [
      "Recommend prices per channel",
      "Explain price moves with drivers",
      "Detect competitor pressure and margin risk",
    ],
    inputContexts: [
      { name: "pricing", builder: "buildPricingContext", required: true, fields: ["entity", "related.aiHistory"] },
      { name: "product", builder: "buildProductContext", required: true, fields: ["entity", "signals.competitorPressure"] },
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["brand", "policies"] },
      { name: "inventory", builder: "buildInventoryContext", required: false, fields: ["signals"] },
    ],
    output: {
      description: "Price recommendation with risk flags",
      schema: {
        recommendation: { priceNet: "number", priceGross: "number", channel: "string" },
        rationale: "string",
        risks: ["string"],
        confidence: "number",
      },
    },
    safety: {
      permissions: ["ai:context:pricing"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: [
        "non-public partner discounts",
        "commit price changes without human approval",
        "write directly to pricing or product models",
      ],
    },
  },
  {
    name: "competitor-engine",
    scope: "competitor",
    description: "Benchmarks competitor positioning and price pressure.",
    // Primary competitor scope agent; owns differentiation analysis and signals marketing/price guardrails.
    priority: 1,
    capabilities: [
      "Summarize competitor pricing",
      "Suggest price moves",
      "Highlight differentiation levers",
    ],
    inputContexts: [
      { name: "product", builder: "buildProductContext", required: true, fields: ["entity", "related.competitorPrices", "signals.competitorPressure"] },
      { name: "pricing", builder: "buildPricingContext", required: false, fields: ["entity", "related.competitorPrices", "related.aiHistory"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand", "policies"] },
    ],
    output: {
      description: "Competitor response plan",
      schema: {
        positioning: "string",
        recommendations: ["string"],
        pricingMoves: [{ channel: "string", action: "string", target: "number" }],
      },
    },
    safety: {
      permissions: ["ai:context:product"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["disclosing confidential partner terms"],
    },
  },
  {
    name: "inventory-optimizer",
    scope: "inventory",
    description: "Balances stock with demand and refill cadence.",
    // Primary inventory agent; guards replenishment decisions and feeds fulfillment alerts to ops.
    priority: 1,
    capabilities: ["Spot low stock", "Recommend transfers or refills", "Summarize warehouse health"],
    inputContexts: [
      { name: "inventory", builder: "buildInventoryContext", required: true, fields: ["inventory", "signals.lowStock"] },
      { name: "product", builder: "buildProductContext", required: false, fields: ["entity", "related.competitorPrices"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Inventory move set",
      schema: {
        lowStock: [{ productId: "string", quantity: "number" }],
        transfers: [{ from: "string", to: "string", quantity: "number" }],
        notes: "string",
      },
    },
    safety: {
      permissions: ["ai:context:inventory"],
      brandScoped: true,
      blockedTopics: ["sharing other brands' quantities"],
      piiGuard: true,
    },
  },
  {
    name: "crm-coach",
    scope: "crm",
    description: "Coaches next best actions for leads and clients.",
    // Primary CRM advisor responsible for tone, escalation, and avoiding governance bypass.
    priority: 1,
    capabilities: ["Summarize lead health", "Propose follow-ups", "Generate templated outreach"],
    inputContexts: [
      { name: "crm-client", builder: "buildCRMClientContext", required: true, fields: ["lead", "signals.score", "related.tasks"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Next best action plan",
      schema: {
        summary: "string",
        nextActions: [{ type: "string", description: "string", dueBy: "string" }],
        emailDrafts: [{ subject: "string", body: "string" }],
      },
    },
    safety: {
      permissions: ["ai:context:crm"],
      brandScoped: true,
      piiGuard: true,
    },
  },
  {
    name: "partner-ops",
    scope: "partner",
    description: "Understands partner, dealer and stand footprint.",
    // Primary partner steward; keeps escalations in the partner ops channel and avoids unauthorized overrides.
    priority: 1,
    capabilities: ["Summarize partner health", "Highlight SLA or kpi gaps", "Recommend engagement steps"],
    inputContexts: [
      { name: "partner", builder: "buildPartnerContext", required: true, fields: ["partner", "signals.performance"] },
      { name: "stand", builder: "buildInventoryContext", required: false, fields: ["inventory", "signals.lowStock"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Partner health report",
      schema: {
        summary: "string",
        kpis: [{ name: "string", value: "number" }],
        recommendations: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:partner"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: [
        "change partner tiering without approval",
        "write directly to partner or dealer models",
      ],
    },
  },
  {
    name: "sales-rep-copilot",
    scope: "sales",
    description: "Coaches sales reps on routes, tasks, and targets.",
    // Primary sales copilot; owns route planning, escalation, and defers to governance for approvals.
    priority: 1,
    capabilities: ["Prioritize tasks", "Summarize pipeline", "Draft visit plans"],
    inputContexts: [
      { name: "sales-rep", builder: "buildSalesRepContext", required: true, fields: ["rep", "signals", "targets"] },
      { name: "crm-client", builder: "buildCRMClientContext", required: false, fields: ["lead", "related.deals"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Daily plan",
      schema: {
        prioritizedTasks: [{ taskId: "string", summary: "string" }],
        routeNotes: ["string"],
        risks: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:sales"],
      brandScoped: true,
      piiGuard: true,
    },
  },
  {
    name: "loyalty-analyst",
    scope: "loyalty",
    description: "Explains loyalty engagement and proposes nudges.",
    // Primary loyalty analyst; surfaces churn risks and routes approvals through governance.
    priority: 1,
    capabilities: ["Summarize account health", "Recommend earn/burn actions", "Detect churn risk"],
    inputContexts: [
      { name: "loyalty-account", builder: "buildLoyaltyAccountContext", required: true, fields: ["account", "signals.points", "transactions"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Loyalty action set",
      schema: {
        summary: "string",
        riskLevel: "string",
        nudges: [{ channel: "string", message: "string" }],
      },
    },
    safety: {
      permissions: ["ai:context:loyalty"],
      brandScoped: true,
      piiGuard: true,
    },
  },
  {
    name: "automation-reviewer",
    scope: "automation",
    description: "Validates automation rules before execution.",
    // Primary automation validation agent; comments on safety and escalates before automation executes.
    priority: 1,
    capabilities: ["Summarize rule intent", "Flag risky actions", "Recommend tests"],
    inputContexts: [
      { name: "automation", builder: "buildAutomationContext", required: true, fields: ["rule", "signals"] },
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["health", "incidents"] },
    ],
    output: {
      description: "Automation review output",
      schema: {
        summary: "string",
        risks: ["string"],
        testPlan: ["string"],
        goNoGo: "boolean",
      },
    },
    safety: {
      permissions: ["ai:context:automation"],
      brandScoped: true,
      piiGuard: true,
    },
  },
  {
    name: "insight-reporter",
    scope: "insight",
    description: "Narrates AI insights and learning journals to humans.",
    // Primary insight narrator; owns signal tone and routes risks through governance.
    priority: 1,
    capabilities: ["Summarize recent AI insights", "Explain confidence", "Route follow-up tasks"],
    inputContexts: [
      { name: "ai-insight", builder: "buildAIInsightContext", required: true, fields: ["insight"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Insight digest",
      schema: {
        summary: "string",
        confidence: "number",
        followUps: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:insight"],
      brandScoped: true,
      piiGuard: true,
    },
  },
  {
    name: "campaign-engine",
    scope: "marketing",
    description: "Designs and optimizes multi-channel campaigns",
    // Primary marketing campaign engine; ensures tone and escalations stay within governance and communications channels.
    priority: 1,
    capabilities: ["Summarize active campaigns", "Recommend creative experiments", "Adjust budgets by channel"],
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["brand", "policies"] },
      { name: "marketing", builder: "buildMarketingContext", required: true, fields: ["campaignsSummary", "socialSignals", "audiences"] },
      { name: "product", builder: "buildProductContext", required: false, fields: ["entity", "signals"] },
    ],
    output: {
      description: "Campaign optimization plan",
      schema: {
        summary: "string",
        experiments: [{ channel: "string", hypothesis: "string", metric: "string" }],
        budgetMoves: [{ channel: "string", delta: "number" }],
      },
    },
    safety: {
      permissions: ["ai:context:marketing"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: [
        "launching campaigns without approval",
        "adjust marketing spend without approval",
        "write directly to campaign budgets",
      ],
    },
  },
  {
    name: "margin-engine",
    scope: "finance",
    description: "Assesses margin and runway using finance signals",
    // Margin snapshot fallback; defers to the finance control tower before any recommendations.
    priority: 2,
    capabilities: ["Summarize revenue vs expenses", "Surface margin risks", "Recommend channel allocations"],
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["brand"] },
      { name: "finance", builder: "buildFinanceContext", required: true, fields: ["revenueSummary", "marginSummary"] },
      { name: "pricing", builder: "buildPricingContext", required: false, fields: ["entity", "signals"] },
      { name: "inventory", builder: "buildInventoryContext", required: false, fields: ["signals"] },
    ],
    output: {
      description: "Margin and runway snapshot",
      schema: {
        summary: "string",
        risks: ["string"],
        allocations: [{ channel: "string", action: "string" }],
      },
    },
    safety: {
      permissions: ["ai:context:finance"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: [
        "commit financial transactions",
        "act on finance predictions without human approval",
        "write directly to finance ledgers",
      ],
    },
  },
  {
    name: "EINVOICE_ENGINE",
    scope: "finance",
    description: "Generates and validates EU/German compliant e-invoice XML (XRechnung, ZUGFeRD, PEPPOL pre-checks)",
    // Invoice validation fallback; escalates to finance control tower for approval before transmission.
    priority: 2,
    capabilities: [
      "XRECHNUNG_XML",
      "ZUGFERD_XML",
      "VALIDATE_XML",
      "PEPPOL_PRECHECK",
    ],
    inputContexts: [
      { name: "invoice", builder: "buildInvoiceContext", required: true, fields: ["invoice", "items", "brand"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand", "policies"] },
      { name: "finance", builder: "buildFinanceContext", required: false, fields: ["revenueSummary", "marginSummary"] },
    ],
    output: {
      description: "Structured XML + validation results",
      schema: {
        xml: "string",
        validated: "boolean",
        validationErrors: ["string"],
        reasoning: "string",
      },
    },
    safety: {
      permissions: ["ai:context:finance"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: [
        "modify invoice totals",
        "auto-approve invoices beyond policy limits",
        "send via PEPPOL without approval",
      ],
    },
  },
  {
    name: "whitelabel-engine",
    scope: "white-label",
    description: "Designs white-label concepts, pricing and profitability outlooks",
    // Primary white-label agent linking creative/media governance to profitability; enforces approvals before rollout.
    priority: 1,
    capabilities: ["Propose white-label concepts", "Draft WL pricing", "Estimate WL profitability"],
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["brand", "policies"] },
      { name: "marketing", builder: "buildMarketingContext", required: false, fields: ["campaignsSummary", "audiences"] },
      { name: "pricing", builder: "buildPricingContext", required: false, fields: ["entity", "signals"] },
    ],
    output: {
      description: "White-label plan",
      schema: {
        concept: "string",
        pricing: [{ model: "string", price: "number", currency: "string" }],
        profitability: "string",
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["commit pricing without approval"],
    },
  },
  {
    name: "AI_MEDIA_CREATOR",
    scope: "media",
    description: "Plans and generates safe media assets across image and video",
    // Primary media conductor coordinating communications moderation (AI_PR_GUARDIAN) before assets go live.
    priority: 1,
    capabilities: ["MEDIA_IMAGE", "MEDIA_VIDEO", "WHITE_LABEL"],
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand", "policies"] },
      { name: "product", builder: "buildProductContext", required: false, fields: ["entity", "signals"] },
    ],
    output: {
      description: "Media generation summary",
      schema: { assets: [{ url: "string", kind: "string", provider: "string" }], notes: "string" },
    },
    safety: {
      permissions: ["ai:context:brand", "ai:context:media"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["nsfw", "violence", "weapons", "politics", "bypass communications moderation"],
    },
    safetyRules: ["No NSFW", "No violence", "No third-party logos without permission"],
    riskScore: 30,
    restrictedDomains: ["politics", "adult", "weapons"],
    allowedActions: ["SUGGEST_ONLY", "GENERATE_PREVIEW"],
    providerPreferences: ["sdxl-http", "sdxl-local", "canva-style-mockup"],
  },
  {
    name: "AI_IMAGE_DESIGNER",
    scope: "media",
    description: "Specializes in on-brand product imagery and mockups",
    // Media fallback focused on imagery that honors communications moderation and waits for governance approval.
    priority: 2,
    capabilities: ["MEDIA_IMAGE", "WHITE_LABEL"],
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["brand", "policies", "identity"] },
      { name: "product", builder: "buildProductContext", required: false, fields: ["entity"] },
    ],
    output: {
      description: "Image generation response",
      schema: { previewUrls: ["string"], provider: "string", style: "string" },
    },
    safety: {
      permissions: ["ai:context:media"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["nsfw", "logos of other brands", "publish without media conductor approval"],
    },
    safetyRules: ["Do not use third-party logos", "Avoid sensitive domains"],
    riskScore: 25,
    restrictedDomains: ["politics", "adult", "weapons"],
    allowedActions: ["SUGGEST_ONLY", "GENERATE_PREVIEW"],
    providerPreferences: ["sdxl-http", "openai-images", "canva-style-mockup"],
  },
  {
    name: "AI_VIDEO_PRODUCER",
    scope: "media",
    description: "Produces safe short-form product videos and teasers",
    // Media fallback for video previews; defers to AI_MEDIA_CREATOR and communications moderation before release.
    priority: 2,
    capabilities: ["MEDIA_VIDEO"],
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["brand", "policies"] },
      { name: "product", builder: "buildProductContext", required: false, fields: ["entity"] },
    ],
    output: {
      description: "Video generation response",
      schema: { previewUrl: "string", provider: "string", aspectRatio: "string" },
    },
    safety: {
      permissions: ["ai:context:media"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["nsfw", "violence"],
    },
    safetyRules: ["No unsafe scenes", "No politics"],
    riskScore: 35,
    restrictedDomains: ["politics", "adult", "weapons"],
    allowedActions: ["SUGGEST_ONLY", "GENERATE_PREVIEW"],
    providerPreferences: ["stable-video", "replicate-video", "placeholder-sora"],
  },
  {
    name: "AI_WHITE_LABEL_ASSISTANT",
    scope: "white-label",
    description: "Assists in white-label packaging mockups and brand-safe previews",
    capabilities: ["WHITE_LABEL", "MEDIA_IMAGE"],
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["brand", "policies", "identity"] },
      { name: "product", builder: "buildProductContext", required: false, fields: ["entity"] },
    ],
    output: {
      description: "White-label preview set",
      schema: { previews: [{ url: "string", surface: "string" }], recipe: "object" },
    },
    safety: {
      permissions: ["ai:context:brand", "ai:context:media"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["third-party logos", "political messaging", "nsfw"],
    },
    safetyRules: ["No third-party logos", "No NSFW"],
    riskScore: 30,
    restrictedDomains: ["politics", "adult", "weapons"],
    allowedActions: ["SUGGEST_ONLY", "GENERATE_PREVIEW"],
    providerPreferences: ["sdxl-http", "canva-style-mockup"],
  },
  {
    name: "governance-engine",
    scope: "governance",
    description: "Validates AI actions against brand policies and ops health",
    // Primary governance sentinel; this validator owns compliance gating and documents authority boundaries with ops.
    priority: 1,
    capabilities: [
      "Check policy compliance",
      "Detect risky actions",
      "Require approvals",
      "GOVERNANCE_VALIDATOR",
      "Stop direct model writes",
    ],
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["brand", "policies"] },
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["health", "incidents"] },
    ],
    output: {
      description: "Governance validation result",
      schema: {
        safeToProceed: "boolean",
        violations: ["string"],
        requiredApprovals: ["string"],
        notes: "string",
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: [
        "execute actions without approval",
        "directly modify business models",
        "bypass human-in-the-loop governance",
      ],
    },
  },
  {
    name: "support-engine",
    scope: "support",
    description: "Resolves tickets using history and knowledge base",
    // Primary support orchestrator; owns tone, deterministic escalations, and hands off execution to governed partners.
    priority: 1,
    capabilities: ["Summarize conversation", "Propose responses", "Escalate with rationale"],
    inputContexts: [
      { name: "support", builder: "buildSupportContext", required: true, fields: ["ticket", "messages"] },
      { name: "knowledge", builder: "buildKnowledgeBaseContext", required: false, fields: ["document"] },
      { name: "crm", builder: "buildCRMClientContext", required: false, fields: ["lead", "related"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Support response plan",
      schema: {
        summary: "string",
        reply: "string",
        nextActions: [{ type: "string", owner: "string", dueBy: "string" }],
      },
    },
    safety: {
      permissions: ["ai:context:support"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["commit refunds", "bypass support governance"],
    },
    allowedActions: ["summarize", "recommend"],
    // Ensures deterministic routing: human-approved escalation paths and logging before any action.
  },
  {
    name: "kb-engine",
    scope: "knowledge",
    description: "Finds and summarizes knowledge documents",
    // Primary knowledge resolver; controls summaries/tone and routes complex questions into the autonomy review chain.
    priority: 1,
    capabilities: ["Retrieve relevant docs", "Summarize content", "Surface related entities"],
    inputContexts: [
      { name: "knowledge", builder: "buildKnowledgeBaseContext", required: true, fields: ["document", "relatedEntities"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["auditHighlights"] },
    ],
    output: {
      description: "Knowledge answer",
      schema: {
        summary: "string",
        citations: [{ id: "string", title: "string" }],
        followUps: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:kb"],
      brandScoped: true,
      piiGuard: true,
    },
    allowedActions: ["summarize"],
  },
  {
    name: "autonomy-engine",
    scope: "autonomy",
    description: "Coordinates detections, planners, and governance checks for autonomy loops.",
    // Primary autonomy orchestration node; priority is fixed by governance/safety and the agent cannot self-promote its authority.
    priority: 1,
    capabilities: ["AUTONOMY_ENGINE", "TASK_PLANNER", "GOVERNANCE_VALIDATOR"],
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand", "policies"] },
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["health", "incidents"] },
    ],
    output: {
      description: "Autonomy orchestration plan",
      schema: {
        nextTasks: [{ goal: "string", engine: "string", requiresApproval: "boolean" }],
        risks: ["string"],
        approvals: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: [
        "directly execute actions",
        "write to business models",
        "commit price changes without approval",
        "adjust marketing spend automatically",
        "change partner tiers automatically",
        "execute finance actions without approval",
        "self-promote priority level",
      ],
    },
    allowedActions: ["recommend", "summarize"],
  },
  {
    name: "task-planner",
    scope: "task-planner",
    description: "Translates detections into ordered AI tasks with dependencies and approvals.",
    // Primary task-planner; never executes and always marks which approvals are required before handing off work.
    priority: 1,
    capabilities: ["TASK_PLANNER", "AUTONOMY_ENGINE"],
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand", "policies"] },
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["health"] },
    ],
    output: {
      description: "Structured autonomy task list",
      schema: {
        tasks: [{ taskId: "string", goal: "string", engine: "string", approval: "boolean" }],
        dependencies: [{ from: "string", to: "string" }],
        safetyNotes: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: [
        "write to any business model",
        "execute tasks without approval",
        "bypass governance checks",
      ],
    },
    allowedActions: ["recommend", "summarize"],
  },
  {
    name: "AI_SUPPORT_AGENT",
    scope: "support",
    description: "Answers customer support requests across channels with safety and brand context.",
    // Support fallback tied to support-engine’s deterministic routing; only follows the governed plan.
    priority: 2,
    capabilities: ["SUPPORT_REPLY", "TICKET_TAGGING", "ESCALATION_SUGGESTION"],
    inputContexts: [
      { name: "support", builder: "buildSupportContext", required: false, fields: ["ticket", "messages"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand", "policies"] },
      { name: "knowledge", builder: "buildKnowledgeBaseContext", required: false, fields: ["document"] },
    ],
    output: {
      description: "Support answer with actions",
      schema: {
        answer: "string",
        suggestedActions: ["string"],
        language: "string",
      },
    },
    safety: {
      permissions: ["ai:context:support"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["share payment info", "reset credentials"],
    },
    restrictedDomains: ["payments"],
    allowedActions: ["create_ticket", "add_internal_note", "handoff_to_human"],
    providerPreferences: ["gpt-4o"],
    defaultLocales: ["en", "de", "ar"],
  },
  {
    name: "AI_KB_ASSISTANT",
    scope: "support-kb",
    description: "Retrieves knowledge base answers for support.",
    // Primary support-kb agent; deterministic knowledge retrieval tied to support governance.
    priority: 1,
    capabilities: ["KB_RETRIEVAL", "KB_SUMMARY"],
    inputContexts: [
      { name: "knowledge", builder: "buildKnowledgeBaseContext", required: true, fields: ["document", "tags"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Knowledge grounded reply",
      schema: {
        answer: "string",
        sources: ["string"],
        confidence: "number",
      },
    },
    safety: {
      permissions: ["ai:context:kb"],
      brandScoped: true,
      piiGuard: true,
    },
    allowedActions: ["read"],
    defaultLocales: ["en", "de", "ar"],
  },
  {
    name: "AI_TICKET_ROUTER",
    scope: "support-router",
    description: "Classifies support tickets for routing and escalation.",
    // Primary support-router controlling deterministic routing logic and escalation triggers.
    priority: 1,
    capabilities: ["CLASSIFY_TOPIC", "SET_URGENCY", "ROUTE_OWNER"],
    inputContexts: [
      { name: "support", builder: "buildSupportContext", required: false, fields: ["ticket", "messages"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Routing decision",
      schema: {
        topic: "string",
        urgency: "string",
        sentiment: "string",
        suggestedOwner: "string",
        escalationNeeded: "boolean",
        language: "string",
      },
    },
    safety: {
      permissions: ["ai:context:support"],
      brandScoped: true,
      piiGuard: true,
    },
    allowedActions: ["assign", "add_internal_note"],
    defaultLocales: ["en", "de", "ar"],
    // Routing determinism: always check urgency/sentiment before escalating to support-engine.
  },
  {
    name: "AI_VOICE_IVR",
    scope: "voice-ivr",
    description: "Conversational IVR assistant for voice channels.",
    // Primary voice-ivr agent; defers to communications (AI_PR_GUARDIAN) for tone/safety and never bypasses moderation.
    priority: 1,
    capabilities: ["VOICE_INTENT", "COLLECT_INFO", "HANDOFF"],
    inputContexts: [
      { name: "support", builder: "buildSupportContext", required: false, fields: ["ticket", "messages"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand", "policies"] },
    ],
    output: {
      description: "Voice turn response",
      schema: {
        replyText: "string",
        actions: ["string"],
        language: "string",
      },
    },
    safety: {
      permissions: ["ai:context:support"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["payment collection", "credential reset", "bypass communications moderation"],
    },
    allowedActions: ["handoff_to_human", "create_ticket"],
    restrictedDomains: ["payments"],
    providerPreferences: ["gpt-4o", "gpt-4-turbo"],
    defaultLocales: ["en", "de", "ar"],
  },
  {
    name: "AI_VOICE_SUMMARIZER",
    scope: "voice-summary",
    description: "Summarizes voice sessions and extracts tags/sentiment.",
    // Primary voice-summary agent tied to communications tone and escalation flow; non-executable.
    priority: 1,
    capabilities: ["VOICE_SUMMARY", "VOICE_TAGGING"],
    inputContexts: [
      { name: "support", builder: "buildSupportContext", required: false, fields: ["ticket", "messages"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Voice session summary",
      schema: {
        summary: "string",
        sentiment: "string",
        tags: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:support"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["bypass communications moderation"],
    },
    allowedActions: ["add_internal_note"],
    defaultLocales: ["en", "de", "ar"],
  },
];

const PERSONA_AGENTS: AIAgentManifestSeed[] = [
  {
    name: "Executive",
    scope: "executive",
    description: "Condenses cross-domain signals for leadership with risk-aware options.",
    // Primary executive agent since it owns the cross-domain briefing narrative and explicit risk-aware options set for leaders.
    priority: 1,
    capabilities: ["Executive briefing", "Cross-domain synthesis", "Risk surfaced options"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["brand", "policies"] },
      { name: "finance", builder: "buildFinanceContext", required: false, fields: ["revenueSummary", "marginSummary"] },
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["health", "incidents"] },
    ],
    requiredContexts: ["brand", "finance", "operations"],
    output: {
      description: "Board-ready narrative with options",
      schema: {
        headline: "string",
        options: [{ option: "string", upside: "string", risk: "string" }],
        blockers: ["string"],
        nextSteps: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["personnel actions", "legal advice"],
    },
    safetyRules: ["Keep actions non-binding", "Flag gaps in data"],
    riskScore: 30,
    restrictedDomains: ["hr", "legal"],
    allowedActions: ["summarize", "recommend"],
    defaultModel: "gpt-4o",
    fallbackModels: ["gpt-4o-mini"],
    budgetProfile: { dailyLimit: 3, monthlyLimit: 60, currency: "EUR", alertThreshold: 0.8 },
  },
  {
    name: "AI_CEO",
    scope: "executive",
    description: "Growth-first CEO perspective with revenue, runway, and competitive moves.",
    capabilities: ["Revenue moves", "Runway guardrails", "Competitive response"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["brand", "policies"] },
      { name: "finance", builder: "buildFinanceContext", required: true, fields: ["revenueSummary", "marginSummary"] },
      { name: "pricing", builder: "buildPricingContext", required: false, fields: ["signals", "entity"] },
      { name: "marketing", builder: "buildMarketingContext", required: false, fields: ["campaignsSummary", "audiences"] },
    ],
    requiredContexts: ["brand", "finance"],
    output: {
      description: "CEO-ready summary",
      schema: {
        thesis: "string",
        growthMoves: [{ move: "string", expectedImpact: "string" }],
        runway: "string",
        risks: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:finance"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["irreversible org changes"],
    },
    safetyRules: ["Never commit spend", "Do not alter pricing"],
    riskScore: 35,
    restrictedDomains: ["personnel", "legal"],
    allowedActions: ["recommend", "summarize"],
    defaultModel: "gpt-4o",
    fallbackModels: ["gpt-4o-mini"],
    budgetProfile: { dailyLimit: 4, monthlyLimit: 90, currency: "EUR", alertThreshold: 0.8 },
  },
  {
    name: "AI_CFO",
    scope: "finance",
    description: "Finance control tower with margin, cash, and compliance checks.",
    // Primary finance control tower aligning budgets with governance before any spend change.
    priority: 1,
    capabilities: ["Runway scenario", "Budget guardrails", "Variance analysis"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "finance", builder: "buildFinanceContext", required: true, fields: ["revenueSummary", "marginSummary"] },
      { name: "pricing", builder: "buildPricingContext", required: false, fields: ["signals", "entity"] },
      { name: "inventory", builder: "buildInventoryContext", required: false, fields: ["signals"] },
    ],
    requiredContexts: ["finance"],
    output: {
      description: "Finance snapshot",
      schema: {
        runwayMonths: "number",
        marginHotspots: ["string"],
        spendAlerts: ["string"],
        approvalsNeeded: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:finance"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["execute payments", "change ledgers"],
    },
    safetyRules: ["No journal changes", "Human approval for payments"],
    riskScore: 38,
    restrictedDomains: ["payments"],
    allowedActions: ["recommend", "summarize"],
    defaultModel: "gpt-4o",
    fallbackModels: ["gpt-4o-mini"],
    budgetProfile: { dailyLimit: 2, monthlyLimit: 50, currency: "EUR", alertThreshold: 0.75 },
  },
  {
    name: "AI_CMO",
    scope: "marketing",
    description: "CMO copilot for channel mix, creative bets, and brand safety.",
    capabilities: ["Channel mix", "Creative prompts", "Brand guardrails"],
    autonomyLevel: "copilot",
    inputContexts: [
      { name: "marketing", builder: "buildMarketingContext", required: true, fields: ["campaignsSummary", "audiences"] },
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["brand", "policies"] },
      { name: "product", builder: "buildProductContext", required: false, fields: ["entity", "signals"] },
    ],
    requiredContexts: ["marketing", "brand"],
    output: {
      description: "Marketing move list",
      schema: {
        priorities: [{ channel: "string", move: "string", budgetHint: "number" }],
        creativeAngles: ["string"],
        risks: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:marketing"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["politics", "unsafe creative"],
    },
    safetyRules: ["No spend commitment", "Respect brand voice"],
    riskScore: 32,
    restrictedDomains: ["politics", "nsfw"],
    allowedActions: ["recommend", "draft"],
    defaultModel: "gpt-4o",
    fallbackModels: ["gpt-4o-mini", "claude-3-5-sonnet"],
    budgetProfile: { dailyLimit: 3, monthlyLimit: 70, currency: "EUR", alertThreshold: 0.75 },
  },
  {
    name: "AI_COO",
    scope: "operations",
    description: "COO view on supply, fulfillment, and SLAs with exceptions surfaced.",
    // Primary operations agent because it centralizes supply, fulfillment, and SLA oversight with explicit mitigation guidance.
    priority: 1,
    capabilities: ["Ops risks", "Fulfillment alerts", "Capacity forecast"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["health", "incidents"] },
      { name: "inventory", builder: "buildInventoryContext", required: false, fields: ["signals"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    requiredContexts: ["operations"],
    output: {
      description: "Ops digest",
      schema: {
        hotspots: ["string"],
        mitigations: ["string"],
        slaRisks: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["change SLAs"],
    },
    safetyRules: ["No direct changes to SLAs"],
    riskScore: 28,
    restrictedDomains: ["personnel"],
    allowedActions: ["summarize", "recommend"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 2, monthlyLimit: 40, currency: "EUR", alertThreshold: 0.7 },
  },
  {
    name: "AI_CSO",
    scope: "security",
    description: "Security strategist focusing on threats, access hygiene, and posture.",
    // Primary security agent because it owns threat, access, and posture narratives with explicit mitigation/safety duties.
    priority: 1,
    capabilities: ["Threat surfacing", "Policy alignment", "Vulnerability summary"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "operations", builder: "buildOperationsContext", required: true, fields: ["incidents", "health"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["policies"] },
    ],
    requiredContexts: ["operations"],
    output: {
      description: "Security snapshot",
      schema: {
        alerts: ["string"],
        posture: "string",
        actions: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["credential changes"],
    },
    safetyRules: ["Never alter access"],
    riskScore: 42,
    restrictedDomains: ["auth"],
    allowedActions: ["recommend"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 1, monthlyLimit: 25, currency: "EUR", alertThreshold: 0.6 },
  },
  {
    name: "AI_RISK_OFFICER",
    scope: "risk",
    description: "Risk lens across finance, ops, and AI safety budgets.",
    // Primary risk agent because it unifies finance, ops, and AI safety risk registers with explicit budget guardrails.
    priority: 1,
    capabilities: ["Risk register", "Budget guardrails", "AI safety flags"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "finance", builder: "buildFinanceContext", required: false, fields: ["marginSummary"] },
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["incidents"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    requiredContexts: ["finance", "operations"],
    output: {
      description: "Risk control set",
      schema: {
        register: [{ area: "string", risk: "string", owner: "string" }],
        budgetAlerts: ["string"],
        mitigations: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:finance"],
      brandScoped: true,
      piiGuard: true,
    },
    safetyRules: ["Do not approve spend", "Flag data gaps"],
    riskScore: 36,
    restrictedDomains: ["legal"],
    allowedActions: ["recommend", "summarize"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 2, monthlyLimit: 35, currency: "EUR", alertThreshold: 0.65 },
  },
  {
    name: "AI_PRODUCT_MANAGER",
    scope: "product",
    description: "Backlog, discovery, and launch-readiness guardrails for product teams.",
    // Primary product manager overseeing priorities and routing risks through governance before release.
    priority: 1,
    capabilities: ["Prioritize backlog", "Discovery synthesis", "Release checklist"],
    autonomyLevel: "copilot",
    inputContexts: [
      { name: "product", builder: "buildProductContext", required: true, fields: ["entity", "signals"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
      { name: "marketing", builder: "buildMarketingContext", required: false, fields: ["campaignsSummary"] },
    ],
    requiredContexts: ["product"],
    output: {
      description: "Product plan",
      schema: {
        priorities: ["string"],
        userStories: [{ title: "string", acceptance: "string" }],
        launchRisks: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:product"],
      brandScoped: true,
      piiGuard: true,
    },
    safetyRules: ["No auto changes to backlog"],
    riskScore: 26,
    restrictedDomains: ["legal"],
    allowedActions: ["recommend", "draft"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 2, monthlyLimit: 45, currency: "EUR", alertThreshold: 0.7 },
  },
  {
    name: "AI_INNOVATION_AGENT",
    scope: "product",
    description: "Searches for novel experiments, guardrails, and adjacent opportunities.",
    // Product innovation fallback; routes ideas through the primary product manager before any shift.
    priority: 2,
    capabilities: ["Blue-sky ideas", "Experiment scaffolds", "Signal collection"],
    autonomyLevel: "copilot",
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand", "policies"] },
      { name: "marketing", builder: "buildMarketingContext", required: false, fields: ["audiences"] },
    ],
    requiredContexts: ["brand"],
    output: {
      description: "Innovation backlog",
      schema: {
        ideas: [{ title: "string", rationale: "string", risk: "string" }],
        pilots: [{ scope: "string", effort: "string" }],
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
    },
    safetyRules: ["No production changes"],
    riskScore: 24,
    restrictedDomains: ["security"],
    allowedActions: ["recommend", "draft"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 1, monthlyLimit: 25, currency: "EUR", alertThreshold: 0.6 },
  },
  {
    name: "AI_SERVICE_DESIGNER",
    scope: "product",
    description: "Maps journeys, SLAs, and service guardrails with CX and ops signals.",
    // Service design fallback; defers to the product manager for operational decisions.
    priority: 2,
    capabilities: ["Journey maps", "Service blueprints", "CX guardrails"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "support", builder: "buildSupportContext", required: false, fields: ["ticket", "messages"] },
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["health"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    requiredContexts: ["support"],
    output: {
      description: "Service design pack",
      schema: {
        journeys: [{ title: "string", steps: ["string"] }],
        slas: [{ name: "string", target: "string" }],
        painPoints: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:support"],
      brandScoped: true,
      piiGuard: true,
    },
    safetyRules: ["Mask PII"],
    riskScore: 27,
    restrictedDomains: ["legal"],
    allowedActions: ["recommend", "draft"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 2, monthlyLimit: 35, currency: "EUR", alertThreshold: 0.65 },
  },
  {
    name: "AI_CREATIVE_DIRECTOR",
    scope: "creative",
    description: "Sets concept boards, tone, and visual direction across channels.",
    // Primary creative authority; owns tone, safety, and forces any output through governance approval before publication.
    priority: 1,
    capabilities: ["Concept boards", "Tone guidance", "Visual prompts"],
    autonomyLevel: "copilot",
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["brand", "identity"] },
      { name: "marketing", builder: "buildMarketingContext", required: false, fields: ["campaignsSummary"] },
    ],
    requiredContexts: ["brand"],
    output: {
      description: "Creative direction",
      schema: {
        concepts: [{ title: "string", mood: "string", palette: "string" }],
        guardrails: ["string"],
        prompts: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:media"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["politics", "nsfw", "publish without approval", "bypass communications moderation"],
    },
    safetyRules: ["Respect brand identity", "No NSFW"],
    riskScore: 22,
    restrictedDomains: ["politics", "adult"],
    allowedActions: ["draft", "recommend"],
    defaultModel: "gpt-4o",
    fallbackModels: ["gpt-4o-mini"],
    budgetProfile: { dailyLimit: 2, monthlyLimit: 40, currency: "EUR", alertThreshold: 0.7 },
  },
  {
    name: "AI_COPYWRITER",
    scope: "creative",
    description: "Writes on-brand copy with SEO-friendly structure and CTA variants.",
    // Fallback copy partner; mirrors the creative director's tone and cannot publish without governance sign-off.
    priority: 2,
    capabilities: ["Long-form", "CTA variants", "Persona tone"],
    autonomyLevel: "copilot",
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["brand", "identity"] },
      { name: "marketing", builder: "buildMarketingContext", required: false, fields: ["campaignsSummary"] },
    ],
    requiredContexts: ["brand"],
    output: {
      description: "Copy pack",
      schema: {
        headline: "string",
        body: "string",
        ctas: ["string"],
        tone: "string",
      },
    },
    safety: {
      permissions: ["ai:context:media"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["publish without creative director approval"],
    },
    safetyRules: ["Avoid medical claims"],
    riskScore: 18,
    restrictedDomains: ["medical", "financial advice"],
    allowedActions: ["draft", "recommend"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 1, monthlyLimit: 25, currency: "EUR", alertThreshold: 0.6 },
  },
  {
    name: "AI_SEO_ENGINE",
    scope: "marketing",
    description: "SEO strategist for keywords, structure, and content gaps.",
    capabilities: ["Keyword clusters", "Meta content", "Content gap analysis"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "marketing", builder: "buildMarketingContext", required: false, fields: ["campaignsSummary"] },
      { name: "product", builder: "buildProductContext", required: false, fields: ["entity"] },
    ],
    requiredContexts: ["marketing"],
    output: {
      description: "SEO plan",
      schema: {
        keywords: ["string"],
        titles: ["string"],
        gaps: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:marketing"],
      brandScoped: true,
      piiGuard: true,
    },
    safetyRules: ["No black-hat SEO"],
    riskScore: 20,
    restrictedDomains: ["politics"],
    allowedActions: ["recommend", "draft"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 1, monthlyLimit: 25, currency: "EUR", alertThreshold: 0.6 },
  },
  {
    name: "AI_MEDIA_BUYER",
    scope: "marketing",
    description: "Media buying helper for bids, pacing, and channel mix.",
    capabilities: ["Budget pacing", "Bid hints", "Channel mix"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "marketing", builder: "buildMarketingContext", required: true, fields: ["campaignsSummary", "audiences"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand", "policies"] },
    ],
    requiredContexts: ["marketing"],
    output: {
      description: "Media plan",
      schema: {
        pacing: ["string"],
        reallocations: [{ channel: "string", delta: "number" }],
        risks: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:marketing"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["commit spend"],
    },
    safetyRules: ["No auto-spend"],
    riskScore: 34,
    restrictedDomains: ["payments"],
    allowedActions: ["recommend"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 2, monthlyLimit: 50, currency: "EUR", alertThreshold: 0.7 },
  },
  {
    name: "AI_TREND_ENGINE",
    scope: "social-intelligence",
    description: "Tracks cultural and social trends with influencer and mention feeds.",
    // Primary social-intelligence agent; feeds trends into communications-led escalation and adheres to moderation tone.
    priority: 1,
    capabilities: ["Trend clustering", "Early signals", "Audience resonance"],
    autonomyLevel: "copilot",
    inputContexts: [
      { name: "marketing", builder: "buildMarketingContext", required: false, fields: ["socialSignals", "audiences"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    requiredContexts: ["marketing"],
    output: {
      description: "Trend map",
      schema: {
        trends: [{ topic: "string", momentum: "number", platforms: ["string"] }],
        actions: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:marketing"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["bypass communications moderation"],
    },
    safetyRules: ["Avoid misinformation"],
    riskScore: 24,
    restrictedDomains: ["politics"],
    allowedActions: ["recommend", "summarize"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 2, monthlyLimit: 35, currency: "EUR", alertThreshold: 0.65 },
  },
  {
    name: "AI_INFLUENCER_MANAGER",
    scope: "influencer",
    description: "Ranks influencers, detects fake followers, and drafts outreach.",
    // Primary influencer agent; controls tone/risk and escalations through communications oversight.
    priority: 1,
    capabilities: ["Influencer scoring", "Fake follower detection", "Outreach drafts"],
    autonomyLevel: "copilot",
    inputContexts: [
      { name: "marketing", builder: "buildMarketingContext", required: false, fields: ["audiences"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand", "policies"] },
    ],
    requiredContexts: ["marketing"],
    output: {
      description: "Influencer recommendation set",
      schema: {
        rankings: [{ handle: "string", score: "number", reason: "string" }],
        riskNotes: ["string"],
        outreachDrafts: [{ handle: "string", message: "string" }],
      },
    },
    safety: {
      permissions: ["ai:context:marketing"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: [
        "collect payment",
        "share PII",
        "bypass communications moderation",
        "autopost outreach without approvals",
      ],
    },
    safetyRules: ["No payment links", "No promises without approval"],
    riskScore: 33,
    restrictedDomains: ["payments", "legal"],
    allowedActions: ["recommend", "draft"],
    defaultModel: "gpt-4o",
    fallbackModels: ["gpt-4o-mini"],
    budgetProfile: { dailyLimit: 3, monthlyLimit: 55, currency: "EUR", alertThreshold: 0.75 },
  },
  {
    name: "AI_PR_GUARDIAN",
    scope: "communications",
    description: "Press and comms guardian for statements, crisis notes, and approvals.",
    // Primary communications authority owning tone, safety, and escalation paths (feeds voice/social teams into governance review).
    priority: 1,
    capabilities: ["Statement drafting", "Risk wording", "Approval checklist"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["brand", "policies"] },
      { name: "support", builder: "buildSupportContext", required: false, fields: ["ticket", "messages"] },
    ],
    requiredContexts: ["brand"],
    output: {
      description: "PR pack",
      schema: {
        statement: "string",
        qna: [{ q: "string", a: "string" }],
        riskFlags: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: [
        "legal admission",
        "bypass communications moderation",
        "issue statements without comms oversight",
      ],
    },
    safetyRules: ["Route to legal for high risk"],
    riskScore: 30,
    restrictedDomains: ["legal"],
    allowedActions: ["draft", "recommend"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 2, monthlyLimit: 40, currency: "EUR", alertThreshold: 0.7 },
  },
  {
    name: "AI_LOCALIZATION_AGENT",
    scope: "communications",
    description: "Localizes copy with cultural and regulatory sensitivity.",
    // Communications fallback focused on localization while honoring the primary guardian’s tone and escalation chain.
    priority: 2,
    capabilities: ["Locale copy", "Cultural notes", "Regulatory wording"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["brand", "identity"] },
      { name: "marketing", builder: "buildMarketingContext", required: false, fields: ["campaignsSummary"] },
    ],
    requiredContexts: ["brand"],
    output: {
      description: "Localized copy",
      schema: {
        locale: "string",
        copy: "string",
        notes: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
    },
    safetyRules: ["Respect cultural nuances"],
    riskScore: 18,
    restrictedDomains: ["legal"],
    allowedActions: ["draft"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 1, monthlyLimit: 20, currency: "EUR", alertThreshold: 0.6 },
  },
  {
    name: "AI_SALES_COACH",
    scope: "sales",
    description: "Coaches reps with playbooks, objection handling, and territory moves.",
    capabilities: ["Objection handling", "Playbooks", "Daily plan"],
    autonomyLevel: "copilot",
    inputContexts: [
      { name: "sales-rep", builder: "buildSalesRepContext", required: true, fields: ["rep", "signals", "targets"] },
      { name: "crm-client", builder: "buildCRMClientContext", required: false, fields: ["lead", "signals"] },
    ],
    requiredContexts: ["sales-rep"],
    output: {
      description: "Sales coaching set",
      schema: {
        priorities: ["string"],
        scripts: [{ topic: "string", script: "string" }],
        risks: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:sales"],
      brandScoped: true,
      piiGuard: true,
    },
    safetyRules: ["No pricing commitments"],
    riskScore: 25,
    restrictedDomains: ["pricing"],
    allowedActions: ["recommend", "draft"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 2, monthlyLimit: 35, currency: "EUR", alertThreshold: 0.65 },
  },
  {
    name: "AI_ACCOUNT_EXECUTIVE",
    scope: "sales",
    description: "AE assistant for deal strategy, stakeholders, and proposals.",
    capabilities: ["Deal strategy", "Stakeholder map", "Proposal drafts"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "crm-client", builder: "buildCRMClientContext", required: true, fields: ["lead", "related", "signals"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    requiredContexts: ["crm-client"],
    output: {
      description: "Deal plan",
      schema: {
        strategy: "string",
        stakeholders: [{ name: "string", role: "string", risk: "string" }],
        actions: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:crm"],
      brandScoped: true,
      piiGuard: true,
    },
    safetyRules: ["No binding offers"],
    riskScore: 29,
    restrictedDomains: ["legal"],
    allowedActions: ["recommend", "draft"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 2, monthlyLimit: 35, currency: "EUR", alertThreshold: 0.65 },
  },
  {
    name: "AI_CUSTOMER_SUCCESS",
    scope: "support",
    description: "Success manager for health scores, renewals, and expansion plays.",
    capabilities: ["Health scoring", "Renewal play", "Expansion idea"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "crm-client", builder: "buildCRMClientContext", required: true, fields: ["lead", "signals", "related"] },
      { name: "support", builder: "buildSupportContext", required: false, fields: ["ticket", "messages"] },
    ],
    requiredContexts: ["crm-client"],
    output: {
      description: "Success plan",
      schema: {
        health: "string",
        risks: ["string"],
        actions: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:support"],
      brandScoped: true,
      piiGuard: true,
    },
    safetyRules: ["No discounts"],
    riskScore: 24,
    restrictedDomains: ["pricing"],
    allowedActions: ["recommend", "draft"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 2, monthlyLimit: 30, currency: "EUR", alertThreshold: 0.65 },
  },
  {
    name: "AI_INVENTORY_MANAGER",
    scope: "operations",
    description: "Inventory planner for stock health, transfers, and demand risk.",
    priority: 2,
    capabilities: ["Stock risk", "Transfer plan", "Demand match"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "inventory", builder: "buildInventoryContext", required: true, fields: ["inventory", "signals.lowStock"] },
      { name: "product", builder: "buildProductContext", required: false, fields: ["entity", "signals"] },
    ],
    requiredContexts: ["inventory"],
    output: {
      description: "Inventory moves",
      schema: {
        transfers: [{ productId: "string", quantity: "number", to: "string" }],
        risks: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:inventory"],
      brandScoped: true,
      piiGuard: true,
    },
    safetyRules: ["Do not execute transfers"],
    riskScore: 28,
    restrictedDomains: ["finance"],
    allowedActions: ["recommend"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 2, monthlyLimit: 35, currency: "EUR", alertThreshold: 0.65 },
  },
  {
    name: "AI_QUALITY_MANAGER",
    scope: "operations",
    description: "Quality monitor for incidents, returns, and supplier performance.",
    priority: 2,
    capabilities: ["Defect clustering", "Supplier risk", "QA checklist"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["incidents"] },
      { name: "inventory", builder: "buildInventoryContext", required: false, fields: ["signals"] },
    ],
    requiredContexts: ["operations"],
    output: {
      description: "Quality snapshot",
      schema: {
        defects: ["string"],
        suppliers: [{ name: "string", risk: "string" }],
        actions: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:inventory"],
      brandScoped: true,
      piiGuard: true,
    },
    safetyRules: ["Do not change suppliers"],
    riskScore: 27,
    restrictedDomains: ["legal"],
    allowedActions: ["recommend"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 1, monthlyLimit: 25, currency: "EUR", alertThreshold: 0.6 },
  },
  {
    name: "AI_OPS_PLANNER",
    scope: "operations",
    description: "Ops planner for capacity, staffing signals, and incident readiness.",
    priority: 2,
    capabilities: ["Capacity plan", "Staffing hints", "Incident readiness"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "operations", builder: "buildOperationsContext", required: true, fields: ["health", "incidents"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    requiredContexts: ["operations"],
    output: {
      description: "Ops plan",
      schema: {
        capacity: "string",
        staffing: ["string"],
        drills: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
    },
    safetyRules: ["No scheduling changes"],
    riskScore: 26,
    restrictedDomains: ["hr"],
    allowedActions: ["recommend"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 1, monthlyLimit: 25, currency: "EUR", alertThreshold: 0.6 },
  },
  {
    name: "AI_TAX_ENGINE",
    scope: "finance",
    description: "Tax policy checker and filing readiness assistant.",
    // Tax readiness fallback; flags obligations but defers to the finance control tower for execution.
    priority: 2,
    capabilities: ["Tax rules", "Filing checklist", "Nexus detection"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "finance", builder: "buildFinanceContext", required: true, fields: ["revenueSummary", "marginSummary"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand", "policies"] },
    ],
    requiredContexts: ["finance"],
    output: {
      description: "Tax readiness",
      schema: {
        jurisdictions: ["string"],
        obligations: ["string"],
        risks: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:finance"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["file returns", "provide legal advice"],
    },
    safetyRules: ["Not legal advice"],
    riskScore: 40,
    restrictedDomains: ["legal"],
    allowedActions: ["recommend", "summarize"],
    defaultModel: "gpt-4o",
    fallbackModels: ["gpt-4o-mini"],
    budgetProfile: { dailyLimit: 2, monthlyLimit: 45, currency: "EUR", alertThreshold: 0.7 },
  },
  {
    name: "AI_LEGAL_AGENT",
    scope: "legal",
    description: "Policy-aware legal reviewer for contracts and comms guidance.",
    // Primary legal authority; strictly advisory/validation-only with explicit non-execution constraints.
    priority: 1,
    capabilities: ["Clause risk", "Redline hints", "Policy alignment"],
    autonomyLevel: "manual",
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: true, fields: ["policies", "brand"] },
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["incidents"] },
    ],
    requiredContexts: ["brand"],
    output: {
      description: "Legal review notes",
      schema: {
        risks: ["string"],
        recommendations: ["string"],
        clauses: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["legal advice", "binding decisions", "execute transactions", "override governance directives"],
    },
    safetyRules: ["Not a lawyer", "Human approval required"],
    riskScore: 55,
    restrictedDomains: ["legal"],
    // Validation note: this agent only issues recommendations/summaries and cannot execute any agreements.
    allowedActions: ["recommend", "summarize"],
    defaultModel: "gpt-4o",
    fallbackModels: ["gpt-4o-mini"],
    budgetProfile: { dailyLimit: 1, monthlyLimit: 30, currency: "EUR", alertThreshold: 0.6 },
  },
  {
    name: "AI_BI_ANALYTICS",
    scope: "insight",
    description: "BI analyst for KPIs, attribution, and anomaly surfacing.",
    // Insight fallback; defers to insight-reporter for governance-ready summarization.
    priority: 2,
    capabilities: ["KPI trends", "Anomaly detection", "Attribution"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "marketing", builder: "buildMarketingContext", required: false, fields: ["campaignsSummary"] },
      { name: "finance", builder: "buildFinanceContext", required: false, fields: ["revenueSummary"] },
    ],
    requiredContexts: ["marketing", "finance"],
    output: {
      description: "BI summary",
      schema: {
        highlights: ["string"],
        anomalies: ["string"],
        nextQuestions: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:insight"],
      brandScoped: true,
      piiGuard: true,
    },
    safetyRules: ["Do not change data"],
    riskScore: 22,
    restrictedDomains: ["payments"],
    allowedActions: ["summarize", "recommend"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 2, monthlyLimit: 35, currency: "EUR", alertThreshold: 0.65 },
  },
  {
    name: "AI_DATA_QUALITY",
    scope: "governance",
    description: "Data quality auditor for freshness, completeness, and lineage hints.",
    // Fallback governance role focused on data health; defers to the validator for gating decisions.
    priority: 2,
    capabilities: ["Freshness alerts", "Completeness", "Lineage"],
    autonomyLevel: "assisted",
    inputContexts: [
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["health"] },
    ],
    requiredContexts: ["operations"],
    output: {
      description: "Data quality report",
      schema: {
        checks: [{ name: "string", status: "string", severity: "string" }],
        owners: ["string"],
        actions: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
    },
    safetyRules: ["Read-only"],
    riskScore: 20,
    restrictedDomains: ["security"],
    allowedActions: ["summarize"],
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-4o"],
    budgetProfile: { dailyLimit: 1, monthlyLimit: 25, currency: "EUR", alertThreshold: 0.6 },
  },
  {
    name: "AI_GOVERNANCE_ANALYZER",
    scope: "governance",
    description: "Governance watcher for AI actions, permissions, and policy drift.",
    // Policy drift observer that reports findings but keeps enforcement to the governance gatekeeper.
    priority: 2,
    capabilities: ["Policy drift", "Permission gaps", "AI action audit"],
    autonomyLevel: "manual",
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["policies"] },
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["health"] },
    ],
    requiredContexts: ["brand"],
    output: {
      description: "Governance assessment",
      schema: {
        violations: ["string"],
        requiredApprovals: ["string"],
        auditTrail: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
    },
    safetyRules: ["Never execute actions"],
    riskScore: 45,
    restrictedDomains: ["auth", "security"],
    allowedActions: ["summarize", "recommend"],
    defaultModel: "gpt-4o",
    fallbackModels: ["gpt-4o-mini"],
    budgetProfile: { dailyLimit: 1, monthlyLimit: 30, currency: "EUR", alertThreshold: 0.65 },
  },
];

const ADDITIONAL_AGENTS: AIAgentManifestSeed[] = [
  {
    name: "MEDIA_STUDIO_CREATIVE",
    scope: "media",
    description: "Drafts safe creative concepts and content suggestions (no auto-send).",
    capabilities: ["Draft copy", "Suggest assets", "Summarize briefs"],
    autonomyLevel: "manual",
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand", "identity"] },
      { name: "marketing", builder: "buildMarketingContext", required: false, fields: ["campaignsSummary"] },
    ],
    output: {
      description: "Creative suggestions",
      schema: {
        ideas: ["string"],
        cta: ["string"],
        notes: "string",
      },
    },
    safety: {
      permissions: ["ai:context:marketing"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["auto-publish", "upload media"],
    },
    allowedActions: ["analyze", "summarize", "draft"],
    budgetProfile: { dailyLimit: 1, monthlyLimit: 15, currency: "USD", alertThreshold: 0.7 },
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-3.5-turbo"],
    riskScore: 30,
  },
  {
    name: "VOICE_IVR_SCRIPT",
    scope: "voice",
    description: "Generates IVR scripts and call summaries; no live call control.",
    // Primary voice scope node; tone, safety, and escalation echo communications authority (AI_PR_GUARDIAN).
    priority: 1,
    capabilities: ["Draft IVR flows", "Summarize calls"],
    autonomyLevel: "manual",
    inputContexts: [
      { name: "support", builder: "buildSupportContext", required: false, fields: ["ticket"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "IVR drafts",
      schema: {
        script: "string",
        options: ["string"],
        complianceNotes: "string",
      },
    },
    safety: {
      permissions: ["ai:context:voice"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["execute calls", "collect payment", "bypass communications moderation"],
    },
    allowedActions: ["draft", "summarize"],
    budgetProfile: { dailyLimit: 0.5, monthlyLimit: 10, currency: "USD", alertThreshold: 0.7 },
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-3.5-turbo"],
    riskScore: 28,
  },
  {
    name: "INFLUENCER_ANALYST",
    scope: "influencer",
    description: "Analyzes influencer performance and fit; advisory only.",
    // Fallback influencer observer; feeds analysis into the communications-led control tower.
    priority: 2,
    capabilities: ["Analyze influencers", "Suggest outreach", "Summarize performance"],
    autonomyLevel: "manual",
    inputContexts: [
      { name: "marketing", builder: "buildMarketingContext", required: false, fields: ["socialSignals"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Influencer summary",
      schema: {
        shortlist: [{ handle: "string", score: "number" }],
        risks: ["string"],
        recommendedActions: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:marketing"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["commit spend", "sign contracts"],
    },
    allowedActions: ["analyze", "summarize", "recommend"],
    budgetProfile: { dailyLimit: 0.5, monthlyLimit: 12, currency: "USD", alertThreshold: 0.7 },
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-3.5-turbo"],
    riskScore: 26,
  },
  {
    name: "SOCIAL_INTEL",
    scope: "social",
    description: "Summarizes social listening signals; no posting.",
    // Primary social monitoring node; aligns tone/safety with communications and defers to moderation for escalation.
    priority: 1,
    capabilities: ["Summarize mentions", "Highlight risks", "Suggest responses"],
    autonomyLevel: "manual",
    inputContexts: [
      { name: "marketing", builder: "buildMarketingContext", required: false, fields: ["socialSignals"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Social intel",
      schema: {
        summary: "string",
        sentiment: "string",
        risks: ["string"],
        suggestedReplies: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:marketing"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["auto-post", "share PII", "bypass communications moderation"]
    },
    allowedActions: ["summarize", "draft"],
    budgetProfile: { dailyLimit: 0.5, monthlyLimit: 10, currency: "USD", alertThreshold: 0.7 },
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-3.5-turbo"],
    riskScore: 25,
  },
  {
    name: "SUPPORT_TRIAGE",
    scope: "support",
    description: "Summarizes tickets and drafts responses; no auto-send.",
    capabilities: ["Summarize tickets", "Draft replies", "Route to queue"],
    autonomyLevel: "manual",
    inputContexts: [
      { name: "support", builder: "buildSupportContext", required: true, fields: ["ticket"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Support draft",
      schema: {
        summary: "string",
        draftReply: "string",
        routing: "string",
      },
    },
    safety: {
      permissions: ["ai:context:support"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["send messages", "refund"]
    },
    allowedActions: ["summarize", "draft"],
    budgetProfile: { dailyLimit: 0.5, monthlyLimit: 10, currency: "USD", alertThreshold: 0.7 },
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-3.5-turbo"],
    riskScore: 24,
  },
  {
    name: "OPERATIONS_HEALTH",
    scope: "operations",
    description: "Summarizes incidents and ops health; advisory only.",
    priority: 2,
    capabilities: ["Summarize incidents", "Highlight risks"],
    autonomyLevel: "manual",
    inputContexts: [
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["health", "incidents"] },
    ],
    output: {
      description: "Ops health",
      schema: {
        summary: "string",
        incidents: ["string"],
        recommendations: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:operations"],
      brandScoped: true,
      piiGuard: true,
    },
    allowedActions: ["summarize", "recommend"],
    budgetProfile: { dailyLimit: 0.5, monthlyLimit: 10, currency: "USD", alertThreshold: 0.7 },
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-3.5-turbo"],
    riskScore: 22,
  },
  {
    name: "NOTIFICATION_DRAFTER",
    scope: "notification",
    description: "Drafts notifications/messages; never sends.",
    // Primary notification voice shaping, keeps tone aligned with communications and prevents execution without sign-off.
    priority: 1,
    capabilities: ["Draft notifications", "Suggest channels"],
    autonomyLevel: "manual",
    inputContexts: [
      { name: "notification", builder: "buildNotificationContext", required: false, fields: ["recent"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Notification drafts",
      schema: {
        drafts: [{ channel: "string", subject: "string", body: "string" }],
        risks: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:notification"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["send", "schedule", "bypass communications moderation"],
    },
    allowedActions: ["draft", "summarize"],
    budgetProfile: { dailyLimit: 0.5, monthlyLimit: 8, currency: "USD", alertThreshold: 0.7 },
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-3.5-turbo"],
    riskScore: 23,
  },
  {
    name: "KNOWLEDGE_QA",
    scope: "knowledge",
    description: "Reads knowledge base and summarizes answers.",
    // Read-only knowledge fallback; defers to kb-engine for authoritative summarization.
    priority: 2,
    capabilities: ["Search KB", "Summarize answers"],
    autonomyLevel: "manual",
    inputContexts: [
      { name: "knowledge", builder: "buildKnowledgeBaseContext", required: true, fields: ["document"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "KB answer",
      schema: {
        answer: "string",
        sources: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:knowledge"],
      brandScoped: true,
      piiGuard: true,
    },
    allowedActions: ["summarize"],
    budgetProfile: { dailyLimit: 0.5, monthlyLimit: 8, currency: "USD", alertThreshold: 0.7 },
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-3.5-turbo"],
    riskScore: 20,
  },
  {
    name: "GOVERNANCE_ADVISOR_LITE",
    scope: "governance",
    description: "Advisory-only governance summaries; no actions.",
    // Summaries-only fallback, maintains read-only posture in the governance hierarchy.
    priority: 2,
    capabilities: ["Summarize policies", "Highlight gaps"],
    autonomyLevel: "manual",
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["policies"] },
    ],
    output: {
      description: "Governance summary",
      schema: {
        risks: ["string"],
        recommendations: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
    },
    allowedActions: ["summarize", "recommend"],
    budgetProfile: { dailyLimit: 0.5, monthlyLimit: 10, currency: "USD", alertThreshold: 0.7 },
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-3.5-turbo"],
    riskScore: 22,
  },
  {
    name: "HR_TRAINER_AGENT",
    scope: "ops-hr",
    description: "Coaches human teams on AI usage, policy compliance, and skill gaps.",
    // Primary ops-hr advisor; coaching-only and defers to security/governance authorities without override rights.
    priority: 1,
    capabilities: ["Summarize training needs", "Draft micro-lessons", "Flag risky behavior"],
    autonomyLevel: "manual",
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand", "policies"] },
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["health"] },
    ],
    output: {
      description: "Training guidance",
      schema: {
        summary: "string",
        trainingActions: ["string"],
        risks: ["string"],
        requiredApprovals: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:operations"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: [
        "change HR records",
        "discipline staff",
        "override security directives",
        "bypass governance guidance",
      ],
    },
    // Validation note: this agent only offers training guidance and never overrides higher governance or security mandates.
    allowedActions: ["summarize", "recommend", "draft"],
    budgetProfile: { dailyLimit: 0.5, monthlyLimit: 12, currency: "USD", alertThreshold: 0.7 },
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-3.5-turbo"],
    riskScore: 25,
    restrictedDomains: ["payroll", "contracts"],
  },
  {
    name: "GOVERNANCE_ADVISOR_AGENT",
    scope: "governance-ops",
    description: "Advises on governance, policy drift, and autonomy levels; no side effects.",
    // Primary governance-ops advisor; accepts that governance-safety (priority 1) can override its recommendations during escalations.
    priority: 1,
    capabilities: ["Map policies", "Score risks", "Recommend approvals"],
    autonomyLevel: "manual",
    inputContexts: [
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["policies"] },
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["health"] },
    ],
    output: {
      description: "Governance guidance",
      schema: {
        risks: ["string"],
        recommendations: ["string"],
        approvals: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:brand"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["execute changes", "alter permissions"],
    },
    allowedActions: ["summarize", "recommend"],
    budgetProfile: { dailyLimit: 0.6, monthlyLimit: 15, currency: "USD", alertThreshold: 0.7 },
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-3.5-turbo"],
    riskScore: 28,
    restrictedDomains: ["auth", "security"],
  },
  {
    name: "SAFETY_OFFICER_AGENT",
    scope: "governance-safety",
    description: "Monitors AI runs for safety violations and triggers escalation paths.",
    // Primary governance-safety sentinel; can override governance-ops findings when safety violations surface.
    priority: 1,
    capabilities: ["Check safety events", "Detect restricted scopes", "Propose mitigations"],
    autonomyLevel: "manual",
    inputContexts: [
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["health", "incidents"] },
    ],
    output: {
      description: "Safety review",
      schema: {
        summary: "string",
        violations: ["string"],
        mitigations: ["string"],
        escalationLevel: "string",
      },
    },
    safety: {
      permissions: ["ai:context:operations"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["execute actions", "modify data"]
    },
    allowedActions: ["summarize", "recommend"],
    budgetProfile: { dailyLimit: 0.5, monthlyLimit: 12, currency: "USD", alertThreshold: 0.65 },
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-3.5-turbo"],
    riskScore: 26,
    restrictedDomains: ["finance", "auth"],
  },
  {
    name: "OVERSIGHT_AGENT",
    scope: "oversight",
    description: "Provides oversight summaries for high-risk AI activity and budgets.",
    // Primary oversight agent; strictly read-only oversight digest with zero execution authority.
    priority: 1,
    capabilities: ["Summarize high-risk runs", "Assess budget usage", "Recommend approvals"],
    autonomyLevel: "manual",
    inputContexts: [
      { name: "operations", builder: "buildOperationsContext", required: false, fields: ["incidents"] },
      { name: "brand", builder: "buildBrandContext", required: false, fields: ["brand"] },
    ],
    output: {
      description: "Oversight digest",
      schema: {
        summary: "string",
        risks: ["string"],
        budgetFindings: ["string"],
        requiredApprovals: ["string"],
      },
    },
    safety: {
      permissions: ["ai:context:operations"],
      brandScoped: true,
      piiGuard: true,
      blockedTopics: ["execute", "approve"],
    },
    allowedActions: ["summarize", "recommend"],
    budgetProfile: { dailyLimit: 0.5, monthlyLimit: 12, currency: "USD", alertThreshold: 0.65 },
    defaultModel: "gpt-4o-mini",
    fallbackModels: ["gpt-3.5-turbo"],
    riskScore: 29,
    restrictedDomains: ["payments", "auth"],
  },
];

export const AI_AGENTS_MANIFEST: AIAgentDefinition[] = [...BASE_AI_AGENTS_MANIFEST, ...PERSONA_AGENTS, ...ADDITIONAL_AGENTS].map(
  (agent) => {
    const scope = canonicalizeScope(agent.scope);
    const normalized = { ...agent, scope } as AIAgentDefinition;
    return {
      ...normalized,
      scope,
      bootPrompt: agent.bootPrompt ?? buildBootPrompt(normalized),
      safetyRules: agent.safetyRules ?? agent.safety?.blockedTopics ?? [],
      riskScore: agent.riskScore ?? DEFAULT_RISK_SCORE,
      restrictedDomains: agent.restrictedDomains ?? [],
      allowedActions: agent.allowedActions ?? DEFAULT_ALLOWED_ACTIONS,
      autonomyLevel: normalizeAutonomyLevel(agent.autonomyLevel),
      requiredContexts:
        agent.requiredContexts ?? agent.inputContexts.filter((ctx) => ctx.required).map((ctx) => ctx.name),
      defaultModel: agent.defaultModel ?? agent.model ?? DEFAULT_MODEL,
      fallbackModels: agent.fallbackModels ?? DEFAULT_FALLBACK_MODELS,
      budgetProfile: agent.budgetProfile ?? DEFAULT_BUDGET,
    };
  },
);


// تحقق النزاهة حسب قواعد AI Crew (MH-OS)
export function validateManifestIntegrity(manifest: AIAgentDefinition[]) {
  const warnings: string[] = [];
  const seenNames = new Set<string>();
  const seenScopeRole = new Set<string>();
  const agentsByScope: Record<string, AIAgentDefinition[]> = {};
  // تحقق من تكرار الاسماء (خطأ صارم)
  for (const agent of manifest) {
    if (seenNames.has(agent.name)) {
      // خطأ حوكمة: الاسم يجب أن يكون فريدًا عالميًا
      throw new Error(`AI Agent manifest integrity violation: duplicate agent name: ${agent.name}`);
    }
    seenNames.add(agent.name);
    // بناء جدول لكل scope
    if (!agentsByScope[agent.scope]) {
      agentsByScope[agent.scope] = [];
    }
      (agentsByScope[agent.scope]!).push(agent);
  }
  const priorityOneViolations = manifest.filter(
    (agent) =>
      agent.priority === 1 &&
      !ALLOWED_PRIORITY_ONE_LEVELS.has(agent.autonomyLevel ?? DEFAULT_AUTONOMY_LEVEL),
  );
  if (priorityOneViolations.length > 0) {
    throw new Error(
      `AI Agent manifest integrity violation: priority-1 agents cannot have operator-level autonomy: ${priorityOneViolations
        .map((agent) => agent.name)
        .join(", ")}`,
    );
  }
  // تحقق من تكرار (scope+role) إذا كان role معرفًا (تحذير فقط)
  for (const scope in agentsByScope) {
    const agents = agentsByScope[scope] || [];
    const roleMap = new Map<string, AIAgentDefinition[]>();
    for (const agent of agents) {
      if (agent.role) {
        const key = `${scope}::${agent.role}`;
        if (!roleMap.has(key)) roleMap.set(key, []);
        roleMap.get(key)!.push(agent);
      }
    }
    for (const [key, agentsWithRole] of roleMap.entries()) {
      if (agentsWithRole.length > 1) {
        warnings.push(
          `AI Crew governance warning: Multiple agents share the same (scope+role): ${key}. Agents: [${agentsWithRole.map(a => a.name).join(", ")}]`
        );
      }
    }
  }
  // تحقق من وجود على الأقل وكيل واحد لكل scope (تحذير فقط)
  for (const scope in agentsByScope) {
    const agents = agentsByScope[scope] || [];
    if (agents.length === 0) {
      warnings.push(`AI Crew governance warning: No agents found for scope: ${scope}`);
    }
    // تحقق من وجود primary (إذا كان موجودًا)
    // ملاحظة: لا يوجد حقل primary رسمي في AIAgentDefinition، نستخدم priority === 1 فقط
    const hasPrimary = agents.some(a => a.priority === 1);
    if (!hasPrimary) {
      warnings.push(`AI Crew governance warning: No agent marked as primary (priority: 1) for scope: ${scope}`);
    }
  }
  // لا تحذر أبدًا من تكرار scope فقط
  if (warnings.length > 0) {
    logger.warn(`[AI][manifest] integrity warnings`, { warnings });
  }
  return warnings;
}

export const AI_MANIFEST_WARNINGS = validateManifestIntegrity(AI_AGENTS_MANIFEST);

export const AgentManifestByScope = Object.fromEntries(
  AI_AGENTS_MANIFEST.map((agent) => [agent.scope, agent as AIAgentDefinition]),
);
