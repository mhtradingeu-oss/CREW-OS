import { randomUUID } from 'crypto';
import { AutomationPlan } from '../runtime/types.js';

export type AutomationAuditRecord = {
  id: string;
  createdAt: string;
  plan: AutomationPlan;
};

/**
 * Phase C: in-memory audit store (safe).
 * Later: persist to DB (AutomationRun + ActionRun).
 */
export class AutomationAudit {
  private store = new Map<string, AutomationAuditRecord>();

  write(plan: AutomationPlan): string {
    const id = randomUUID();
    const record: AutomationAuditRecord = {
      id,
      createdAt: new Date().toISOString(),
      plan,
    };
    this.store.set(id, record);
    return id;
  }

  read(id: string): AutomationAuditRecord | null {
    return this.store.get(id) ?? null;
  }
}
