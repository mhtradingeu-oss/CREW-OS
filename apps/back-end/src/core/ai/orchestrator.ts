import {
  findAgentConfigByName,
  findAgentConfigByScope,
  findBrandContext,
  findDefaultAgentConfig,
  findRestrictionPolicies,
} from "../db/repositories/ai-orchestrator.repository.js";
import { forbidden } from "../http/errors.js";
import { runAIRequest, type AIRequest, type AIMessage } from "../ai-service/ai-client.js";
import {
  SimpleCache,
  MemoryCache,
  hashObject,
  hashPayload,
  safeAIRequest,
  type CachedAIResponse,
} from "./ai-utils.js";
import {
  createRunId,
  enforceAgentBudget,
  enforceManifestBudget,
  estimateCostUsd,
  estimateTokens,
  logExecution,
  type ExecutionStatus,
  recordSafetyEvent,
} from "./ai-monitoring.js";
import {
  assistantTemplate,
  brandReportTemplate,
  crmInsightTemplate,
  financeRunwayTemplate,
  inventoryInsightTemplate,
  kpiNarrativeTemplate,
  loyaltyInsightTemplate,
  marketingInsightTemplate,
  pricingInsightTemplate,
  pricingSuggestionTemplate,
  salesRepPlanTemplate,
  standStockSuggestionTemplate,
  virtualOfficeMeetingTemplate,
} from "./prompt-templates.js";
import type {
  BrandHealthInput,
  BrandHealthOutput,
  CampaignIdeasInput,
  CampaignIdeasOutput,
  KpiNarrativeInput,
  KpiNarrativeOutput,
  LeadFollowupInput,
  LeadFollowupOutput,
  PricingSuggestionInput,
  PricingSuggestionOutput,
  SalesLeadAiContext,
  SalesRepPlanInput,
  SalesRepPlanOutput,
  StandInventoryContext,
  StandStockSuggestionInput,
  StandStockSuggestionOutput,
  VirtualOfficeMeetingRequest,
  VirtualOfficeMeetingSummary,
} from "../../modules/ai-brain/ai-brain.types.js";
import { AgentManifestByScope } from "../../ai/schema/ai-agents-manifest.js";

const HIGH_RISK_SCOPES = [
  "pricing",
  "finance",
  "operations",
  "support",
  "notification",
  "communication",
  "governance",
];

const cache = new SimpleCache<any>(60_000);
const responseCache = new MemoryCache<unknown>(30_000);
const brandContextCache = new SimpleCache<Record<string, unknown>>(60_000);

