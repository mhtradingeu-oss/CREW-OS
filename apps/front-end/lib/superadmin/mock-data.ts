import { PlanInfo, PlanTier } from "@mh-os/shared";

export type TenantStatus = "active" | "suspended" | "trial";

export type TenantSummary = {
  id: string;
  name: string;
  status: TenantStatus;
  plan: PlanTier;
  createdAt: string;
  domains: string[];
  brandPrimary?: string;
};

export type TenantPlanHistoryEntry = {
  id: string;
  plan: PlanTier;
  changedAt: string;
  reason: string;
};

export type TenantFeatureFlags = {
  aiBrain: boolean;
  automation: boolean;
  crm: boolean;
  marketing: boolean;
  pricing: boolean;
  support: boolean;
  loyalty: boolean;
  pos: boolean;
};

export type TenantUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "invited" | "disabled";
};

export type TenantActivity = {
  id: string;
  title: string;
  meta?: string;
  at: string;
};

export type AiAgent = {
  id: string;
  name: string;
  scope: string;
  description: string;
  autonomyLevel: "manual" | "guarded" | "autonomous";
  allowedActions: string[];
  restrictedDomains: string[];
  budgetProfile: {
    monthlyUsd: number;
    perRunUsd: number;
  };
};

export type SafetyRule = {
  id: string;
  name: string;
  category: string;
  status: "active" | "paused";
  severity: "high" | "critical" | "medium";
  description: string;
};

export type SafetyBannedAction = {
  id: string;
  action: string;
  domain: string;
  reason: string;
  status: "enforced" | "observing";
};

export type SafetyEvent = {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  agent: string;
  rule: string;
  tenant: string;
  occurredAt: string;
  status: "blocked" | "allowed" | "fallback";
};

export type AiExecution = {
  runId: string;
  agent: string;
  model: string;
  tokens: number;
  costUsd: number;
  durationMs: number;
  status: "success" | "fallback" | "error";
  tenant: string;
};

export type FallbackRecord = {
  id: string;
  runId: string;
  reason: string;
  agent: string;
  strategy: string;
  tenant: string;
};

export type ErrorRecord = {
  id: string;
  agent: string;
  message: string;
  tenant: string;
  occurredAt: string;
};

export type TenantAnalytics = {
  tenant: string;
  calls: number;
  costUsd: number;
  avgLatencyMs: number;
};

export type PlatformStatus = {
  apiUptime: string;
  dbStatus: "online" | "degraded" | "offline";
  queues: { name: string; status: "running" | "paused"; note?: string }[];
  jobs: { name: string; status: string; lastRunAt?: string; nextRunAt?: string }[];
};

export type Policy = {
  id: string;
  name: string;
  statement: Record<string, unknown>;
};

export type RbacRole = {
  code: string;
  description: string;
  permissions: string[];
};

export const planDefinitions: PlanInfo[] = [
  {
    key: "free",
    name: "Free",
    description: "Starter experience with limited AI and CRM",
    features: {
      aiLevel: "limited",
      aiBrain: false,
      aiAssistant: true,
      automation: false,
      crm: true,
      pos: false,
      stand: false,
      whiteLabel: "none",
      socialIntelligence: false,
      loyalty: false,
      aiInsights: false,
    },
  },
  {
    key: "starter",
    name: "Starter",
    description: "Core go-to-market automation with AI assist",
    features: {
      aiLevel: "basic",
      aiBrain: true,
      aiAssistant: true,
      automation: true,
      crm: true,
      pos: true,
      stand: false,
      whiteLabel: "limited",
      socialIntelligence: true,
      loyalty: false,
      aiInsights: true,
    },
  },
  {
    key: "pro",
    name: "Pro",
    description: "Multi-market growth with pricing + marketing intelligence",
    features: {
      aiLevel: "full",
      aiBrain: true,
      aiAssistant: true,
      automation: true,
      crm: true,
      pos: true,
      stand: true,
      whiteLabel: "full",
      socialIntelligence: true,
      loyalty: true,
      aiInsights: true,
    },
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "Enterprise controls, governance, and AI safety",
    features: {
      aiLevel: "full",
      aiBrain: true,
      aiAssistant: true,
      automation: true,
      crm: true,
      pos: true,
      stand: true,
      whiteLabel: "full",
      socialIntelligence: true,
      loyalty: true,
      aiInsights: true,
    },
  },
];

export const tenants: TenantSummary[] = [
  {
    id: "t-aurora",
    name: "Aurora Retail",
    status: "active",
    plan: "pro",
    createdAt: "2024-03-10T12:00:00Z",
    domains: ["aurora.ai", "shop.aurora.ai"],
    brandPrimary: "#0ea5e9",
  },
  {
    id: "t-zenlabs",
    name: "Zen Labs",
    status: "active",
    plan: "starter",
    createdAt: "2024-06-02T12:00:00Z",
    domains: ["zenlabs.io"],
    brandPrimary: "#22c55e",
  },
  {
    id: "t-harbor",
    name: "Harbor Supply",
    status: "suspended",
    plan: "starter",
    createdAt: "2023-12-18T12:00:00Z",
    domains: ["harbor-supply.com"],
    brandPrimary: "#f97316",
  },
];

