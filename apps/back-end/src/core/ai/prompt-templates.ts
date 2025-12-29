import type {
  SalesRepContextPayload,
  StandContextPayload,
} from "../../modules/ai-brain/ai-brain.types.js";

function brandContext(context: Record<string, unknown>) {
  const name = (context.brandName as string) ?? "the brand";
  const tone = (context.aiTone as string) ?? "concise, decisive, executive-friendly";
  const persona =
    (context.aiPersonality as string) ?? "operator-grade AI with barbershop discipline";
  const blocked =
    (context.aiBlockedTopics as string) ?? "medical claims, unverified promises, off-brand tone";
  return `Brand: ${name}. Persona: ${persona}. Tone: ${tone}. Avoid: ${blocked}.`;
}

function describeStandContext(context?: StandContextPayload) {
  if (!context) return "";
  const parts: string[] = [];
  if (context.standId) parts.push(`Stand ID ${context.standId}`);
  if (context.products?.length)
    parts.push(
      `Products: ${context.products.map((item) => item.name ?? item.productId).join(", ")}`,
    );
  if (context.inventorySnapshot?.length)
    parts.push(`Inventory records: ${context.inventorySnapshot.length}`);
  if (context.notes) parts.push(`Notes: ${context.notes}`);
  if (!parts.length) return "";
  return `Stand Director context (${parts.join("; ")}).`;
}

function describeSalesContext(context?: SalesRepContextPayload) {
  if (!context) return "";
  const parts: string[] = [];
  if (context.repId) parts.push(`Rep ID ${context.repId}`);
  if (context.leads?.length) parts.push(`Leads tracked: ${context.leads.length}`);
  if (context.visits?.length) parts.push(`Visits recorded: ${context.visits.length}`);
  if (context.notes) parts.push(`Notes: ${context.notes}`);
  if (!parts.length) return "";
  return `Sales Director context (${parts.join("; ")}).`;
}

export function pricingInsightTemplate(context: Record<string, unknown>) {
  return `Provide concise pricing insight JSON: {summary, riskLevel, recommendation, confidence}. ${brandContext(context)} Context: ${JSON.stringify(context)}`;
}

export function pricingSuggestionTemplate(context: Record<string, unknown>) {
  return `Act as a pricing strategist for premium grooming. Respect healthy margins, EU/German VAT rules, and avoid over-discounting. Return JSON {suggestedPrice:number, reasoning:string, riskLevel:"LOW"|"MEDIUM"|"HIGH", competitorSummary?:string, confidenceScore?:number}. ${brandContext(
    context,
  )} Context: ${JSON.stringify(context)}`;
}

export function marketingInsightTemplate(context: Record<string, unknown>) {
  return `Provide marketing insight JSON: {summary, channels, recommendation}. Keep copy direct, ingredient-aware, and free from medical claims. ${brandContext(context)} Context: ${JSON.stringify(context)}`;
}

export function crmInsightTemplate(context: Record<string, unknown>) {
  return `Provide CRM insight JSON: {summary, nextAction, score}. Prioritize decisive follow-ups and grooming-use-case empathy. ${brandContext(context)} Context: ${JSON.stringify(context)}`;
}

export function inventoryInsightTemplate(context: Record<string, unknown>) {
  return `Provide inventory insight JSON: {summary, risk, recommendation}. Flag aging SKUs and bestseller risks. ${brandContext(context)} Context: ${JSON.stringify(context)}`;
}

export function loyaltyInsightTemplate(context: Record<string, unknown>) {
  return `Provide loyalty insight JSON: {summary, action}. Encourage retention without heavy discounts. ${brandContext(context)} Context: ${JSON.stringify(context)}`;
}

export function standStockSuggestionTemplate(context: Record<string, unknown>) {
  return `Act as the Stand Director who oversees inventory reliability. Return JSON {lowStock: [{productId, sku?, name?, currentQty, suggestedQty, reason}], slowMovers: [{productId, sku?, name?, suggestion, campaignIdea?}], summary}. ${brandContext(
    context,
  )} ${describeStandContext(context.standContext as StandContextPayload | undefined)} Context: ${JSON.stringify(context)}`;
}

export function kpiNarrativeTemplate(context: Record<string, unknown>) {
  return `Create KPI narrative JSON: {overview, highlights: string[], risks: string[], nextSteps: string[], severity:"low"|"medium"|"high"}. Be executive-ready and action oriented. ${brandContext(context)} Context: ${JSON.stringify(
    context,
  )}`;
}

export function brandReportTemplate(context: Record<string, unknown>) {
  return `Create brand report JSON: {title, sections: [{title, body}], summary}. Include pricing, marketing, and product quality signals. ${brandContext(context)} Context: ${JSON.stringify(context)}`;
}

