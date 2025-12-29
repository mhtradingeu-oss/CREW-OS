export function getHealthConfig(): { HEALTH_INCLUDE_CORRELATION_ID: boolean } {
  return {
    HEALTH_INCLUDE_CORRELATION_ID: process.env.HEALTH_INCLUDE_CORRELATION_ID !== 'false',
  };
}

export function getReadinessConfig(): { READINESS_ENABLED: boolean; READINESS_STRICT: boolean } {
  return {
    READINESS_ENABLED: process.env.READINESS_ENABLED !== 'false',
    READINESS_STRICT: process.env.READINESS_STRICT === 'true',
  };
}
