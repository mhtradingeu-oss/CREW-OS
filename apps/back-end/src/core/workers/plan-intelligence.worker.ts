import { Worker } from 'bullmq';
import { planIntelligenceQueue } from '../queues/plan-intelligence.queue.js';
import { analyzePlanIntelligence } from '../plan-intelligence.js';
import { classifyPlanInsights } from '../ai/plan-insight-classifier.js';
import { runAICrewIntelligence } from '../ai/crew/ai-crew-intelligence.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const worker = new Worker(
  'plan-intelligence',
  async job => {
    console.log(`[plan-intelligence] Job started: ${job.id}`);
    try {
      await analyzePlanIntelligence({ days: 14 });
      await classifyPlanInsights({ days: 14 });
      await runAICrewIntelligence({ days: 14 });
      console.log(`[plan-intelligence] Job completed: ${job.id}`);
    } catch (err) {
      console.error(`[plan-intelligence] Job failed: ${job.id}`, err);
      // fail-silent
    }
  },
  {
    connection: {
      host: new URL(redisUrl).hostname,
      port: Number(new URL(redisUrl).port),
      username: new URL(redisUrl).username || undefined,
      password: new URL(redisUrl).password || undefined,
    },
  }
);

worker.on('failed', (job, err) => {
  console.error(`[plan-intelligence] Job failed: ${job?.id ?? 'unknown'}`, err);
});

worker.on('completed', job => {
  console.log(`[plan-intelligence] Job completed: ${job.id}`);
});

console.log('[plan-intelligence] Worker started');
