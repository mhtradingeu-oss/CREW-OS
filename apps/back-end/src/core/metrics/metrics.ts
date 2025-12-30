import { collectDefaultMetrics, Registry } from 'prom-client';

const register = new Registry();
const eventLoopPrecisionMs = Number(process.env.METRICS_EVENT_LOOP_PRECISION_MS ?? 100);
collectDefaultMetrics({
  register,
  eventLoopMonitoringPrecision: Math.max(10, eventLoopPrecisionMs),
});

export { register };
