// src/core/feature-usage-telemetry.ts
// Passive, async-safe, fail-silent feature usage telemetry logger
import { PrismaClient } from '@prisma/client';
import { resolveEffectivePlan } from './plan-assignment.js';

const prisma = new PrismaClient();

/**
 * Log feature usage for analytics (never blocks, never throws)
 * @param {Object} params
 * @param {string} params.featureCode
 * @param {string} [params.tenantId]
 * @param {string} [params.brandId]
 * @param {string} [params.partnerId]
 * @param {string} params.routePath
 */
export async function logFeatureUsage({ featureCode, tenantId, brandId, partnerId, routePath }: {
  featureCode: string;
  tenantId?: string;
  brandId?: string;
  partnerId?: string;
  routePath: string;
}) {
  try {
    const planKey = await resolveEffectivePlan({ tenantId, brandId, partnerId });
    const usageDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    await prisma.featureUsageDaily.upsert({
      where: {
        featureCode_planKey_tenantId_brandId_partnerId_routePath_usageDate: {
          featureCode,
          planKey: typeof planKey === "string" ? planKey : "unknown",
          tenantId: typeof tenantId === "string" ? tenantId : "unknown",
          brandId: typeof brandId === "string" ? brandId : "unknown",
          partnerId: typeof partnerId === "string" ? partnerId : "unknown",
          routePath,
          usageDate,
        },
      },
      update: { usageCount: { increment: 1 }, updatedAt: new Date() },
      create: {
        featureCode,
        planKey: typeof planKey === "string" ? planKey : "unknown",
        tenantId: typeof tenantId === "string" ? tenantId : "unknown",
        brandId: typeof brandId === "string" ? brandId : "unknown",
        partnerId: typeof partnerId === "string" ? partnerId : "unknown",
        routePath,
        usageDate,
        usageCount: 1,
      },
    });
  } catch (err) {
    // Fail-silent: never throw, never block
    if (process.env.NODE_ENV === 'development') {
      // Optionally log for debugging
      // console.error('Feature usage telemetry error:', err);
    }
  }
}