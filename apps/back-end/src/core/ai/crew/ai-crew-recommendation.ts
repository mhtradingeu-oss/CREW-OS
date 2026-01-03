import { routeInsightToCrew } from './ai-crew-router.js';
import { attachGovernanceMetadata } from './ai-crew-governance-metadata.js';
import type { InsightType } from '../governance/ai-governance-policy.js';

export function generateCrewRecommendation(insight: any): any {
  const categories = insight.categories || [];
  return categories.map((type: string) => {
    const crewRoute = routeInsightToCrew(type);
    const crewName = crewRoute.name;
    const crewRole = crewRoute.role;
    // For demo, assume PlanScope and InsightType are both 'BRAND' and RECOMMENDATION, but real logic should map these properly
    const scope = insight.scope || 'BRAND';
    const insightType: InsightType = 'RECOMMENDATION';
    return {
      crew: crewName,
      insightType,
      recommendation: `Recommended action for ${type} by ${crewName}`,
      context: insight,
      governance: attachGovernanceMetadata(
        crewRole,
        scope,
        insightType,
        insight,
      ),
    };
  });
}
