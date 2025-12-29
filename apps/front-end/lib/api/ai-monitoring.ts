// V1 READ-ONLY — AI MONITORING
import { apiFetch } from "./client";

// V1 READ-ONLY STUB
export async function fetchEngineHealth() {
  // V1 READ-ONLY: Only GET is supported
  return await apiFetch("/ai/monitoring/engine-health");
}

// V1 READ-ONLY STUB
export async function fetchTokenUsage() {
  // V1 READ-ONLY: Only GET is supported
  return await apiFetch("/ai/monitoring/token-usage");
}

// V1 READ-ONLY STUB
export async function fetchPerformanceMetrics() {
  // V1 READ-ONLY: Only GET is supported
  return await apiFetch("/ai/monitoring/performance-metrics");
}

// V1 READ-ONLY STUB
export async function fetchAgentActivity() {
  // V1 READ-ONLY: Only GET is supported
  return await apiFetch("/ai/monitoring/agent-activity");
}

// V1 READ-ONLY STUB
export async function fetchSystemAlerts() {
  // V1 READ-ONLY: Only GET is supported
  return await apiFetch("/ai/monitoring/system-alerts");
}
