import { PrismaClient } from '@prisma/client';

/**
 * IMPORTANT:
 * - Use a singleton PrismaClient to avoid connection explosion
 * - Especially important in Jest / watch / hot reload
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'test' ? [] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Allowed classification categories
 * (kept as const for safety & autocomplete)
 */
export const CATEGORIES = [
  'UPGRADE_SIGNAL',
  'PLAN_MISMATCH',
  'OVERUSE',
  'UNDERUSE',
  'WHITE_LABEL_READY',
  'PARTNER_EXPANSION',
] as const;

type Category = (typeof CATEGORIES)[number];

/**
 * Classify a single insight JSON
 */
function classify(insight: Record<string, any>): Category[] {
  const categories: Category[] = [];

  if (insight.usage != null && insight.planLimit != null) {
    if (insight.usage > insight.planLimit) categories.push('OVERUSE');
    if (insight.usage < insight.planLimit * 0.2) categories.push('UNDERUSE');
  }

  if (insight.planMismatch) categories.push('PLAN_MISMATCH');
  if (insight.upgradeRecommended) categories.push('UPGRADE_SIGNAL');
  if (insight.whiteLabelReady) categories.push('WHITE_LABEL_READY');
  if (insight.partnerExpansion) categories.push('PARTNER_EXPANSION');

  return categories;
}

/**
 * Classifies recent plan intelligence insights
 */
export async function classifyPlanInsights(
  { days = 14 }: { days?: number } = {},
): Promise<void> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const insights = await prisma.planIntelligenceInsight.findMany({
      where: {
        createdAt: { gte: since },
      },
    });

    for (const row of insights) {
      const insightJson =
        typeof row.insightJson === 'object' && row.insightJson !== null
          ? { ...(row.insightJson as Record<string, any>) }
          : {};

      const categories = classify(insightJson);

      insightJson.categories = categories;

      await prisma.planIntelligenceInsight.update({
        where: { id: row.id },
        data: { insightJson },
      });

      console.log(
        `[plan-insight-classifier] Classified insight ${row.id}: ${categories.join(', ')}`,
      );
    }

    console.log('[plan-insight-classifier] Classification complete');
  } catch (err) {
    console.error('[plan-insight-classifier] Classification failed', err);
    // fail-silent by design
  }
}
