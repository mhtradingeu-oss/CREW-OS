describe('Finance Invoicing Integration', () => {
import request from 'supertest';
import { describe, it, expect, beforeAll } from '@jest/globals';
import { createApp } from '@/app.js';

describe('Finance Invoicing Integration', () => {
  let app;
  beforeAll(async () => {
    app = await createApp();
  });

  it('full invoice lifecycle: create, update status, generate einvoice', async () => {
    const token = 'Bearer valid-token';
    const createRes = await request(app)
      .post('/api/v1/finance/invoices')
      .set('Authorization', token)
      .send({ brandId: 'brand1', amount: 100, currency: 'USD' });
    expect(createRes.status).toBe(201);
    const invoiceId = createRes.body?.data?.id;
    const statusRes = await request(app)
      .post(`/api/v1/finance/invoices/${invoiceId}/status`)
      .set('Authorization', token)
      .send({ status: 'sent' });
    expect(statusRes.status).toBe(200);
    const einvoiceRes = await request(app)
      .post('/api/v1/finance/einvoice/generate')
      .set('Authorization', token)
      .send({ invoiceId, format: 'XRECHNUNG' });
    expect(einvoiceRes.status).toBe(201);
  });
});
