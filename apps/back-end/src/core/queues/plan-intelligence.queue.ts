import { Queue } from 'bullmq';
// @ts-expect-error: redis types missing, safe for stabilization
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const planIntelligenceQueue = new Queue('plan-intelligence', {
  connection: {
    host: new URL(redisUrl).hostname,
    port: Number(new URL(redisUrl).port),
    username: new URL(redisUrl).username || undefined,
    password: new URL(redisUrl).password || undefined,
  },
});

export async function enqueuePlanIntelligenceJob(date: string) {
  const jobId = `plan-intelligence-${date}`;
  await planIntelligenceQueue.add(
    'analyze-plan-intelligence',
    { date },
    {
      jobId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
  console.log(`[plan-intelligence] Job added: ${jobId}`);
}