export const tenantPlanHistory: Record<string, TenantPlanHistoryEntry[]> = {
  "t-aurora": [
    { id: "ph1", plan: "starter", changedAt: "2024-03-10T12:00:00Z", reason: "Pilot onboarding" },
    { id: "ph2", plan: "pro", changedAt: "2024-05-01T09:00:00Z", reason: "Pricing + AI unlock" },
  ],
  "t-zenlabs": [
    { id: "ph3", plan: "free", changedAt: "2024-06-02T12:00:00Z", reason: "Signup" },
    { id: "ph4", plan: "starter", changedAt: "2024-07-12T08:00:00Z", reason: "Enable automation" },
  ],
  "t-harbor": [
    { id: "ph5", plan: "starter", changedAt: "2023-12-18T12:00:00Z", reason: "Legacy import" },
    { id: "ph6", plan: "starter", changedAt: "2024-09-03T10:00:00Z", reason: "Suspended for billing" },
  ],
};

export const tenantFeatureFlags: Record<string, TenantFeatureFlags> = {
  "t-aurora": {
    aiBrain: true,
    automation: true,
    crm: true,
    marketing: true,
    pricing: true,
    support: true,
    loyalty: true,
    pos: true,
  },
  "t-zenlabs": {
    aiBrain: true,
    automation: true,
    crm: true,
    marketing: false,
    pricing: false,
    support: true,
    loyalty: false,
    pos: true,
  },
  "t-harbor": {
    aiBrain: true,
    automation: false,
    crm: true,
    marketing: true,
    pricing: true,
    support: true,
    loyalty: false,
    pos: false,
  },
};

export const tenantUsers: Record<string, TenantUser[]> = {
  "t-aurora": [
    { id: "u1", name: "Lena Rivers", email: "lena@aurora.ai", role: "ADMIN", status: "active" },
    { id: "u2", name: "Kai Mendes", email: "kai@aurora.ai", role: "OPERATOR", status: "active" },
  ],
  "t-zenlabs": [
    { id: "u3", name: "Ivy Chen", email: "ivy@zenlabs.io", role: "ADMIN", status: "active" },
  ],
  "t-harbor": [
    { id: "u4", name: "Mara Boyd", email: "mara@harbor-supply.com", role: "ADMIN", status: "disabled" },
  ],
};

export const tenantActivity: Record<string, TenantActivity[]> = {
  "t-aurora": [
    { id: "a1", title: "AI pricing draft published", meta: "by Lena Rivers", at: "2024-10-03T14:32:00Z" },
    { id: "a2", title: "Safety fallback triggered", meta: "agent: pricing-guard", at: "2024-10-02T09:12:00Z" },
  ],
  "t-zenlabs": [
    { id: "a3", title: "Automation paused", meta: "flow: lead-routing", at: "2024-09-28T17:45:00Z" },
  ],
  "t-harbor": [
    { id: "a4", title: "Account suspended", meta: "billing overdue", at: "2024-09-04T10:00:00Z" },
  ],
};

export const aiAgents: AiAgent[] = [
  {
    id: "agent-pricing",
    name: "Pricing Strategist",
    scope: "pricing",
    description: "Optimizes price points per region with guardrails",
    autonomyLevel: "guarded",
    allowedActions: ["draft_price", "recommend_discount"],
    restrictedDomains: ["production_change"],
    budgetProfile: { monthlyUsd: 200, perRunUsd: 2.5 },
  },
  {
    id: "agent-marketing",
    name: "Campaign Composer",
    scope: "marketing",
    description: "Generates and iterates omni-channel campaigns",
    autonomyLevel: "autonomous",
    allowedActions: ["draft_campaign", "propose_copy", "generate_assets"],
    restrictedDomains: ["send_live"],
    budgetProfile: { monthlyUsd: 300, perRunUsd: 3 },
  },
  {
    id: "agent-support",
    name: "Support Copilot",
    scope: "support",
    description: "Summarizes tickets and drafts responses",
    autonomyLevel: "manual",
    allowedActions: ["summarize", "suggest_reply"],
    restrictedDomains: ["issue_refund"],
    budgetProfile: { monthlyUsd: 120, perRunUsd: 1.2 },
  },
];

export const safetyRules: SafetyRule[] = [
  {
    id: "sr-1",
    name: "No PII Exfil",
    category: "Data",
    status: "active",
    severity: "critical",
    description: "Block export of customer PII outside tenant boundary",
  },
  {
    id: "sr-2",
    name: "Pricing Floor",
    category: "Pricing",
    status: "active",
    severity: "high",
    description: "Prevent autonomous price drops beyond floor",
  },
  {
    id: "sr-3",
    name: "No Prod Deployment",
    category: "Operations",
    status: "paused",
    severity: "medium",
    description: "Disallow direct production changes without approval",
  },
];

export const bannedActions: SafetyBannedAction[] = [
  { id: "ba-1", action: "delete_customer", domain: "crm", reason: "Irreversible", status: "enforced" },
  { id: "ba-2", action: "ship_order", domain: "logistics", reason: "Human-in-loop required", status: "observing" },
];

