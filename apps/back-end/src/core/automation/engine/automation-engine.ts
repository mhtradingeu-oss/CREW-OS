// Minimal runner wrapper for Automation OS
export async function runAutomationPlan(plan: any, opts: { actorUserId?: string, correlationId?: string }) {
  // Simulate execution; in real system, delegate to Automation OS
  return { result: 'success', plan, actor: opts.actorUserId, correlationId: opts.correlationId };
}