function tryParseJson(value?: string | null) {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export class AiOrchestrator {
  async generatePricingSuggestion(input: PricingSuggestionInput) {
    const agent = await this.getAgent(input.brandId, input.agentName ?? "pricing");
    const brandContext = await this.getBrandContext(input.brandId);
    return this.run<PricingSuggestionOutput>(
      "pricing-suggest",
      pricingSuggestionTemplate({ ...input, agent, ...brandContext }),
      {
        suggestedPrice: input.currentPrice ?? null,
        reasoning: "Using last known price",
        riskLevel: "MEDIUM",
        competitorSummary: input.competitorSummary,
        confidenceScore: 0.4,
      },
      { brandId: input.brandId, scope: "pricing" },
    );
  }

  async generatePricingInsight(context: Record<string, unknown>) {
    const agent = await this.getAgent(context.brandId, "pricing");
    const brandContext = await this.getBrandContext(context.brandId);
    return this.run("pricing", pricingInsightTemplate({ ...context, agent, ...brandContext }), {
      summary: "Pricing steady",
      riskLevel: "MEDIUM",
      recommendation: "Monitor competitors",
      confidence: 0.5,
    }, { brandId: context.brandId as string | undefined, scope: "pricing" });
  }

  async generateMarketingInsight(context: Record<string, unknown>) {
    const agent = await this.getAgent(context.brandId, "marketing");
    const brandContext = await this.getBrandContext(context.brandId);
    return this.run("marketing", marketingInsightTemplate({ ...context, agent, ...brandContext }), {
      summary: "No marketing data",
      channels: [],
      recommendation: "Collect data",
    }, { brandId: context.brandId as string | undefined, scope: "marketing" });
  }

  async generateCampaignIdeas(input: CampaignIdeasInput) {
    const agent = await this.getAgent(input.brandId, input.agentName ?? "marketing");
    const brandContext = await this.getBrandContext(input.brandId);
    return this.run<CampaignIdeasOutput>(
      "campaign-ideas",
      marketingInsightTemplate({ ...input, agent, ...brandContext }),
      {
        headline: input.goal,
        body: "Draft campaign copy",
        cta: "Learn more",
        keywords: [input.goal],
      },
      { brandId: input.brandId, scope: "marketing" },
    );
  }

  async generateCRMInsight(context: Record<string, unknown>) {
    const agent = await this.getAgent(context.brandId, "crm");
    const brandContext = await this.getBrandContext(context.brandId);
    return this.run("crm", crmInsightTemplate({ ...context, agent, ...brandContext }), {
      summary: "Lead health unknown",
      nextAction: "Follow up manually",
      score: 40,
    }, { brandId: context.brandId as string | undefined, scope: "crm" });
  }

  async generateSalesRepPlan(input: SalesRepPlanInput) {
    const agent = await this.getAgent(input.brandId, input.agentName ?? "sales");
    const brandContext = await this.getBrandContext(input.brandId);
    return this.run<SalesRepPlanOutput>(
      "sales-plan",
      salesRepPlanTemplate({ ...input, agent, ...brandContext }),
      this.buildSalesPlanFallback(input.leads),
      { brandId: input.brandId, scope: "sales" },
    );
  }

  async generateLeadFollowupSuggestions(input: LeadFollowupInput) {
    const agent = await this.getAgent(input.brandId, input.agentName ?? "crm");
    const brandContext = await this.getBrandContext(input.brandId);
    return this.run<LeadFollowupOutput>(
      "crm-followup",
      crmInsightTemplate({ ...input, agent, ...brandContext }),
      {
        summary: "Follow up suggested",
        nextAction: "Email the lead",
        probability: 0.5,
        reasons: ["Fallback suggestion"],
      },
      { brandId: input.brandId, scope: "crm" },
    );
  }

  async generateInventoryInsight(context: Record<string, unknown>) {
    const agent = await this.getAgent(context.brandId, "inventory");
    const brandContext = await this.getBrandContext(context.brandId);
    return this.run("inventory", inventoryInsightTemplate({ ...context, agent, ...brandContext }), {
      summary: "Inventory status pending",
      risk: "MEDIUM",
      recommendation: "Audit stock",
    }, { brandId: context.brandId as string | undefined, scope: "inventory" });
  }

  async summaryFinanceRunway(context: Record<string, unknown>) {
    const agent = await this.getAgent(context.brandId, "finance");
    const brandContext = await this.getBrandContext(context.brandId);
    return this.run(
      "finance-runway",
      financeRunwayTemplate({ ...context, agent, ...brandContext }),
      {
        summary: "Finance runway data unavailable",
        details: "AI could not compute a runway snapshot, check inputs.",
        runwayMonths: null,
        cashBalance: null,
        burnRate: null,
      },
      { brandId: context.brandId as string | undefined, scope: "finance" },
    );
  }

  async generateStandStockSuggestion(input: StandStockSuggestionInput) {
    const agent = await this.getAgent(input.brandId, input.agentName ?? "inventory");
    const brandContext = await this.getBrandContext(input.brandId);
    return this.run<StandStockSuggestionOutput>(
      "stand-stock",
      standStockSuggestionTemplate({ ...input, agent, ...brandContext }),
      this.buildStandStockFallback(input.inventorySnapshot),
      { brandId: input.brandId, scope: "inventory" },
    );
  }

  async generateLoyaltyInsight(context: Record<string, unknown>) {
    const agent = await this.getAgent(context.brandId, "loyalty");
    const brandContext = await this.getBrandContext(context.brandId);
    return this.run("loyalty", loyaltyInsightTemplate({ ...context, agent, ...brandContext }), {
      summary: "Loyalty engagement unclear",
      action: "Review rewards",
    }, { brandId: context.brandId as string | undefined, scope: "loyalty" });
  }

  async generateKPINarrative(context: Record<string, unknown>) {
    const agent = await this.getAgent(context.brandId, "kpi");
    const brandContext = await this.getBrandContext(context.brandId);
    return this.run("kpi", kpiNarrativeTemplate({ ...context, agent, ...brandContext }), {
      overview: "No KPI data",
      highlights: [],
      risks: [],
      nextSteps: [],
    }, { brandId: context.brandId as string | undefined, scope: "kpi" });
  }

  async generateKpiNarrativeTyped(input: KpiNarrativeInput) {
    const agent = await this.getAgent(input.brandId, input.agentName ?? "kpi");
    const brandContext = await this.getBrandContext(input.brandId);
    return this.run<KpiNarrativeOutput>(
      "kpi-narrative",
      kpiNarrativeTemplate({ ...input, agent, ...brandContext }),
      {
        overview: "No KPI data",
        highlights: [],
        risks: [],
        nextSteps: [],
      },
      { brandId: input.brandId, scope: "kpi" },
    );
  }

  async generateFullBrandReport(context: Record<string, unknown>) {
    const agent = await this.getAgent(context.brandId, "report");
    const brandContext = await this.getBrandContext(context.brandId);
    return this.run("report", brandReportTemplate({ ...context, agent, ...brandContext }), {
      title: "Brand Report",
      sections: [],
      summary: "No data",
    }, { brandId: context.brandId as string | undefined, scope: "report" });
  }

  async assistantChat(context: Record<string, unknown>) {
    const agent = await this.getAgent(context.brandId, "assistant");
    const brandContext = await this.getBrandContext(context.brandId);
    return this.run("assistant", assistantTemplate({ ...context, agent, ...brandContext }), {
      reply: "How can I help?",
    }, { brandId: context.brandId as string | undefined, scope: "assistant" });
  }

  async runVirtualOfficeMeeting(input: VirtualOfficeMeetingRequest) {
    const brandContext = await this.getBrandContext(input.brandId);
    const baseSummary: VirtualOfficeMeetingSummary = {
      summary: `Fast sync on ${input.topic}`,
      topic: input.topic,
      scope: input.scope,
      departments: input.departments,
      recommendations: input.departments.map((dept) => ({
        department: dept,
        headline: `${dept.toUpperCase()} priorities locked`,
        summary: `Align ${dept} tasks to unblock launch and revenue.`,
        actionItems: [
          {
            department: dept,
            task: `Ship the next ${dept} milestone for ${brandContext?.brandName ?? "the brand"}`,
            owner: "AI Lead",
            impact: "Keeps momentum and learning loops alive",
          },
        ],
      })),
      agenda: (input.agenda ?? []).map((title) => ({
        title,
        desiredOutcome: "Clarified next action",
      })),
      actionItems: input.departments.map((dept) => ({
        department: dept,
        task: `Prepare ${dept} update for leadership`,
        owner: "AI Coordinator",
        dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      })),
      risks: ["Fallback summary generated - wire live AI for richer narratives"],
    };

    if (typeof (brandContext as Record<string, unknown>).brandName === "string") {
      const slug =
        typeof (brandContext as Record<string, unknown>).brandSlug === "string"
          ? ((brandContext as Record<string, unknown>).brandSlug as string)
          : undefined;
      const brandId =
        typeof input.brandId === "string"
          ? input.brandId
          : typeof (brandContext as Record<string, unknown>).brandId === "string"
            ? ((brandContext as Record<string, unknown>).brandId as string)
            : undefined;
      if (brandId) {
        baseSummary.brand = {
          id: brandId,
          name: (brandContext as Record<string, unknown>).brandName as string,
          slug,
        };
      }
    }

    return this.run<VirtualOfficeMeetingSummary>(
      "virtual-office",
      virtualOfficeMeetingTemplate({ ...input, ...brandContext }),
      baseSummary,
      { brandId: input.brandId, scope: "virtual-office" },
    );
  }

  private async getAgent(brandId: unknown, scopeOrName: string) {
    const agent =
      (await findAgentConfigByName({
        brandId: brandId as string | undefined,
        name: scopeOrName,
      })) ??
      (await findAgentConfigByScope({
        brandId: brandId as string | undefined,
        osScope: scopeOrName,
      }));
    return agent ?? (await findDefaultAgentConfig());
  }

  private async getBrandContext(brandId: unknown): Promise<Record<string, unknown>> {
    if (!brandId) return {};
    const id = String(brandId);
    const cached = brandContextCache.get(id);
    if (cached) return cached;

    const brand = await findBrandContext(id);
    if (!brand) return {};

    const context = {
      brandId: brand.id,
      brandName: brand.name,
      brandSlug: brand.slug,
      aiTone: brand.aiConfig?.aiTone ?? brand.identity?.toneOfVoice,
      aiPersonality: brand.aiConfig?.aiPersonality ?? brand.identity?.persona,
      aiContentStyle: brand.aiConfig?.aiContentStyle,
      aiBlockedTopics: tryParseJson(brand.aiConfig?.aiBlockedTopicsJson),
    };

    brandContextCache.set(id, context);
    return context;
  }

  private async run<T>(
    ns: string,
    prompt: string,
    fallback: T,
    context?: { brandId?: string | null; scope?: string },
  ) {
    const runId = createRunId();
    const request: AIRequest = {
      model: process.env.AI_MODEL_MHOS ?? "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are the MH-OS AI assistant. Follow instructions, stay concise, and deliver JSON when requested.",
        },
        { role: "user", content: prompt },
      ],
      namespace: ns,
      agentName: context?.scope ?? ns,
      brandId: context?.brandId ?? null,
      tenantId: undefined,
      requestedActions: [ns],
      runId,
    };
    await this.enforceRestrictions(context?.scope ?? ns, context?.brandId ?? undefined);

    const estimatedTokens = estimateTokens(request.messages as AIMessage[]);
    const estimatedCostUsd = estimateCostUsd(estimatedTokens, request.model);
    const manifestAgent = AgentManifestByScope[context?.scope ?? ns];
    await enforceManifestBudget({
      agent: manifestAgent ?? { name: request.agentName ?? ns, scope: context?.scope ?? ns, budgetProfile: undefined },
      estimatedTokens,
      estimatedCostUsd,
      brandId: request.brandId,
      tenantId: request.tenantId,
    });
    await enforceAgentBudget({
      agentName: request.agentName,
      brandId: request.brandId,
      tenantId: request.tenantId,
      estimatedTokens,
      estimatedCostUsd,
    });

    const key = `${context?.brandId ?? "global"}:${ns}:${hashPayload({ model: request.model, messages: request.messages })}`;
    const cached = cache.get(key) as T | null;
    if (cached) return { result: cached, cached: true };
    const primaryModel = request.model ?? process.env.AI_MODEL_MHOS ?? "gpt-4-turbo";
    const startedAt = Date.now();
    const response = await safeAIRequest(request, () => fallback, { runId });
    const latencyMs = Date.now() - startedAt;
    const raw = response.raw;
    const usedFallback =
      !raw || Boolean((raw as { status?: string } | undefined)?.status === "FALLBACK" || (raw?.modelUsed && raw.modelUsed !== primaryModel));
    const executionStatus: ExecutionStatus = raw?.success === false ? "ERROR" : usedFallback ? "FALLBACK" : "SUCCESS";

    await logExecution({
      runId,
      namespace: request.namespace ?? ns,
      agentName: request.agentName ?? ns,
      model: raw?.modelUsed ?? primaryModel,
      status: executionStatus,
      latencyMs,
      promptTokens: raw?.tokens?.prompt,
      completionTokens: raw?.tokens?.completion,
      totalTokens: raw?.tokens?.total,
      brandId: request.brandId ?? null,
      tenantId: request.tenantId ?? null,
      errorMessage: raw?.error,
    });

    if (HIGH_RISK_SCOPES.some((scope) => (context?.scope ?? ns)?.includes(scope))) {
      recordSafetyEvent({
        type: "SAFETY_CONSTRAINT",
        namespace: context?.scope ?? ns,
        agentName: request.agentName ?? ns,
        riskLevel: executionStatus === "FALLBACK" || executionStatus === "ERROR" ? "HIGH" : "MEDIUM",
        decision: executionStatus,
        detail: { latencyMs, modelUsed: raw?.modelUsed ?? primaryModel },
        brandId: request.brandId ?? null,
        tenantId: request.tenantId ?? null,
      }).catch(() => {
        /* do not break on safety logging */
      });
    }
    cache.set(key, response.result);
    return response;
  }

  private async enforceRestrictions(scope: string, brandId?: string) {
    const policies = await findRestrictionPolicies();
    if (!policies.length) return;
    for (const policy of policies) {
      const parsed = this.parseRestriction(policy.rulesJson);
      if (!parsed) continue;
      const scopeBlocked = parsed.blockedScopes?.includes(scope);
      const scopeAllowed = parsed.allowedScopes ? parsed.allowedScopes.includes(scope) : true;
      const brandBlocked = brandId && parsed.blockedBrands?.includes(brandId);
      const brandAllowed = parsed.allowedBrands ? (brandId ? parsed.allowedBrands.includes(brandId) : false) : true;
      if (parsed.denyAll || scopeBlocked || brandBlocked || !scopeAllowed || !brandAllowed) {
        throw forbidden("AI request blocked by policy");
      }
    }
  }

  private parseRestriction(payload?: string | null): {
    denyAll?: boolean;
    blockedScopes?: string[];
    allowedScopes?: string[];
    blockedBrands?: string[];
    allowedBrands?: string[];
  } | null {
    if (!payload) return null;
    try {
      const parsed = JSON.parse(payload);
      if (parsed && typeof parsed === "object") {
        const data = parsed as Record<string, unknown>;
        const asStringArray = (value: unknown) =>
          Array.isArray(value) ? (value as unknown[]).filter((v): v is string => typeof v === "string") : undefined;
        return {
          denyAll: Boolean(data.denyAll),
          blockedScopes: asStringArray(data.blockedScopes),
          allowedScopes: asStringArray(data.allowedScopes),
          blockedBrands: asStringArray(data.blockedBrands),
          allowedBrands: asStringArray(data.allowedBrands),
        };
      }
    } catch {
      return null;
    }
    return null;
  }

  private buildStandStockFallback(snapshot: StandInventoryContext[]): StandStockSuggestionOutput {
    const threshold = 8;
    const lowStock = snapshot
      .filter((item) => item.quantity <= threshold)
      .map((item) => ({
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        currentQty: item.quantity,
        suggestedQty: Math.max(threshold - item.quantity, 1),
        reason: `Fallback: quantity ${item.quantity} <= ${threshold}`,
      }));

    const slowMovers = snapshot
      .filter((item) => item.quantity > threshold && item.quantity < threshold * 2)
      .slice(0, 3)
      .map((item) => ({
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        suggestion: `Fallback: Refresh messaging around ${item.name ?? item.productId}.`,
        campaignIdea: "Bundle with bestseller for limited-time push.",
      }));

    return {
      lowStock,
      slowMovers,
      summary: lowStock.length
        ? "Fallback: Low-stock SKUs identified by threshold."
        : "Fallback: Inventory levels are in a healthy window.",
    };
  }

  private buildSalesPlanFallback(leads: SalesLeadAiContext[]): SalesRepPlanOutput {
    const prioritizedLeads = [...leads]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5)
      .map((lead) => ({
        leadId: lead.leadId,
        name: lead.name ?? "Lead",
        stage: lead.stage ?? "Unknown",
        score: lead.score,
        reason: lead.nextAction
          ? `Fallback: ${lead.nextAction}`
          : lead.stage
            ? `Fallback: Stage ${lead.stage} needs attention`
            : "Fallback: Review lead status",
      }));

    const primaryLead = prioritizedLeads[0];
    const suggestedActions = primaryLead
      ? [
          {
            leadId: primaryLead.leadId,
            type: "FOLLOW_UP",
            description: `Fallback: Call ${primaryLead.name ?? "lead"} to guard the pipeline.`,
          },
          {
            type: "PIPELINE_REVIEW",
            description: "Fallback: Share the prioritization with the team for alignment.",
          },
        ]
      : [
          {
            type: "PIPELINE_REVIEW",
            description: "Fallback: No leads tracked yet; capture updates to get AI guidance.",
          },
        ];

    const emailTemplates = primaryLead
      ? [
          {
            leadId: primaryLead.leadId,
            subject: `Quick follow-up on your interest`,
            body: `Hi there,\n\nJust circling back on our last conversation. Let me know if you need anything to move forward.\n\nBest,\nMH-OS Team`,
          },
        ]
      : undefined;

    return {
      prioritizedLeads,
      suggestedActions,
      emailTemplates,
      summary: prioritizedLeads.length
        ? "Fallback: Leads are ranked by score and next-action urgency."
        : "Fallback: No leads available yet; log opportunities to enable recommendations.",
    };
  }
}

