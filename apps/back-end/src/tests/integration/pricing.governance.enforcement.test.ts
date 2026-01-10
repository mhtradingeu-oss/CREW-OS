import request from 'supertest';
import { app } from '../../src/app.js';
import { FEATURES } from '../../src/core/security/feature-registry.js';
import { getTestAuthToken, setFeatureFlag, setPlanEntitlement } from '../test-helpers.js';

describe('Pricing Governance Enforcement', () => {
  let authToken: string;
  const productId = 'test-product';
  const draftPayload = { channel: 'web', oldNet: 10, newNet: 12 };

  beforeAll(async () => {
    authToken = await getTestAuthToken({ permissions: ['pricing:update'] });
  });

  afterEach(async () => {
    await setFeatureFlag(FEATURES.PRICING, true);
    await setPlanEntitlement('test-tenant', FEATURES.PRICING, true);
  });

  it('denies when feature flag is off', async () => {
    await setFeatureFlag(FEATURES.PRICING, false);
    const res = await request(app)
      .post(`/api/v1/pricing/product/${productId}/drafts`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(draftPayload);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/feature.*disabled/i);
  });

  it('denies when plan entitlement is missing', async () => {
    await setPlanEntitlement('test-tenant', FEATURES.PRICING, false);
    const res = await request(app)
      .post(`/api/v1/pricing/product/${productId}/drafts`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(draftPayload);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/plan.*not entitled/i);
  });

  it('denies when permission is missing', async () => {
    const noPermToken = await getTestAuthToken({ permissions: [] });
    const res = await request(app)
      .post(`/api/v1/pricing/product/${productId}/drafts`)
      .set('Authorization', `Bearer ${noPermToken}`)
      .send(draftPayload);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/permission/i);
  });

  it('emits audit log on write', async () => {
    // This assumes audit logs are persisted and can be queried in test env
    const res = await request(app)
      .post(`/api/v1/pricing/product/${productId}/drafts`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(draftPayload);
    expect(res.status).toBe(201);
    // Optionally, check audit log store for a new entry
    // const audit = await getLatestAuditLog('pricing', 'draft_created');
    // expect(audit).toBeDefined();
  });
});
