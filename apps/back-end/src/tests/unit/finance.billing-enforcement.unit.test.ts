import request from 'supertest';
import { describe, it, expect, beforeAll } from '@jest/globals';
import { createApp } from '@/app.js';
import { FEATURES } from '@/core/security/feature-registry.js';

describe('Billing/Invoice Enforcement', () => {
  let app;
  beforeAll(async () => {
    app = await createApp();
  });

  it('allows invoice creation with all entitlements', async () => {
    const res = await request(app)
      .post('/api/v1/finance/invoices')
      .set('Authorization', 'Bearer valid-token')
      .send({ brandId: 'brand1', amount: 100, currency: 'USD' });
    expect(res.status).toBe(201);
  });

  it('denies when feature is disabled', async () => {
    const res = await request(app)
      .post('/api/v1/finance/invoices')
      .set('Authorization', 'Bearer no-feature-token')
      .send({ brandId: 'brand1', amount: 100, currency: 'USD' });
    expect(res.status).toBe(403);
  });

  it('denies when plan entitlement is missing', async () => {
    const res = await request(app)
      .post('/api/v1/finance/invoices')
      .set('Authorization', 'Bearer free-plan-token')
      .send({ brandId: 'brand1', amount: 100, currency: 'USD' });
    expect(res.status).toBe(403);
  });

  it('denies when permission is missing', async () => {
    const res = await request(app)
      .post('/api/v1/finance/invoices')
      .set('Authorization', 'Bearer no-perm-token')
      .send({ brandId: 'brand1', amount: 100, currency: 'USD' });
    expect(res.status).toBe(403);
  });
});
