import { prisma } from "../../core/prisma.js";
import { notFound } from "../../core/http/errors.js";

export const aiAgentsService = {
  async list(filters: { brandId?: string; scope?: string }) {
    return prisma.aIAgentConfig.findMany({
      where: {
        brandId: filters.brandId,
        ...(filters.scope ? { osScope: filters.scope } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  },
  async get(id: string) {
    const agent = await prisma.aIAgentConfig.findUnique({ where: { id } });
    if (!agent) throw notFound("Agent not found");
    return agent;
  },
  async create(data: {
    name: string;
    osScope?: string;
    configJson?: unknown;
    brandId?: string;
    enabled?: boolean;
  }) {
    return prisma.aIAgentConfig.create({
      data: { ...data, configJson: data.configJson ? JSON.stringify(data.configJson) : null },
    });
  },
  async update(
    id: string,
    data: Partial<{
      name: string;
      osScope?: string;
      configJson?: unknown;
      brandId?: string;
      enabled?: boolean;
    }>,
  ) {
    await aiAgentsService.get(id);
    return prisma.aIAgentConfig.update({
      where: { id },
      data: { ...data, configJson: data.configJson ? JSON.stringify(data.configJson) : undefined },
    });
  },
  async remove(id: string) {
    await aiAgentsService.get(id);
    await prisma.aIAgentConfig.delete({ where: { id } });
    return { id };
  },
  async test(id: string, payload: Record<string, unknown>) {
    const agent = await aiAgentsService.get(id);
    return { agent, output: { echo: payload } };
  },
};
