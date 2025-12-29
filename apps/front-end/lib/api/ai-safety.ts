// V1 READ-ONLY — AI SAFETY API
// All mutation actions are disabled by design.
import { apiFetch } from "./client";

/**
 * V1: List safety constraints
 */
export async function listSafetyConstraints() {
  // V1 READ-ONLY: Only GET is supported
  const { data } = await apiFetch("/ai/safety/constraints");
  return data ?? [];
}

// V1 placeholder for missing export
export const listConstraints = listSafetyConstraints;

/**
 * V1: List firewall rules
 */
export async function listFirewallRules() {
  // V1 READ-ONLY: Only GET is supported
  const { data } = await apiFetch("/ai/safety/firewall-rules");
  return data ?? [];
}

/**
 * V1: List banned actions
 */
export async function listBannedActions() {
  // V1 READ-ONLY: Only GET is supported
  const { data } = await apiFetch("/ai/safety/banned-actions");
  return data ?? [];
}

/* =========================
   🚫 MUTATIONS DISABLED (V1)
   ========================= */

export async function createFirewallRule(_: Record<string, unknown>): Promise<null> {
  // V1 READ-ONLY STUB
  return null;
}

export async function createConstraint(_: Record<string, unknown>): Promise<null> {
  // V1 READ-ONLY STUB
  return null;
}

export async function createBannedAction(_: Record<string, unknown>): Promise<null> {
  // V1 READ-ONLY STUB
  return null;
}

export async function submitOversight(_: Record<string, unknown>): Promise<null> {
  // V1 READ-ONLY STUB
  return null;
}

export async function submitRedTeam(_: Record<string, unknown>): Promise<null> {
  // V1 READ-ONLY STUB
  return null;
}
