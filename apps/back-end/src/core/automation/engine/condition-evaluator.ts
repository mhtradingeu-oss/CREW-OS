import type { ConditionConfig } from "../../../modules/automation/automation.types.js";

export function evaluateConditions(
  conditionConfig: { all?: ConditionConfig[]; any?: ConditionConfig[] } | undefined,
  target: Record<string, unknown>,
): boolean {
  if (!conditionConfig) return true;

  const evaluateCondition = (condition: ConditionConfig): boolean => {
    const value = resolvePath(target, condition.path);
    switch (condition.op) {
      case "eq":
        return value === condition.value;
      case "neq":
        return value !== condition.value;
      case "gt": {
        const left = Number(value);
        const right = Number(condition.value);
        if (Number.isNaN(left) || Number.isNaN(right)) return false;
        return left > right;
      }
      case "lt": {
        const left = Number(value);
        const right = Number(condition.value);
        if (Number.isNaN(left) || Number.isNaN(right)) return false;
        return left < right;
      }
      case "includes":
        if (Array.isArray(value)) {
          return value.includes(condition.value);
        }
        if (typeof value === "string" && typeof condition.value === "string") {
          return value.includes(condition.value);
        }
        return false;
      default:
        return false;
    }
  };

  if (conditionConfig.all && conditionConfig.all.length) {
    const allMatched = conditionConfig.all.every((condition) => evaluateCondition(condition));
    if (!allMatched) return false;
  }

  if (conditionConfig.any && conditionConfig.any.length) {
    return conditionConfig.any.some((condition) => evaluateCondition(condition));
  }

  return true;
}

function resolvePath(target: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, target);
}
