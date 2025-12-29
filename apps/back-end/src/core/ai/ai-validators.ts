import { safeTruncate } from "./pipeline/pipeline-utils.js";

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: string[] };

const MAX_STRING_LENGTH = 4000;
const MAX_DEPTH = 4;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function containsUnsafePattern(value: string): boolean {
  const lowered = value.toLowerCase();
  return lowered.includes("<script") || lowered.includes("javascript:") || lowered.includes("data:text/html");
}

function normalizeString(value: unknown, field: string, errors: string[]): string | undefined {
  if (typeof value !== "string") {
    if (value === undefined || value === null) return undefined;
    errors.push(`${field} must be a string`);
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (containsUnsafePattern(trimmed)) {
    errors.push(`${field} contains unsafe content`);
    return undefined;
  }
  if (trimmed.length > MAX_STRING_LENGTH) {
    errors.push(`${field} exceeds length limit`);
    return trimmed.slice(0, MAX_STRING_LENGTH);
  }
  return trimmed;
}

function normalizeNumber(value: unknown, field: string, errors: string[]): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${field} must be a finite number`);
    return undefined;
  }
  return value;
}

function normalizeArray<T>(
  value: unknown,
  field: string,
  errors: string[],
  itemNormalizer: (item: unknown, idx: number, errs: string[]) => T | undefined,
): T[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array`);
    return undefined;
  }
  const items: T[] = [];
  value.forEach((item, idx) => {
    const normalized = itemNormalizer(item, idx, errors);
    if (normalized !== undefined) items.push(normalized);
  });
  return items.length ? items : undefined;
}

