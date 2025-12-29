import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

export async function findAgentConfigByName(params: {
  brandId?: string | null;
  name: string;
}) {
  return prisma.aIAgentConfig.findFirst({ where: { brandId: params.brandId ?? undefined, name: params.name } });
}

export async function findAgentConfigByScope(params: {
  brandId?: string | null;
  osScope: string;
}) {
  return prisma.aIAgentConfig.findFirst({ where: { brandId: params.brandId ?? undefined, osScope: params.osScope } });
}

export async function findDefaultAgentConfig() {
  return prisma.aIAgentConfig.findFirst({ where: { name: "default" } });
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
