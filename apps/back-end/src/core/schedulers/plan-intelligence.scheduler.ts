import { enqueuePlanIntelligenceJob } from '../queues/plan-intelligence.queue.js';

function getTodayDate() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export async function scheduleTodayPlanIntelligenceJob() {
  const date = getTodayDate();
  await enqueuePlanIntelligenceJob(date);
}

// Example usage: node src/core/schedulers/plan-intelligence.scheduler.js
if (require.main === module) {
  scheduleTodayPlanIntelligenceJob()
    .then(() => console.log('[plan-intelligence] Scheduler ran'))
    .catch(err => console.error('[plan-intelligence] Scheduler error', err));
}
