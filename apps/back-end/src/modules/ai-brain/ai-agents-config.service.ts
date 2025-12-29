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
  const record = await prisma.aIAgentConfig.findUnique({ where: { name: agentId } });
  const stored = parseConfigJson(record?.configJson);
  return { record, stored };
}

async function upsertConfig(agentId: string, stored: StoredConfig, scope?: string) {
  return prisma.aIAgentConfig.upsert({
    where: { name: agentId },
    update: {
      configJson: JSON.stringify(stored),
      osScope: scope,
    },
    create: {
      name: agentId,
      osScope: scope,
      configJson: JSON.stringify(stored),
    },
  });
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
    const defs = AI_AGENTS_MANIFEST;
    const configs = await prisma.aIAgentConfig.findMany();
    const storedByAgent = new Map(configs.map((cfg) => [cfg.name, parseConfigJson(cfg.configJson)]));

    return defs.map((def) => {
      const stored = storedByAgent.get(def.name) ?? {};
      return applyOverrides(def, stored, payload?.brandId);
    });
  },

  async get(agentId: string, payload?: { brandId?: string }): Promise<AgentConfigRecord> {
    const def = AI_AGENTS_MANIFEST.find((item) => item.name === agentId);
    if (!def) throw notFound("Agent not found in manifest");
    const { stored } = await loadRecord(agentId);
    return applyOverrides(def, stored, payload?.brandId);
  },

  async update(agentId: string, payload: AgentConfigOverride & { brandId?: string }) {
    const def = AI_AGENTS_MANIFEST.find((item) => item.name === agentId);
    if (!def) throw notFound("Agent not found in manifest");

    const { stored } = await loadRecord(agentId);
    const next: StoredConfig = {
      global: stored.global,
      overridesByBrand: stored.overridesByBrand ?? {},
    };

    if (payload.brandId) {
      next.overridesByBrand = {
        ...next.overridesByBrand,
        [payload.brandId]: {
          ...(next.overridesByBrand?.[payload.brandId] ?? {}),
          autonomyLevel: payload.autonomyLevel,
          maxRiskLevel: payload.maxRiskLevel,
          enabledContexts: payload.enabledContexts,
          notes: payload.notes,
        },
      };
    } else {
      next.global = {
        ...(next.global ?? {}),
        autonomyLevel: payload.autonomyLevel,
        maxRiskLevel: payload.maxRiskLevel,
        enabledContexts: payload.enabledContexts,
        notes: payload.notes,
      };
    }

    await upsertConfig(agentId, next, def.scope);
    return this.get(agentId, { brandId: payload.brandId });
  },
};
