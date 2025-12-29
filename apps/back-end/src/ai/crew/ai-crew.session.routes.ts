// ai-crew.session.routes.ts
// Express router for advisory session composition

import { Router } from 'express';
import { advisorySessionController } from './ai-crew.session.controller.js';

const router = Router();

// POST /api/v1/ai/crew/advisory/session
router.post('/session', ...advisorySessionController.postSession);

export { router as advisorySessionRouter };