export function assistantTemplate(context: Record<string, unknown>) {
  return `Act as helpful assistant. Keep replies short, confident, and execution-focused. ${brandContext(context)} Return JSON {reply}. Context: ${JSON.stringify(context)}`;
}

export function salesRepPlanTemplate(context: Record<string, unknown>) {
  return `Act as the Sales Director. Prioritize leads and suggest next actions with measurable bets. Return JSON {prioritizedLeads:[{leadId,name?,stage?,score?,reason}], suggestedActions:[{leadId?,type,description}], emailTemplates?:[{leadId?,subject,body}], summary}. ${brandContext(
    context,
  )} ${describeSalesContext(context.salesRepContext as SalesRepContextPayload | undefined)} Context: ${JSON.stringify(context)}`;
}

export function virtualOfficeMeetingTemplate(context: Record<string, unknown>) {
  const departments = Array.isArray(context.departments)
    ? (context.departments as string[]).join(", ")
    : "multi-department";
  const topic = (context.topic as string) ?? "strategy session";
  const standSection = describeStandContext(
    context.standContext as StandContextPayload | undefined,
  );
  const salesSection = describeSalesContext(
    context.salesRepContext as SalesRepContextPayload | undefined,
  );
  return `You are the AI Chief of Staff orchestrating a virtual leadership meeting. Return concise JSON: {summary, recommendations:[{department, headline, summary, actionItems:[{department, task, owner?, dueDate?, impact?}]}], agenda:[{title, desiredOutcome, owner?, dueDate?}], actionItems:[{department, task, owner?, dueDate?, impact?}], risks:string[]}. Keep it pragmatic, sequenced, and cross-functional. Brand tone must stay executive and bias toward action. ${standSection} ${salesSection} Brand context: ${brandContext(context)} Topic: ${topic}. Departments present: ${departments}. Extra context: ${JSON.stringify(
    context,
  )}`;
}

export function financeRunwayTemplate(context: Record<string, unknown>) {
  return `Provide finance runway insights JSON: {summary, details, runwayMonths, cashBalance, burnRate}. Highlight liquidity, burn, and runway risks while respecting ${brandContext(
    context,
  )} Context data: ${JSON.stringify(context)}`;
}

export function pricingSuggestionPrompt(context: {
  productName: string;
  brandName?: string | null;
  competitorSummary?: string;
  currentNet?: number | null;
  vatPct?: number | null;
  marginHint?: string;
  strategyHint?: string;
}) {
  return `You are an AI pricing strategist. Provide a JSON response with fields: suggestedPrice, reasoning, riskLevel (LOW|MEDIUM|HIGH), competitorSummary, confidenceScore (0-1).
Product: ${context.productName}
Brand: ${context.brandName ?? "N/A"}
CurrentNet: ${context.currentNet ?? "unknown"}
VAT: ${context.vatPct ?? "unknown"}
MarginHint: ${context.marginHint ?? "protect margin"}
Strategy: ${context.strategyHint ?? "standard"}
Competitors: ${context.competitorSummary ?? "none"}`;
}

export function marketingPrompt(payload: { goal: string; tone?: string; audience?: string }) {
  return `You are a marketing strategist. Return JSON with fields: headline, body, cta, keywords (array), tone.
Goal: ${payload.goal}
Tone: ${payload.tone ?? "friendly"}
Audience: ${payload.audience ?? "broad"}`;
}

export function seoPrompt(payload: { topic: string; locale?: string }) {
  return `Generate SEO ideas as JSON: { title, keywords: string[], description } for topic ${payload.topic} locale ${payload.locale ?? "en"}.`;
}

export function captionPrompt(payload: { topic: string; platform?: string; tone?: string }) {
  return `Create short social captions as JSON: { captions: string[] } for ${payload.platform ?? "social"} about ${payload.topic} tone ${payload.tone ?? "engaging"}.`;
}

export function crmScorePrompt(payload: {
  leadName: string;
  intent?: string;
  scoreFactors?: string;
}) {
  return `You are a CRM assistant. Return JSON: { score: number (0-100), probability: number (0-1), reasons: string[], nextAction: string }.
Lead: ${payload.leadName}
Intent: ${payload.intent ?? "unknown"}
Factors: ${payload.scoreFactors ?? "recent activity"}`;
}

export function insightsPrompt(payload: { brandName: string; highlights: string }) {
  return `Produce concise executive insights as JSON: { pricingHealth, marketingSummary, inventoryRisk, nextActions: string[] } for brand ${payload.brandName}. Highlights: ${payload.highlights}`;
}
