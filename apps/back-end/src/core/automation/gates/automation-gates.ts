// Phase 6: Automation Governance Gates
import type { PolicyViolation } from '../../../modules/automation/automation.types.js';

export class AutomationGates {
  static policyGatePreSave({ actionsConfigJson, triggerEvent, userRole }: { actionsConfigJson: unknown; triggerEvent: string; userRole?: string; }): PolicyViolation[] {
    // TODO: Implement secret/entropy/allowed ops checks
    // For now, always pass
    return [];
  }

  /**
   * ActivationGate: Validate before activating rule version (pre-activate)
   * Returns array of PolicyViolation if any, else empty array.
   */
  static activationGatePreActivate({ ruleVersion, policyStatus, permissions }: { ruleVersion: unknown; policyStatus: string; permissions: string[]; }): PolicyViolation[] {
    // TODO: Implement state, policy, permission checks
    // For now, always pass
    return [];
  }
}
