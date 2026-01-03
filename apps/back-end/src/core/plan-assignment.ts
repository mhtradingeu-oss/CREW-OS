// src/core/plan-assignment.ts
// Passive plan assignment resolver for logs/debugging only
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Returns the effective plan key for a given entity (tenant, brand, partner, white-label)
 * Passive: does NOT enforce, block, or mutate any runtime logic
 * Usage: logs, debugging, analytics only
 */
export async function resolveEffectivePlan({ tenantId, brandId, partnerId, whiteLabelId }: {
  tenantId?: string;
  brandId?: string;
  partnerId?: string;
  whiteLabelId?: string;
} = {}) {
  if (tenantId) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { plan: { select: { key: true } } } });
    return tenant?.plan?.key ?? 'TENANT_CORE';
  }
  if (brandId) {
    const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { id: true } });
    return brand ? 'BRAND_AI' : null;
  }
  if (partnerId) {
    const partner = await prisma.partner.findUnique({ where: { id: partnerId }, select: { id: true } });
    return partner ? 'PARTNER_CORE' : null;
  }
  if (whiteLabelId) {
    const wl = await prisma.whiteLabelBrand.findUnique({ where: { id: whiteLabelId }, select: { id: true } });
    return wl ? 'WHITE_LABEL_FULL' : null;
  }
  return null;
}

// For direct SQL verification
export const verificationQueries = {
  plans: 'SELECT key, name, scope FROM "Plan" ORDER BY key;',
  assignments: `SELECT t.id as tenant_id, t.planId, p.key as plan_key FROM "Tenant" t LEFT JOIN "Plan" p ON t.planId = p.id ORDER BY t.id;`,
};

// Usage example (for logs/debugging only):
// const planKey = await resolveEffectivePlan({ tenantId: '...' });
// console.log('Effective plan:', planKey);
