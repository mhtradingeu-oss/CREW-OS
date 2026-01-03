import { AI_CREWS } from './ai-crew-registry.js';
import type { AICrewRole } from '../governance/ai-governance-policy.js';

export type CrewRoute = {
  name: string;
  role: AICrewRole;
};

function wrapCrew(name: keyof typeof AI_CREWS, role: AICrewRole): CrewRoute {
  return { name: AI_CREWS[name].name, role };
}

export function routeInsightToCrew(insightType: string): CrewRoute {
  switch (insightType) {
    case 'UPGRADE_SIGNAL':
    case 'OVERUSE':
      console.log(`[ai-crew-router] Routed to SalesAI for ${insightType}`);
      return wrapCrew('SalesAI', 'AI_SALES_REP');
    case 'PLAN_MISMATCH':
    case 'UNDERUSE':
      console.log(`[ai-crew-router] Routed to GovernanceAI for ${insightType}`);
      return wrapCrew('GovernanceAI', 'AI_ANALYST');
    case 'WHITE_LABEL_READY':
      console.log(`[ai-crew-router] Routed to WhiteLabelAI for ${insightType}`);
      return wrapCrew('WhiteLabelAI', 'AI_KNOWLEDGE_MANAGER');
    case 'PARTNER_EXPANSION':
      console.log(`[ai-crew-router] Routed to PartnerAI for ${insightType}`);
      return wrapCrew('PartnerAI', 'AI_SOCIAL_INTELLIGENCE');
    default:
      console.log(`[ai-crew-router] Routed to GrowthAI for ${insightType}`);
      return wrapCrew('GrowthAI', 'AI_MARKETER');
  }
}
