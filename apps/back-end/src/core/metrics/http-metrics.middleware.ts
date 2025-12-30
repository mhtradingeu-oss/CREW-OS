import { Counter, Histogram } from 'prom-client';
import type { Request, Response, NextFunction } from 'express';
import { register } from './metrics.js';
import { sanitizeRoute } from '../http/middleware/route-utils.js';

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDurationMs = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [50, 100, 300, 500, 1000, 3000, 5000],
  registers: [register],
});

const httpErrorsTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP error responses',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export function httpMetricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const route = sanitizeRoute(req.originalUrl ?? req.path ?? 'unknown');
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };
    httpRequestsTotal.inc(labels);
    httpRequestDurationMs.observe(labels, durationMs);
    if (res.statusCode >= 400) {
      httpErrorsTotal.inc(labels);
    }
  });
  next();
}
