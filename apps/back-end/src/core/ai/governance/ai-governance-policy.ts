// AI Governance Policy Definitions
// Defines which AI Crew can propose what, based on PlanScope and InsightType
// PHASE 3.0 — AI Governance & Safety Layer (Read-Only)

export type PlanScope = 'BRAND' | 'PRODUCT' | 'PRICING' | 'CRM' | 'MARKETING' | 'SALES' | 'INVENTORY' | 'LOYALTY' | 'AUTOMATION' | 'KNOWLEDGE' | 'SUPPORT' | 'FINANCE' | 'SOCIAL_INTELLIGENCE' | 'OPERATIONS';

export type InsightType =
  | 'PERFORMANCE'
  | 'RISK'
  | 'OPPORTUNITY'
  | 'ANOMALY'
  | 'BENCHMARK'
  | 'RECOMMENDATION'
  | 'COMPLIANCE'
  | 'STRATEGY';

export type AICrewRole =
  | 'AI_ANALYST'
  | 'AI_PLANNER'
  | 'AI_PRICER'
  | 'AI_MARKETER'
  | 'AI_SALES_REP'
  | 'AI_SUPPORT_AGENT'
  | 'AI_AUTOMATOR'
  | 'AI_KNOWLEDGE_MANAGER'
  | 'AI_SOCIAL_INTELLIGENCE';

export interface AIGovernancePolicy {
  crewRole: AICrewRole;
  allowedScopes: PlanScope[];
  allowedInsightTypes: InsightType[];
  description?: string;
}

// Example policy definitions
export const AI_GOVERNANCE_POLICIES: AIGovernancePolicy[] = [
  {
    crewRole: 'AI_ANALYST',
    allowedScopes: ['BRAND', 'PRODUCT', 'PRICING', 'CRM', 'MARKETING', 'SALES', 'INVENTORY', 'LOYALTY', 'SUPPORT', 'FINANCE', 'SOCIAL_INTELLIGENCE', 'OPERATIONS'],
    allowedInsightTypes: ['PERFORMANCE', 'RISK', 'ANOMALY', 'BENCHMARK', 'COMPLIANCE'],
    description: 'AI Analyst can propose performance, risk, anomaly, benchmark, and compliance insights across all domains.'
  },
  {
    crewRole: 'AI_PLANNER',
    allowedScopes: ['BRAND', 'PRODUCT', 'PRICING', 'CRM', 'MARKETING', 'SALES', 'INVENTORY', 'LOYALTY', 'AUTOMATION', 'KNOWLEDGE', 'SUPPORT', 'FINANCE', 'SOCIAL_INTELLIGENCE', 'OPERATIONS'],
    allowedInsightTypes: ['STRATEGY', 'OPPORTUNITY', 'RECOMMENDATION'],
    description: 'AI Planner can propose strategy, opportunity, and recommendation insights across all domains.'
  },
  {
    crewRole: 'AI_PRICER',
    allowedScopes: ['PRICING', 'PRODUCT'],
    allowedInsightTypes: ['PERFORMANCE', 'RISK', 'OPPORTUNITY', 'RECOMMENDATION'],
    description: 'AI Pricer can propose pricing and product-related insights.'
  },
  {
    crewRole: 'AI_MARKETER',
    allowedScopes: ['MARKETING'],
    allowedInsightTypes: ['OPPORTUNITY', 'RECOMMENDATION', 'PERFORMANCE'],
    description: 'AI Marketer can propose marketing opportunities and recommendations.'
  },
  {
    crewRole: 'AI_SALES_REP',
    allowedScopes: ['SALES', 'CRM'],
    allowedInsightTypes: ['OPPORTUNITY', 'RECOMMENDATION', 'PERFORMANCE'],
    description: 'AI Sales Rep can propose sales and CRM opportunities and recommendations.'
  },
  {
    crewRole: 'AI_SUPPORT_AGENT',
    allowedScopes: ['SUPPORT'],
    allowedInsightTypes: ['ANOMALY', 'RISK', 'RECOMMENDATION'],
    description: 'AI Support Agent can propose support anomalies, risks, and recommendations.'
  },
  {
    crewRole: 'AI_AUTOMATOR',
    allowedScopes: ['AUTOMATION'],
    allowedInsightTypes: ['OPPORTUNITY', 'RECOMMENDATION'],
    description: 'AI Automator can propose automation opportunities and recommendations.'
  },
  {
    crewRole: 'AI_KNOWLEDGE_MANAGER',
    allowedScopes: ['KNOWLEDGE'],
    allowedInsightTypes: ['RECOMMENDATION', 'COMPLIANCE'],
    description: 'AI Knowledge Manager can propose knowledge recommendations and compliance insights.'
  },
  {
    crewRole: 'AI_SOCIAL_INTELLIGENCE',
    allowedScopes: ['SOCIAL_INTELLIGENCE'],
    allowedInsightTypes: ['PERFORMANCE', 'OPPORTUNITY', 'RECOMMENDATION'],
    description: 'AI Social Intelligence can propose social performance, opportunities, and recommendations.'
  }
];

export function getAIGovernancePolicy(crewRole: AICrewRole): AIGovernancePolicy | undefined {
  return AI_GOVERNANCE_POLICIES.find(p => p.crewRole === crewRole);
}

export function isProposalAllowed(crewRole: AICrewRole, scope: PlanScope, insightType: InsightType): boolean {
  const policy = getAIGovernancePolicy(crewRole);
  if (!policy) return false;
  return policy.allowedScopes.includes(scope) && policy.allowedInsightTypes.includes(insightType);
}
