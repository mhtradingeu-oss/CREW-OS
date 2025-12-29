import { Router } from 'express';
import { register } from './metrics.js';

const router = Router();

router.get('/metrics', async (req, res) => {
  if (process.env.METRICS_ENABLED === 'false') {
    return res.status(404).send('Not Found');
  }
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

export { router as metricsRouter };
