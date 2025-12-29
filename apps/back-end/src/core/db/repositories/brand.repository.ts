// BrandRepository: Move all prisma queries from brand.service.ts here
import { prisma, type PrismaArgs } from '../../prisma.js';

export const BrandRepository = {
  async listBrandsWithCount({
    where,
    skip,
    take,
  }: PrismaArgs<typeof prisma.brand.findMany>): Promise<[number, Awaited<ReturnType<typeof prisma.brand.findMany>>]> {
    const [total, items] = (await Promise.all([
      prisma.brand.count({ where }),
      prisma.brand.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          countryOfOrigin: true,
          defaultCurrency: true,
          settingsJson: true,
          tenantId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ])) as [number, Awaited<ReturnType<typeof prisma.brand.findMany>>];
    return [total, items];
  },
  async createBrand(args: PrismaArgs<typeof prisma.brand.create>) {
    return prisma.brand.create(args);
  },
  async updateBrand(args: PrismaArgs<typeof prisma.brand.update>) {
    return prisma.brand.update(args);
  },
  async deleteBrand(args: PrismaArgs<typeof prisma.brand.delete>) {
    return prisma.brand.delete(args);
  },
  async findBrandIdentity(args: PrismaArgs<typeof prisma.brandIdentity.findUnique>) {
    return prisma.brandIdentity.findUnique(args);
  },
  async upsertBrandIdentity(args: PrismaArgs<typeof prisma.brandIdentity.upsert>) {
    return prisma.brandIdentity.upsert(args);
  },
  async createAIInsight(args: PrismaArgs<typeof prisma.aIInsight.create>) {
    return prisma.aIInsight.create(args);
  },
  async findBrandRules(args: PrismaArgs<typeof prisma.brandRules.findUnique>) {
    return prisma.brandRules.findUnique(args);
  },
  async upsertBrandRules(args: PrismaArgs<typeof prisma.brandRules.upsert>) {
    return prisma.brandRules.upsert(args);
  },
  async findBrandAIConfig(args: PrismaArgs<typeof prisma.brandAIConfig.findUnique>) {
    return prisma.brandAIConfig.findUnique(args);
  },
  async upsertBrandAIConfig(args: PrismaArgs<typeof prisma.brandAIConfig.upsert>) {
    return prisma.brandAIConfig.upsert(args);
  },
  async findBrandBySlug(args: PrismaArgs<typeof prisma.brand.findUnique>) {
    return prisma.brand.findUnique(args);
  },
  async countBrands(args: PrismaArgs<typeof prisma.brand.count>) {
    return prisma.brand.count(args);
  },
  async findUsers(args: PrismaArgs<typeof prisma.user.findMany>) {
    return prisma.user.findMany(args);
  },
  async findBrandById(args: PrismaArgs<typeof prisma.brand.findUnique>) {
    return prisma.brand.findUnique(args);
  },
};
