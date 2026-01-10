import { describe, it, test, expect } from "@jest/globals";
import request from 'supertest';
import express from 'express';
import { metricsRouter } from './metrics.routes';

describe('/metrics endpoint', () => {
  it('returns 200 and text/plain when enabled', async () => {
    process.env.METRICS_ENABLED = 'true';
    const app = express();
    // Add a dummy route to trigger a request for metrics
    app.get('/dummy', (req, res) => res.send('ok'));
    app.use(metricsRouter);
    // Trigger a request to increment http_requests_total
    await request(app).get('/dummy');
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('http_requests_total');
  });

  it('returns 404 when disabled', async () => {
    process.env.METRICS_ENABLED = 'false';
    const app = express();
    app.use(metricsRouter);
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(404);
  });
});
