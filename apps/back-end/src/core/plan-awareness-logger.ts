// src/core/plan-awareness-logger.ts
// Passive, async-safe, fail-silent plan awareness logger (soft warnings only)
import { PrismaClient } from '@prisma/client';
import { resolveEffectivePlan } from './plan-assignment.js';

const prisma = new PrismaClient();

/**
 * Log a soft warning if a feature is accessed outside the assigned plan
 * Never blocks, never throws, never changes runtime behavior
 * @param {Object} params
 * @param {string} params.featureCode
 * @param {string} [params.tenantId]
 * @param {string} [params.brandId]
 * @param {string} [params.partnerId]
 * @param {string} params.routePath
 */
export async function logPlanAwareness({ featureCode, tenantId, brandId, partnerId, routePath }: {
  featureCode: string;
  tenantId?: string;
  brandId?: string;
  partnerId?: string;
  routePath: string;
}) {
  try {
    const planKey = await resolveEffectivePlan({ tenantId, brandId, partnerId });
    if (!planKey) return;
    // Find plan and feature
    const plan = await prisma.plan.findUnique({ where: { key: planKey }, select: { id: true } });
    const feature = await prisma.feature.findUnique({ where: { code: featureCode }, select: { id: true } });
    if (!plan || !feature) return;
    // Check if feature is enabled for this plan
    const planFeature = await prisma.planFeature.findUnique({
      where: { planId_featureId: { planId: plan.id, featureId: feature.id } },
      select: { enabled: true },
    });
    if (!planFeature || !planFeature.enabled) {
      // Log a soft warning (PLAN_DRIFT)
      const warning = {
        type: 'PLAN_DRIFT',
        featureCode,
        planKey,
        tenantId,
        brandId,
        partnerId,
        routePath,
        timestamp: new Date().toISOString(),
      };
      if (process.env.NODE_ENV !== 'production') {
        // Optionally log to console for diagnostics
        console.warn('[PLAN_DRIFT]', warning);
      }
      // Optionally: store in a diagnostics table or external log aggregator
    }
  } catch (err) {
    // Fail-silent: never throw, never block
    if (process.env.NODE_ENV === 'development') {
      // console.error('Plan awareness logger error:', err);
    }
  }
}