function normalizeObject(
  payload: unknown,
  errors: string[],
  allowedKeys?: readonly string[],
  depth = 0,
): Record<string, unknown> | undefined {
  if (!isPlainObject(payload)) {
    errors.push("output must be an object");
    return undefined;
  }
  if (depth > MAX_DEPTH) {
    errors.push("output too deeply nested");
    return undefined;
  }

  const entries = Object.entries(payload).filter(([, value]) => value !== undefined && typeof value !== "function");
  const result: Record<string, unknown> = {};

  for (const [key, value] of entries) {
    if (allowedKeys && !allowedKeys.includes(key)) continue;

    if (typeof value === "string") {
      const normalized = normalizeString(value, key, errors);
      if (normalized !== undefined) result[key] = normalized;
      continue;
    }

    if (typeof value === "number") {
      const normalized = normalizeNumber(value, key, errors);
      if (normalized !== undefined) result[key] = normalized;
      continue;
    }

    if (typeof value === "boolean" || value === null) {
      result[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      const normalized = normalizeArray(value, key, errors, (item, idx, errs) => {
        if (typeof item === "string") return normalizeString(item, `${key}[${idx}]`, errs);
        if (typeof item === "number") return normalizeNumber(item, `${key}[${idx}]`, errs);
        if (isPlainObject(item)) {
          return normalizeObject(item, errs, undefined, depth + 1);
        }
        return undefined;
      });
      if (normalized !== undefined) result[key] = normalized;
      continue;
    }

    if (isPlainObject(value)) {
      const nested = normalizeObject(value, errors, undefined, depth + 1);
      if (nested !== undefined && Object.keys(nested).length) {
        result[key] = nested;
      }
      continue;
    }
  }

  return Object.keys(result).length ? result : undefined;
}

function ensureMeaningful(payload: Record<string, unknown> | undefined, fields: readonly string[], errors: string[]) {
  if (!payload) {
    errors.push("output is empty");
    return;
  }
  const hasMeaningful = fields.some((field) => {
    const value = payload[field];
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (isPlainObject(value)) return Object.keys(value).length > 0;
    if (typeof value === "number") return Number.isFinite(value);
    return false;
  });
  if (!hasMeaningful) {
    errors.push(`output missing meaningful fields; expected one of: ${fields.join(", ")}`);
  }
}

function validatePricing(payload: unknown): ValidationResult<Record<string, unknown>> {
  const errors: string[] = [];
  const allowed = [
    "summary",
    "recommendation",
    "recommendations",
    "rationale",
    "risks",
    "confidence",
    "channels",
    "priceNet",
    "priceGross",
    "suggestedPrice",
    "riskLevel",
    "competitorSummary",
    "actions",
    "notes",
    "details",
  ] as const;
  const data = normalizeObject(payload, errors, allowed);
  ensureMeaningful(data, allowed, errors);
  return errors.length ? { ok: false, errors } : { ok: true, data: data ?? {} };
}

function validateMarketing(payload: unknown): ValidationResult<Record<string, unknown>> {
  const errors: string[] = [];
  const allowed = [
    "summary",
    "ideas",
    "channels",
    "recommendations",
    "cta",
    "keywords",
    "plan",
    "content",
    "audience",
    "nextSteps",
    "risks",
  ] as const;
  const data = normalizeObject(payload, errors, allowed);
  ensureMeaningful(data, allowed, errors);
  return errors.length ? { ok: false, errors } : { ok: true, data: data ?? {} };
}

function validateCrm(payload: unknown): ValidationResult<Record<string, unknown>> {
  const errors: string[] = [];
  const allowed = [
    "summary",
    "nextActions",
    "emailDrafts",
    "probability",
    "reasons",
    "score",
    "followups",
    "notes",
    "risks",
  ] as const;
  const data = normalizeObject(payload, errors, allowed);
  ensureMeaningful(data, allowed, errors);
  return errors.length ? { ok: false, errors } : { ok: true, data: data ?? {} };
}

function validateSales(payload: unknown): ValidationResult<Record<string, unknown>> {
  const errors: string[] = [];
  const allowed = [
    "prioritizedTasks",
    "routeNotes",
    "risks",
    "suggestedActions",
    "plan",
    "summary",
    "nextSteps",
    "recommendations",
  ] as const;
  const data = normalizeObject(payload, errors, allowed);
  ensureMeaningful(data, allowed, errors);
  return errors.length ? { ok: false, errors } : { ok: true, data: data ?? {} };
}

function validateInventory(payload: unknown): ValidationResult<Record<string, unknown>> {
  const errors: string[] = [];
  const allowed = [
    "lowStock",
    "transfers",
    "summary",
    "risks",
    "recommendations",
  ] as const;
  const data = normalizeObject(payload, errors, allowed);
  ensureMeaningful(data, allowed, errors);
  return errors.length ? { ok: false, errors } : { ok: true, data: data ?? {} };
}

function validateFinance(payload: unknown): ValidationResult<Record<string, unknown>> {
  const errors: string[] = [];
  const allowed = [
    "summary",
    "risks",
    "allocations",
    "runwayMonths",
    "cashBalance",
    "burnRate",
    "recommendation",
  ] as const;
  const data = normalizeObject(payload, errors, allowed);
  ensureMeaningful(data, allowed, errors);
  return errors.length ? { ok: false, errors } : { ok: true, data: data ?? {} };
}

function validateOperations(payload: unknown): ValidationResult<Record<string, unknown>> {
  const errors: string[] = [];
  const allowed = [
    "summary",
    "incidents",
    "recommendations",
    "risks",
    "actions",
  ] as const;
  const data = normalizeObject(payload, errors, allowed);
  ensureMeaningful(data, allowed, errors);
  return errors.length ? { ok: false, errors } : { ok: true, data: data ?? {} };
}

function validateMedia(payload: unknown): ValidationResult<Record<string, unknown>> {
  const errors: string[] = [];
  const allowed = [
    "assets",
    "scripts",
    "shots",
    "captions",
    "summary",
    "risks",
    "nextSteps",
    "channels",
    "formats",
  ] as const;
  const data = normalizeObject(payload, errors, allowed);
  ensureMeaningful(data, allowed, errors);
  return errors.length ? { ok: false, errors } : { ok: true, data: data ?? {} };
}

function validateInfluencer(payload: unknown): ValidationResult<Record<string, unknown>> {
  const errors: string[] = [];
  const allowed = [
    "influencers",
    "offers",
    "brief",
    "summary",
    "risks",
    "actions",
    "nextSteps",
  ] as const;
  const data = normalizeObject(payload, errors, allowed);
  ensureMeaningful(data, allowed, errors);
  return errors.length ? { ok: false, errors } : { ok: true, data: data ?? {} };
}

function validateSocial(payload: unknown): ValidationResult<Record<string, unknown>> {
  const errors: string[] = [];
  const allowed = [
    "mentions",
    "trends",
    "sentiment",
    "summary",
    "actions",
    "alerts",
    "risks",
  ] as const;
  const data = normalizeObject(payload, errors, allowed);
  ensureMeaningful(data, allowed, errors);
  return errors.length ? { ok: false, errors } : { ok: true, data: data ?? {} };
}

function validateSupport(payload: unknown): ValidationResult<Record<string, unknown>> {
  const errors: string[] = [];
  const allowed = [
    "summary",
    "responses",
    "nextSteps",
    "actions",
    "priority",
    "sla",
    "risks",
    "resolution",
  ] as const;
  const data = normalizeObject(payload, errors, allowed);
  ensureMeaningful(data, allowed, errors);
  return errors.length ? { ok: false, errors } : { ok: true, data: data ?? {} };
}

function validateKnowledge(payload: unknown): ValidationResult<Record<string, unknown>> {
  const errors: string[] = [];
  const allowed = [
    "summary",
    "sections",
    "sources",
    "citations",
    "actions",
    "nextSteps",
    "risks",
  ] as const;
  const data = normalizeObject(payload, errors, allowed);
  ensureMeaningful(data, allowed, errors);
  return errors.length ? { ok: false, errors } : { ok: true, data: data ?? {} };
}

function validateGeneric(payload: unknown): ValidationResult<Record<string, unknown>> {
  const errors: string[] = [];
  const data = normalizeObject(payload, errors);
  ensureMeaningful(data, Object.keys(data ?? {}), errors);
  return errors.length ? { ok: false, errors } : { ok: true, data: data ?? {} };
}

const validatorMap: Record<string, (payload: unknown) => ValidationResult<Record<string, unknown>>> = {
  pricing: validatePricing,
  marketing: validateMarketing,
  crm: validateCrm,
  sales: validateSales,
   finance: validateFinance,
   inventory: validateInventory,
  media: validateMedia,
  influencer: validateInfluencer,
  social: validateSocial,
  support: validateSupport,
  knowledge: validateKnowledge,
   operations: validateOperations,
};

function normalizeScope(scope?: string): string {
  if (!scope) return "generic";
  const lowered = scope.toLowerCase();
  if (lowered.includes("pricing")) return "pricing";
  if (lowered.includes("marketing")) return "marketing";
  if (lowered.includes("crm")) return "crm";
  if (lowered.includes("sales")) return "sales";
  if (lowered.includes("inventory")) return "inventory";
  if (lowered.includes("finance")) return "finance";
  if (lowered.includes("media")) return "media";
  if (lowered.includes("influencer")) return "influencer";
  if (lowered.includes("social")) return "social";
  if (lowered.includes("support")) return "support";
  if (lowered.includes("operations")) return "operations";
  if (lowered.includes("knowledge")) return "knowledge";
  return lowered;
}

export function validateAgentOutput(scope: string | undefined, payload: unknown): ValidationResult<Record<string, unknown>> {
  const resolvedScope = normalizeScope(scope);
  const validator = validatorMap[resolvedScope] ?? validateGeneric;
  const result = validator(payload);
  if (!result.ok) {
    const summary = safeTruncate(payload, 500);
    return { ok: false, errors: [...result.errors, `payload_preview=${summary}`] };
  }
  return result;
}
