import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../core/http/http-types.js';
import { getHealthConfig, getReadinessConfig } from './health.env.js';
import { dbCheck } from './readiness-checks.js';
import { eventBusCheck } from './readiness-checks.js';

export async function health(req: AuthenticatedRequest, res: Response) {
  const { HEALTH_INCLUDE_CORRELATION_ID } = getHealthConfig();
  const correlationId = req.context?.correlationId;
  const response: any = {
    status: 'ok',
    time: new Date().toISOString(),
  };
  if (HEALTH_INCLUDE_CORRELATION_ID && correlationId) {
    response.correlationId = correlationId;
  }
  res.json(response);
}

export async function ready(req: AuthenticatedRequest, res: Response) {
  const { READINESS_ENABLED, READINESS_STRICT } = getReadinessConfig();
  const correlationId = req.context?.correlationId;
  if (!READINESS_ENABLED) {
    return res.status(404).json({ status: 'not_ready', reason: 'Readiness disabled' });
  }
  const checks: any = {};
  // DB check
  const db = await dbCheck({ strict: READINESS_STRICT });
  checks.db = db;
  // Event bus check (optional)
  checks.eventBus = eventBusCheck();
  const allOk = db.ok && (checks.eventBus.ok || checks.eventBus.unknown);
  const response: any = {
    status: allOk ? 'ready' : 'not_ready',
    time: new Date().toISOString(),
    checks,
  };
  if (correlationId) response.correlationId = correlationId;
  res.status(allOk ? 200 : 503).json(response);
}
