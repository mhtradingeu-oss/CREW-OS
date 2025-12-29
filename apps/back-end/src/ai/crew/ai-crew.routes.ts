// AI Crew Advisory Routes
// Mounts advisory controller under /api/ai/crew

import { Router } from 'express';
import { aiCrewControllerRouter } from './ai-crew.controller.js';

const router = Router();

// POST /api/ai/crew/advisory
router.use('/', aiCrewControllerRouter);

export default router;
