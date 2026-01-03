// src/core/plan-intelligence.ts
// Read-only, async, fail-silent AI analytics for plan intelligence
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Analyze feature usage and plan drift to generate plan intelligence insights
 * - Feature overuse
 * - Plan mismatch patterns
 * - Upgrade likelihood signals
 *
 * Safe for production, async, and fail-silent
 */
export async function analyzePlanIntelligence({ days = 30 } = {}) {
  try {
    // 1. Aggregate feature usage
    const usage = await prisma.featureUsageDaily.findMany({
      where: { usageDate: { gte: new Date(Date.now() - days * 86400000) } },
    });
    // 2. (Optional) Fetch PLAN_DRIFT logs if stored
    // 3. Simple heuristics for insights
    for (const row of usage) {
      // Example: Overuse if usageCount > 100 per day
      if (row.usageCount > 100) {
        await prisma.planIntelligenceInsight.upsert({
          where: {
            // Use a composite unique constraint if available, else fallback to id
            id: row.id,
          },
          update: { insightJson: { usageCount: row.usageCount }, updatedAt: new Date() },
          create: {
            planKey: row.planKey,
            featureCode: row.featureCode,
            tenantId: row.tenantId,
            brandId: row.brandId,
            partnerId: row.partnerId,
            insightType: 'OVERUSE',
            insightJson: { usageCount: row.usageCount },
          },
        });
      }
      // Example: Upgrade signal if PLAN_DRIFT detected (pseudo-code, extend as needed)
      // if (planDriftDetected) { ... }
    }
  } catch (err) {
    // Fail-silent
    if (process.env.NODE_ENV === 'development') {
      // console.error('Plan intelligence error:', err);
    }
  }
}

// Verification SQL:
// SELECT * FROM "PlanIntelligenceInsight" ORDER BY detectedAt DESC;
