import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  'UPGRADE_SIGNAL',
  'PLAN_MISMATCH',
  'OVERUSE',
  'UNDERUSE',
  'WHITE_LABEL_READY',
  'PARTNER_EXPANSION',
];

function classify(insight: any): string[] {
  const categories: string[] = [];
  // Example logic (replace with real rules as needed)
  if (insight.usage && insight.usage > insight.planLimit) categories.push('OVERUSE');
  if (insight.usage && insight.usage < insight.planLimit * 0.2) categories.push('UNDERUSE');
  if (insight.planMismatch) categories.push('PLAN_MISMATCH');
  if (insight.upgradeRecommended) categories.push('UPGRADE_SIGNAL');
  if (insight.whiteLabelReady) categories.push('WHITE_LABEL_READY');
  if (insight.partnerExpansion) categories.push('PARTNER_EXPANSION');
  return categories;
}

export async function classifyPlanInsights({ days = 14 } = {}) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const insights = await prisma.planIntelligenceInsight.findMany({
      where: { createdAt: { gte: since } },
    });
    for (const row of insights) {
      let insightJson = row.insightJson || {};
      const categories = classify(insightJson);
      if (typeof insightJson === 'object' && insightJson !== null && 'categories' in insightJson) {
        (insightJson as any).categories = categories;
      }
      await prisma.planIntelligenceInsight.update({
        where: { id: row.id },
        data: { insightJson },
      });
      console.log(`[plan-insight-classifier] Classified insight ${row.id}: ${categories.join(', ')}`);
    }
    console.log('[plan-insight-classifier] Classification complete');
  } catch (err) {
    console.error('[plan-insight-classifier] Classification failed', err);
    // fail-silent
  }
}
