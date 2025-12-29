import { Router } from 'express';
import { health, ready } from './health.controller.js';

const router = Router();

router.get('/health', health);
router.get('/ready', ready);

export { router as healthRouter };
