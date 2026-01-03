import request from 'supertest';
import { createApp } from '../../../app.js';
import { prisma } from '../../../core/prisma.js';


describe('AI Autonomy Integration', () => {
  let suggestionId: string;
  const testBrandId = 'test-brand';
  const testTenantId = 'test-tenant';
  const testUserId = 'test-user';
  const app = createApp();

  afterAll(async () => {
    if (suggestionId) {
      await prisma.aISuggestion.delete({ where: { id: suggestionId } });
    }
    await prisma.$disconnect();
  });

  it('should create a pending autonomy task and query it', async () => {
    // Simulate enqueue
    const res = await request(app)
      .post('/api/v1/ai/autonomy/run-cycle')
      .send({ brandId: testBrandId, tenantId: testTenantId, dryRun: true, autoExecute: false });
    expect(res.status).toBe(200);
    // Find a pending suggestion
    const pending = await prisma.aISuggestion.findFirst({ where: { status: 'pending', brandId: testBrandId } });
    expect(pending).toBeTruthy();
    suggestionId = pending!.id;
    // Query pending endpoint
    const pendingRes = await request(app)
      .get('/api/v1/ai/autonomy/pending?brandId=' + testBrandId)
      .set('Authorization', 'Bearer test-token');
    expect(pendingRes.status).toBe(200);
    expect(Array.isArray(pendingRes.body.data)).toBe(true);
    expect(pendingRes.body.data.some((t: any) => t.taskId === suggestionId)).toBe(true);
  });

  it('should approve the pending autonomy task', async () => {
    // Approve
    const approveRes = await request(app)
      .post(`/api/v1/ai/autonomy/approve/${suggestionId}`)
      .set('Authorization', 'Bearer test-token')
      .send();
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('approved');
    // Check DB
    const approved = await prisma.aISuggestion.findUnique({ where: { id: suggestionId } });
    expect(approved?.status).toBe('approved');
    expect(approved?.approvedAt).toBeTruthy();
  });
});