export const aiOrchestrator = new AiOrchestrator();

function extractScope(payload: unknown) {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    return {
      brandId: obj.brandId ?? obj.brand_id ?? obj.brand ?? undefined,
      tenantId: obj.tenantId ?? obj.tenant_id ?? obj.tenant ?? undefined,
    };
  }
  return { brandId: undefined, tenantId: undefined };
}

export function makeCacheKey(namespace: string, payload: unknown, scope?: { brandId?: unknown; tenantId?: unknown }) {
  const inferredScope = extractScope(payload);
  const brandId = (scope?.brandId ?? inferredScope.brandId) as string | undefined;
  const tenantId = (scope?.tenantId ?? inferredScope.tenantId) as string | undefined;
  return `${namespace}:${hashObject({ brandId, tenantId, payload })}`;
}

export async function orchestrateAI<T>(params: {
  key: string;
  messages: AIMessage[];
  model?: string;
  fallback: () => T;
}): Promise<CachedAIResponse<T>> {
  const cacheKey = params.key;
  const cached = responseCache.get(cacheKey) as T | null;
  if (cached) {
    return { result: cached, cached: true };
  }

  const request: AIRequest = {
    model: params.model ?? process.env.AI_MODEL_MHOS ?? "gpt-4-turbo",
    messages: params.messages,
  };

  const respondWithFallback = (): CachedAIResponse<T> => {
    const fallbackResult = params.fallback();
    responseCache.set(cacheKey, fallbackResult);
    return { result: fallbackResult };
  };

  try {
    const response = await runAIRequest(request);
    if (response.success && response.content) {
      try {
        const parsed = JSON.parse(response.content) as T;
        responseCache.set(cacheKey, parsed);
        return { result: parsed, raw: response };
      } catch {
        return respondWithFallback();
      }
    }
    return respondWithFallback();
  } catch {
    return respondWithFallback();
  }
}