export const safetyEvents: SafetyEvent[] = [
  { id: "se-1", severity: "critical", agent: "pricing-guard", rule: "Pricing Floor", tenant: "Aurora Retail", occurredAt: "2024-10-03T09:12:00Z", status: "blocked" },
  { id: "se-2", severity: "high", agent: "campaign-composer", rule: "No PII Exfil", tenant: "Zen Labs", occurredAt: "2024-10-02T18:24:00Z", status: "fallback" },
  { id: "se-3", severity: "medium", agent: "support-copilot", rule: "No Prod Deployment", tenant: "Harbor Supply", occurredAt: "2024-09-30T11:40:00Z", status: "allowed" },
];

export const aiExecutions: AiExecution[] = [
  { runId: "run-1001", agent: "pricing-guard", model: "gpt-4", tokens: 12800, costUsd: 0.96, durationMs: 820, status: "success", tenant: "Aurora Retail" },
  { runId: "run-1002", agent: "campaign-composer", model: "gpt-4", tokens: 18200, costUsd: 1.23, durationMs: 1320, status: "fallback", tenant: "Zen Labs" },
  { runId: "run-1003", agent: "support-copilot", model: "gpt-3.5", tokens: 6400, costUsd: 0.22, durationMs: 540, status: "error", tenant: "Harbor Supply" },
];

export const fallbacks: FallbackRecord[] = [
  { id: "fb-1", runId: "run-1002", reason: "safety_filter", agent: "campaign-composer", strategy: "use-template", tenant: "Zen Labs" },
];

export const errors: ErrorRecord[] = [
  { id: "err-1", agent: "support-copilot", message: "Upstream timeout", tenant: "Harbor Supply", occurredAt: "2024-10-03T10:10:00Z" },
];

export const tenantAnalytics: TenantAnalytics[] = [
  { tenant: "Aurora Retail", calls: 182, costUsd: 16.4, avgLatencyMs: 950 },
  { tenant: "Zen Labs", calls: 96, costUsd: 11.2, avgLatencyMs: 1120 },
  { tenant: "Harbor Supply", calls: 12, costUsd: 1.3, avgLatencyMs: 1450 },
];

export const platformStatus: PlatformStatus = {
  apiUptime: "99.95% (30d)",
  dbStatus: "online",
  queues: [
    { name: "events", status: "running" },
    { name: "ai-tasks", status: "running" },
    { name: "email", status: "paused", note: "maintenance window" },
  ],
  jobs: [
    { name: "backups", status: "healthy", lastRunAt: "2024-10-03T02:00:00Z", nextRunAt: "2024-10-04T02:00:00Z" },
    { name: "policy-sync", status: "healthy", lastRunAt: "2024-10-03T00:30:00Z", nextRunAt: "2024-10-03T01:30:00Z" },
  ],
};

export const rbacRoles: RbacRole[] = [
  { code: "SUPER_ADMIN", description: "Full platform access", permissions: ["*"] },
  { code: "ADMIN", description: "Tenant administration", permissions: ["user:manage", "brand:manage"] },
  { code: "OPERATOR", description: "Operational runbooks", permissions: ["automation:run", "pricing:approve"] },
];

export const permissionCodes: string[] = [
  "user:manage",
  "brand:manage",
  "pricing:read",
  "pricing:approve",
  "marketing:read",
  "support:read",
  "automation:run",
  "ai:read",
];

export const policies: Policy[] = [
  {
    id: "policy-1",
    name: "AI Safety Default",
    statement: { allow: ["read"], deny: ["unsafe_action"], conditions: { tenant_status: "active" } },
  },
  {
    id: "policy-2",
    name: "Pricing Guard",
    statement: { allow: ["draft_price"], deny: ["publish_price"], conditions: { min_margin: 12 } },
  },
];

export const eventTypes: string[] = [
  "auth.session.created",
  "pricing.draft.created",
  "ai.run.started",
  "ai.run.fallback",
  "ai.safety.blocked",
];

export const brands = [
  { id: "b-aurora", name: "Aurora Retail", tenantId: "t-aurora", domain: "aurora.ai", status: "active" },
  { id: "b-zenlabs", name: "Zen Labs", tenantId: "t-zenlabs", domain: "zenlabs.io", status: "active" },
  { id: "b-harbor", name: "Harbor Supply", tenantId: "t-harbor", domain: "harbor-supply.com", status: "inactive" },
];

export const users = [
  { id: "sa-1", email: "superadmin@mh-os.ai", role: "SUPER_ADMIN", status: "active" },
  { id: "op-1", email: "ops@mh-os.ai", role: "ADMIN", status: "active" },
  { id: "sec-1", email: "security@mh-os.ai", role: "ADMIN", status: "active" },
];

export const planOverrides = [
  {
    tenantId: "t-aurora",
    overrides: {
      pricing: { aiSuggestedDiscountMax: 10 },
      ai: { safetyMode: "strict" },
    },
  },
  {
    tenantId: "t-harbor",
    overrides: {
      automation: { enabled: false },
    },
  },
];
