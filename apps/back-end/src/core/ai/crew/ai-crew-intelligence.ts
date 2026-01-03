import { PrismaClient } from '@prisma/client';
import { generateCrewRecommendation } from './ai-crew-recommendation.js';

const prisma = new PrismaClient();

export async function runAICrewIntelligence({ days = 14 } = {}) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const insights = await prisma.planIntelligenceInsight.findMany({
      where: { createdAt: { gte: since } },
    });
    for (const row of insights) {
      const recommendations = generateCrewRecommendation(row.insightJson || {});
      for (const rec of recommendations) {
        await prisma.$executeRaw`INSERT INTO "AICrewRecommendation" ("insightId", "crew", "recommendationJson", "createdAt", "updatedAt") VALUES (${row.id}, ${rec.crew}, ${rec}, NOW(), NOW()) ON CONFLICT DO NOTHING;`;
        console.log(`[ai-crew-intelligence] Recommendation stored for insight ${row.id} crew ${rec.crew}`);
      }
    }
    console.log('[ai-crew-intelligence] Intelligence run complete');
  } catch (err) {
    console.error('[ai-crew-intelligence] Intelligence run failed', err);
    // fail-silent
  }
}
