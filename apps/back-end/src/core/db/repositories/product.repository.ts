import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

export const pricingSelect = {
  id: true,
  productId: true,
  brandId: true,
  cogsEur: true,
  fullCostEur: true,
  b2cNet: true,
  b2cGross: true,
  dealerNet: true,
  dealerPlusNet: true,
  standPartnerNet: true,
  distributorNet: true,
  amazonNet: true,
  uvpNet: true,
  vatPct: true,
} satisfies Prisma.ProductPricingSelect;

export const competitorSelect = {
  id: true,
  productId: true,
  brandId: true,
  competitor: true,
  marketplace: true,
  country: true,
  priceNet: true,
  priceGross: true,
  currency: true,
  collectedAt: true,
} satisfies Prisma.CompetitorPriceSelect;

export const aiInsightSelect = {
  id: true,
  summary: true,
  details: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AIInsightSelect;

export const productSelect = {
  id: true,
  brandId: true,
  categoryId: true,
  name: true,
  slug: true,
  description: true,
  sku: true,
  status: true,
  lifecycleStage: true,
  barcode: true,
  ean: true,
  upc: true,
  qrCodeUrl: true,
  tags: true,
  marketingProfileJson: true,
  seoProfileJson: true,
  distributionProfileJson: true,
  complianceProfileJson: true,
  localizationProfileJson: true,
  socialProofJson: true,
  analyticsProfileJson: true,
  complianceDocIds: true,
  specDocIds: true,
  mediaIds: true,
  createdAt: true,
  updatedAt: true,
  pricing: { select: pricingSelect },
  competitorPrices: { select: competitorSelect, orderBy: { collectedAt: "desc" }, take: 5 },
  _count: { select: { inventoryItems: true } },
} as const satisfies Prisma.BrandProductSelect;

const productIdentifierSelect = {
  id: true,
  brandId: true,
  slug: true,
  sku: true,
} satisfies Prisma.BrandProductSelect;

const productInsightSelect = {
  id: true,
  brandId: true,
  name: true,
  description: true,
  slug: true,
  pricing: {
    select: {
      b2cNet: true,
      dealerNet: true,
      standPartnerNet: true,
    },
  },
} satisfies Prisma.BrandProductSelect;

export type ProductPayload = Prisma.BrandProductGetPayload<{ select: typeof productSelect }>;

export type ProductIdentifierPayload = Prisma.BrandProductGetPayload<{
  select: typeof productIdentifierSelect;
}>;

export type ProductInsightSubject = Prisma.BrandProductGetPayload<{
  select: typeof productInsightSelect;
}>;

export type ProductPricingPayload = Prisma.ProductPricingGetPayload<{
  select: typeof pricingSelect;
}>;

export type ProductInsightPayload = Prisma.AIInsightGetPayload<{ select: typeof aiInsightSelect }>;

export type Decimal = Prisma.Decimal;
export type JsonValue = Prisma.JsonValue;
export type InputJsonValue = Prisma.InputJsonValue;
export const DbNull = Prisma.DbNull;

export type ProductCreateInput = Prisma.BrandProductUncheckedCreateInput;
export type ProductUpdateInput = Prisma.BrandProductUncheckedUpdateInput;
export type ProductPricingUncheckedCreateInput = Prisma.ProductPricingUncheckedCreateInput;
export type ProductPricingUncheckedUpdateInput = Prisma.ProductPricingUncheckedUpdateInput;
export type ProductWhereInput = Prisma.BrandProductWhereInput;
export type ProductOrderByInput = Prisma.BrandProductOrderByWithRelationInput;

type ProductListParams = {
  where?: Prisma.BrandProductWhereInput;
  skip?: number;
  take?: number;
  orderBy?: Prisma.BrandProductOrderByWithRelationInput;
};

export async function findProductsWithCount({
  where,
  skip,
  take,
  orderBy,
}: ProductListParams): Promise<[number, ProductPayload[]]> {
  const filteredWhere = where ?? {};
  const sortedOrderBy = orderBy ?? { createdAt: "desc" };
  return prisma.$transaction([
    prisma.brandProduct.count({ where: filteredWhere }),
    prisma.brandProduct.findMany({
      where: filteredWhere,
      select: productSelect,
      orderBy: sortedOrderBy,
      skip,
      take,
    }),
  ]);
}

export async function listProducts({
  where,
  orderBy,
}: {
  where?: Prisma.BrandProductWhereInput;
  orderBy?: Prisma.BrandProductOrderByWithRelationInput;
}): Promise<ProductPayload[]> {
  return prisma.brandProduct.findMany({
    where,
    select: productSelect,
    orderBy: orderBy ?? { createdAt: "desc" },
  });
}

export async function findProductById(id: string): Promise<ProductPayload | null> {
  return prisma.brandProduct.findUnique({ where: { id }, select: productSelect });
}

export async function findProductIdentifiersById(id: string): Promise<ProductIdentifierPayload | null> {
  return prisma.brandProduct.findUnique({ where: { id }, select: productIdentifierSelect });
}

export async function findProductIdentifiersBySlug(slug: string): Promise<ProductIdentifierPayload | null> {
  return prisma.brandProduct.findUnique({ where: { slug }, select: productIdentifierSelect });
}

export async function findProductIdentifiersBySku(sku: string): Promise<ProductIdentifierPayload | null> {
  return prisma.brandProduct.findUnique({ where: { sku }, select: productIdentifierSelect });
}

export async function createProduct(data: ProductCreateInput): Promise<ProductPayload> {
  return prisma.brandProduct.create({ data, select: productSelect });
}

export async function updateProduct(id: string, data: ProductUpdateInput): Promise<ProductPayload> {
  return prisma.brandProduct.update({ where: { id }, data, select: productSelect });
}

export async function deleteProductWithDependencies(productId: string): Promise<void> {
  await prisma.$transaction([
    prisma.productPriceDraft.deleteMany({ where: { productId } }),
    prisma.competitorPrice.deleteMany({ where: { productId } }),
    prisma.productPricing.deleteMany({ where: { productId } }),
    prisma.brandProduct.delete({ where: { id: productId } }),
  ]);
}

export async function findProductForInsight(
  productId: string,
  brandId: string,
): Promise<ProductInsightSubject | null> {
  return prisma.brandProduct.findFirst({
    where: { id: productId, brandId },
    select: productInsightSelect,
  });
}

export async function createProductInsight(
  data: Prisma.AIInsightUncheckedCreateInput,
): Promise<ProductInsightPayload> {
  return prisma.aIInsight.create({ data, select: aiInsightSelect });
}

export async function findLatestProductInsight(
  productId: string,
  brandId: string,
): Promise<ProductInsightPayload | null> {
  return prisma.aIInsight.findFirst({
    where: {
      brandId,
      os: "product",
      entityType: "product",
      entityId: productId,
    },
    orderBy: { updatedAt: "desc" },
    select: aiInsightSelect,
  });
}

export async function findBrandById(brandId: string): Promise<{ id: string } | null> {
  return prisma.brand.findUnique({ where: { id: brandId }, select: { id: true } });
}

export async function findProductPricingByProductId(
  productId: string,
): Promise<ProductPricingPayload | null> {
  return prisma.productPricing.findUnique({
    where: { productId },
    select: pricingSelect,
  });
}

export async function createProductPricing(
  data: ProductPricingUncheckedCreateInput,
): Promise<ProductPricingPayload> {
  return prisma.productPricing.create({ data, select: pricingSelect });
}

export async function updateProductPricingById(
  id: string,
  data: ProductPricingUncheckedUpdateInput,
): Promise<ProductPricingPayload> {
  return prisma.productPricing.update({
    where: { id },
    data,
    select: pricingSelect,
  });
}
