
import { findAutomationRuleVersions } from "../../db/repositories/automation.repository.js";
import { logger } from "../../logger.js";
import type { DomainEvent } from "../../events/domain/types.js";
import type { ActionConfig, ConditionConfig } from "../../../modules/automation/automation.types.js";

export interface AutomationRuleMatch {
  id: string;
  name: string;
  description?: string;
  brandId?: string;
  conditionConfig?: { all?: ConditionConfig[]; any?: ConditionConfig[] };
  actions?: ActionConfig[];
  ruleVersionId: string;
  triggerEvent: string; // أضفنا هذا الحقل لتوافق مع الفلترة
}


export async function loadMatchingRulesForEvent(event: DomainEvent): Promise<AutomationRuleMatch[]> {
  const mockRules = loadMockRulesFromEnv(event);
  if (mockRules) {
    logger.info(
      `[automation][rule-matcher] using ${mockRules.length} mock rule(s) for ${event.type}`,
    );
    return mockRules;
  }

  const brandIdValue = event.meta?.brandId ?? null;

  // Query AutomationRuleVersion (ACTIVE only), join AutomationRule for brand/state
  const rows = await findAutomationRuleVersions({
    where: {
      state: 'ACTIVE',
      triggerEvent: event.type,
      rule: {
        state: 'ACTIVE',
        OR: [
          { brandId: null },
          { brandId: brandIdValue },
        ],
      },
    },
    include: {
      rule: {
        select: {
          id: true,
          name: true,
          description: true,
          brandId: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.rule.id,
    name: row.rule.name,
    description: row.rule.description ?? undefined,
    brandId: row.rule.brandId ?? undefined,
    triggerEvent: row.triggerEvent, // إضافة triggerEvent من صف ruleVersion
    conditionConfig: parseConditionConfig(row.conditionConfigJson),
    actions: parseActions(row.actionsConfigJson),
    ruleVersionId: row.id,
  }));
}

import type { JsonValue } from "../../db/repositories/automation.repository.js";

function parseConditionConfig(
  value?: JsonValue | null,
): { all?: ConditionConfig[]; any?: ConditionConfig[] } | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== 'object' || parsed === null) return undefined;
      return parsed as { all?: ConditionConfig[]; any?: ConditionConfig[] };
    } catch {
      logger.warn('[automation][rule-matcher] invalid condition config JSON', {});
      return undefined;
    }
  }
  if (typeof value === 'object' && value !== null) {
    return value as { all?: ConditionConfig[]; any?: ConditionConfig[] };
  }
  return undefined;
}

function parseActions(value?: JsonValue | null): ActionConfig[] {
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== 'object') return [];
      const actions = Array.isArray((parsed as { actions?: unknown }).actions)
        ? ((parsed as { actions: unknown }).actions as ActionConfig[])
        : [];
      return actions;
    } catch {
      logger.warn('[automation][rule-matcher] invalid actions config JSON', {});
      return [];
    }
  }
  if (typeof value === 'object' && value !== null) {
    const actions = Array.isArray((value as { actions?: unknown }).actions)
      ? ((value as { actions: unknown }).actions as ActionConfig[])
      : [];
    return actions;
  }
  return [];
}

function loadMockRulesFromEnv(event: DomainEvent): AutomationRuleMatch[] | undefined {
  const raw = process.env.AUTOMATION_ENGINE_MOCK_RULES;
  if (!raw) return undefined;

  try {
    const candidates = JSON.parse(raw) as AutomationRuleMatch[];
    const filtered = candidates.filter(
      (rule) => rule.triggerEvent === event.type,
    );
    return filtered.map((rule) => ({ ...rule, actions: rule.actions ?? [] }));
  } catch (err) {
    logger.warn("[automation][rule-matcher] invalid mock rules payload", { error: err });
    return undefined;
  }
}
