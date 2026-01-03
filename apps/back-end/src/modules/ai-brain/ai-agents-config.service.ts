import { AI_AGENTS_MANIFEST, type AIAgentDefinition } from "../../ai/schema/ai-agents-manifest.js";
import { prisma } from "../../core/prisma.js";
import { notFound } from "../../core/http/errors.js";

export type AgentAutonomyLevel = "AUTO_DISABLED" | "AUTO_LOW_RISK_ONLY" | "AUTO_FULL";
export type AgentRiskLevel = "low" | "medium" | "high";

export type AgentConfigOverride = {
  autonomyLevel?: AgentAutonomyLevel;
  maxRiskLevel?: AgentRiskLevel;
  enabledContexts?: string[];
  notes?: string;
};

export type AgentConfigRecord = {
  agentId: string;
  label: string;
  scope: string;
  capabilities: string[];
  defaultAutonomyLevel: AgentAutonomyLevel;
  defaultContexts: string[];
  autonomyLevel: AgentAutonomyLevel;
  maxRiskLevel: AgentRiskLevel;
  enabledContexts: string[];
  notes?: string;
  safety?: AIAgentDefinition["safety"];
  brandId?: string;
};

type StoredConfig = {
  global?: AgentConfigOverride;
  overridesByBrand?: Record<string, AgentConfigOverride>;
};

function parseConfigJson(configJson?: string | null): StoredConfig {
  if (!configJson) return {};
  try {
    return JSON.parse(configJson) as StoredConfig;
  } catch {
    return {};
  }
}

function buildDefaults(def: AIAgentDefinition): AgentConfigRecord {
  const defaultContexts = def.inputContexts.map((ctx) => ctx.name);
  const defaultAutonomyLevel: AgentAutonomyLevel = "AUTO_DISABLED";
  return {
    agentId: def.name,
    label: def.description ?? def.name,
    scope: def.scope,
    capabilities: def.capabilities,
    defaultAutonomyLevel,
    defaultContexts,
    autonomyLevel: defaultAutonomyLevel,
    maxRiskLevel: "medium",
    enabledContexts: defaultContexts,
    safety: def.safety,
  };
}

function mergeOverride(base: AgentConfigRecord, override?: AgentConfigOverride): AgentConfigRecord {
  if (!override) return base;
  return {
    ...base,
    autonomyLevel: override.autonomyLevel ?? base.autonomyLevel,
    maxRiskLevel: override.maxRiskLevel ?? base.maxRiskLevel,
    enabledContexts: override.enabledContexts ?? base.enabledContexts,
    notes: override.notes ?? base.notes,
  };
}

async function loadRecord(agentId: string) {
  // Schema does not support per-agent config (no name/configJson/osScope)
  // Only brandId is available. Return empty config.
  return { record: null, stored: {} };
}

async function upsertConfig(agentId: string, stored: StoredConfig, scope?: string) {
  // Schema does not support per-agent config (no name/configJson/osScope)
  // No-op: cannot persist config
  return null;
}

function pickOverride(stored: StoredConfig, brandId?: string): AgentConfigOverride | undefined {
  if (brandId && stored.overridesByBrand?.[brandId]) return stored.overridesByBrand[brandId];
  return stored.global;
}

function applyOverrides(
  def: AIAgentDefinition,
  stored: StoredConfig,
  brandId?: string,
): AgentConfigRecord {
  const base = buildDefaults(def);
  const override = pickOverride(stored, brandId);
  const merged = mergeOverride(base, override);
  return brandId ? { ...merged, brandId } : merged;
}

export const aiAgentsConfigService = {
  async list(payload?: { brandId?: string }) {
    // Schema does not support per-agent config; return manifest defaults only
    const defs = AI_AGENTS_MANIFEST;
    return defs.map((def) => applyOverrides(def, {}, payload?.brandId));
  },

  async get(agentId: string, payload?: { brandId?: string }): Promise<AgentConfigRecord> {
    const def = AI_AGENTS_MANIFEST.find((item) => item.name === agentId);
    if (!def) throw notFound("Agent not found in manifest");
    // Schema does not support per-agent config; always return manifest default
    return applyOverrides(def, {}, payload?.brandId);
  },

  async update(agentId: string, payload: AgentConfigOverride & { brandId?: string }) {
    // Schema does not support per-agent config; update is a no-op
    const def = AI_AGENTS_MANIFEST.find((item) => item.name === agentId);
    if (!def) throw notFound("Agent not found in manifest");
    return applyOverrides(def, {}, payload?.brandId);
  },
};
