import request from 'supertest';
import express from 'express';
import { metricsRouter } from './metrics.routes';
import { register } from './metrics.js';

describe('/metrics endpoint', () => {
  afterEach(() => {
    delete process.env.METRICS_ENABLED;
    jest.restoreAllMocks();
  });

  it('returns 200, text/plain and Prometheus metrics when enabled', async () => {
    process.env.METRICS_ENABLED = 'true';
    const app = express();
    app.get('/dummy', (req, res) => res.send('ok'));
    app.use(metricsRouter);
    await request(app).get('/dummy');
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_ms');
    expect(res.text).toContain('process_uptime_seconds');
    expect(res.text).toContain('nodejs_eventloop_lag_seconds');
  });

  it('returns 404 when disabled', async () => {
    process.env.METRICS_ENABLED = 'false';
    const app = express();
    app.use(metricsRouter);
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(404);
  });

  it('never throws and responds with a fallback when metrics collection fails', async () => {
    process.env.METRICS_ENABLED = 'true';
    jest.spyOn(register, 'metrics').mockRejectedValue(new Error('boom'));
    const app = express();
    app.use(metricsRouter);
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('crewos_metrics_collection_error');
    expect(res.text).toContain('# TYPE crewos_metrics_collection_error counter');
  });
});
