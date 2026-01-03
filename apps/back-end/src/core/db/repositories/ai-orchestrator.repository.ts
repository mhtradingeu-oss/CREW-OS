import { prisma } from "../../prisma.js";

export async function findAgentConfigByBrandId(params: { brandId?: string | null }) {
  // AIAgentConfig supports only (id, brandId, brand). No per-agent configs exist in schema.
  if (!params.brandId) return null;
  return prisma.aIAgentConfig.findFirst({
    where: { brandId: params.brandId ?? undefined },
  });
}

/**
 * Default config boundary:
 * Schema does not support per-agent configs (no agentName/agentId/configJson).
 * "Default" is represented as "no record" OR handled at runtime by a fallback provider.
 */
export async function findDefaultAgentConfig() {
  return null;
}

export async function findBrandContext(id: string) {
  return prisma.brand.findUnique({
    where: { id },
    include: { aiConfig: true, identity: true },
  });
}

export async function findRestrictionPolicies() {
  return prisma.aIRestrictionPolicy.findMany({ select: { rulesJson: true } });
}
