// scripts/seed-plans.mjs
// Idempotent seeder for internal technical plans and plan-feature mappings (no pricing, no billing, no enforcement)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Minimal internal plans for each scope
const PLANS = [
  { key: 'TENANT_CORE', name: 'Tenant Core', description: 'Core plan for tenant scope', scope: 'TENANT' },
  { key: 'BRAND_AI', name: 'Brand AI', description: 'AI-enabled plan for brand scope', scope: 'BRAND' },
  { key: 'PARTNER_CORE', name: 'Partner Core', description: 'Core plan for partner scope', scope: 'PARTNER' },
  { key: 'WHITE_LABEL_FULL', name: 'White Label Full', description: 'Full white-label plan', scope: 'WHITE_LABEL' },
];

async function main() {
  // 1. Seed plans
  const planMap = {};
  for (const plan of PLANS) {
    const dbPlan = await prisma.plan.upsert({
      where: { key: plan.key },
      update: { name: plan.name, description: plan.description, scope: plan.scope, isActive: true },
      create: { ...plan, isActive: true },
    });
    planMap[plan.key] = dbPlan.id;
    console.log(`✔️  Plan ensured: ${plan.key}`);
  }

  // 2. Fetch all features
  const features = await prisma.feature.findMany({ where: { isActive: true } });
  if (!features.length) throw new Error('No features found in Feature table. Seed features first.');

  // 3. Seed PlanFeature mappings (all features for all plans)
  for (const plan of PLANS) {
    for (const feature of features) {
      await prisma.planFeature.upsert({
        where: { planId_featureId: { planId: planMap[plan.key], featureId: feature.id } },
        update: { enabled: true },
        create: { planId: planMap[plan.key], featureId: feature.id, enabled: true },
      });
      console.log(`  ↳ Feature mapped: ${plan.key} ⇨ ${feature.code}`);
    }
  }
  console.log('✅ Internal plans and plan-feature mappings seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
