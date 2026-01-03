// scripts/seed-features.mjs
// Idempotent feature registry seeder for runtime-enforced features only
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// List of runtime-enforced features (do not add undocumented features)
const FEATURES = [
  { code: 'influencerToolkit', name: 'Influencer Toolkit', description: 'Access to influencer discovery and toolkit features.' },
  { code: 'dealer', name: 'Dealer', description: 'Dealer management features.' },
  { code: 'pricing', name: 'Pricing', description: 'Pricing module and related features.' },
  { code: 'automation', name: 'Automation', description: 'Automation engine and workflow features.' },
  { code: 'marketing', name: 'Marketing', description: 'Marketing module and campaign features.' },
  { code: 'mediaStudio', name: 'Media Studio', description: 'Media studio and content creation features.' },
  { code: 'stand', name: 'Stand', description: 'Stand management and POS features.' },
  { code: 'operations', name: 'Operations', description: 'Operations and support features.' },
  { code: 'partner', name: 'Partner', description: 'Partner management features.' },
  { code: 'voiceIVR', name: 'Voice IVR', description: 'Voice IVR and telephony features.' },
  { code: 'loyalty', name: 'Loyalty', description: 'Loyalty program features.' },
  { code: 'crm', name: 'CRM', description: 'Customer relationship management features.' },
  { code: 'governance', name: 'Governance', description: 'Governance and compliance features.' },
  { code: 'aiInsights', name: 'AI Insights', description: 'AI-powered insights and analytics.' },
  { code: 'advancedAutonomy', name: 'Advanced Autonomy', description: 'Advanced AI autonomy and agent features.' },
  { code: 'whiteLabelStudio', name: 'White Label Studio', description: 'White label studio and configurator.' },
  { code: 'competitor', name: 'Competitor', description: 'Competitor analysis features.' },
];

async function main() {
  for (const feature of FEATURES) {
    await prisma.feature.upsert({
      where: { code: feature.code },
      update: { isActive: true, name: feature.name, description: feature.description },
      create: { ...feature, isActive: true },
    });
    console.log(`✔️  Feature ensured: ${feature.code}`);
  }
  console.log('✅ Feature registry seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
