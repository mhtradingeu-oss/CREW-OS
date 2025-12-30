import { Router } from 'express';
import { register } from './metrics.js';
import { logger } from '../logger.js';

const router = Router();

router.get('/metrics', async (req, res) => {
  if (process.env.METRICS_ENABLED === 'false') {
    return res.status(404).send('Not Found');
  }
  res.set('Content-Type', register.contentType);
  let metricsPayload = '';
  try {
    metricsPayload = await register.metrics();
  } catch (error) {
    logger.error('metrics.collection.failed', {
      module: 'core/metrics/metrics.routes',
      correlationId: (req as any)?.context?.correlationId ?? null,
      error,
    });
    metricsPayload =
      '# HELP crewos_metrics_collection_error Metric collection failure\n' +
      '# TYPE crewos_metrics_collection_error counter\n' +
      'crewos_metrics_collection_error 1\n';
  }
  res.send(metricsPayload);
});

export { router as metricsRouter };
