/**
 * PRODUCT SERVICE — MH-OS v2
 * Spec: docs/os/03_product-master.md (MASTER_INDEX)
 */
import { badRequest, forbidden, notFound } from "../../core/http/errors.js";
import { buildPagination } from "../../core/utils/pagination.js";
import {
  emitProductCreated,
  emitProductDeleted,
  emitProductImportCompleted,
  emitProductUpdated,
} from "./product.events.js";
import { makeCacheKey, orchestrateAI } from "../../core/ai/orchestrator.js";
import type { EventContext } from "../../core/events/event-bus.js";
import type {
  CreateProductInput,
  PaginatedProducts,
  ProductExportFilters,
  ProductExportResult,
  ProductImportItem,
  ProductImportPayload,
  ProductImportResult,
  ProductInsightResponse,
  ProductMediaPayload,
  ProductPricingSnapshot,
  ProductResponse,
  UpdateProductInput,
} from "./product.types.js";
import type { ProductFilters } from "./product.types.js"; // Added missing import
import {
  DbNull,
  Decimal,
  InputJsonValue,
  JsonValue,
  ProductCreateInput,
  ProductIdentifierPayload,
  ProductInsightPayload,
  ProductInsightSubject,
  ProductPayload,
  ProductPricingPayload,
  ProductPricingUncheckedCreateInput,
  ProductPricingUncheckedUpdateInput,
  ProductUpdateInput,
  ProductWhereInput,
  createProduct,
  createProductInsight,
  createProductPricing,
  deleteProductWithDependencies,
  findBrandById,
  findLatestProductInsight,
  findProductById,
  findProductForInsight,
  findProductIdentifiersById,
  findProductIdentifiersBySku,
  findProductIdentifiersBySlug,
  findProductPricingByProductId,
  findProductsWithCount,
  listProducts,
  updateProduct,
  updateProductPricingById,
} from "../../core/db/repositories/product.repository.js";

type ProductActionContext = {
  brandId?: string;
  actorUserId?: string;
};

function buildProductEventContext(context?: ProductActionContext): EventContext {
  return {
    brandId: context?.brandId ?? undefined,
    actorUserId: context?.actorUserId ?? undefined,
    source: "api",
  };
}
class ProductService {

  async list(filters: ProductFilters = {}): Promise<PaginatedProducts> {
    const { search, brandId, categoryId, status, lifecycleStage, page = 1, pageSize = 20 } = filters;
    const { skip, take } = buildPagination({ page, pageSize });

    const where: ProductWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    if (brandId) where.brandId = brandId;
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (lifecycleStage) where.lifecycleStage = lifecycleStage;

    const [total, products] = await findProductsWithCount({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });

    return {
      items: products.map((product) => this.mapProduct(product)),
      total,
      page,
      pageSize: take,
    };
  }

  async getById(id: string, context?: ProductActionContext): Promise<ProductResponse> {
    const product = await findProductById(id);
    if (!product) {
      throw notFound("Product not found");
    }
    if (context?.brandId && product.brandId && product.brandId !== context.brandId) {
      throw forbidden("Access denied for this brand");
    }
    return this.mapProduct(product);
  }

  async create(input: CreateProductInput, context?: ProductActionContext): Promise<ProductResponse> {
    await this.ensureSlugUnique(input.slug);
    await this.ensureSkuUnique(input.sku ?? input.barcode);
    const scopedBrandId = context?.brandId ?? input.brandId;
    if (scopedBrandId) {
      await this.ensureBrandExists(scopedBrandId);
    }

    const createData: ProductCreateInput = {
      brandId: scopedBrandId,
      categoryId: input.categoryId,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      sku: input.sku ?? input.barcode ?? null,
      barcode: input.barcode ?? null,
      ean: input.ean ?? null,
      upc: input.upc ?? null,
      qrCodeUrl: input.qrCodeUrl ?? null,
      lifecycleStage: input.lifecycleStage ?? "concept",
      tags:
        input.tags === null
          ? DbNull
          : input.tags !== undefined
            ? (input.tags as InputJsonValue)
            : undefined,
      marketingProfileJson: this.serializeJson(input.marketingProfile),
      seoProfileJson: this.serializeJson(input.seoProfile),
      distributionProfileJson: this.serializeJson(input.distributionProfile),
      complianceProfileJson: this.serializeJson(input.complianceProfile),
      localizationProfileJson: this.serializeJson(input.localizationProfile),
      socialProofJson: this.serializeJson(input.socialProof),
      analyticsProfileJson: this.serializeJson(input.analyticsProfile),
      status: input.status ?? "ACTIVE",
    };
    const product = await createProduct(createData);

    const eventContext = buildProductEventContext({
      brandId: scopedBrandId ?? product.brandId ?? undefined,
      actorUserId: context?.actorUserId,
    });
    await emitProductCreated(
      { id: product.id },
      { ...eventContext, brandId: product.brandId ?? undefined },
    );
    return this.mapProduct(product);
  }

  async update(
    id: string,
    input: UpdateProductInput,
    context?: ProductActionContext,
  ): Promise<ProductResponse> {
    const existing = await findProductById(id);
    if (!existing) {
      throw notFound("Product not found");
    }

    if (context?.brandId && existing.brandId && existing.brandId !== context.brandId) {
      throw forbidden("Access denied for this brand");
    }

    if (input.slug && input.slug !== existing.slug) {
      await this.ensureSlugUnique(input.slug);
    }

    const nextSku = input.sku ?? input.barcode;
    if (nextSku && nextSku !== existing.sku) {
      await this.ensureSkuUnique(nextSku);
    }

    const desiredBrandId = context?.brandId ?? input.brandId ?? existing.brandId;
    if (desiredBrandId && desiredBrandId !== existing.brandId) {
      await this.ensureBrandExists(desiredBrandId);
    }

    const updateData: ProductUpdateInput = {
      brandId: desiredBrandId,
      categoryId: input.categoryId ?? existing.categoryId,
      name: input.name ?? existing.name,
      slug: input.slug ?? existing.slug,
      description: input.description ?? existing.description,
      sku: nextSku ?? existing.sku,
      barcode: input.barcode ?? existing.barcode,
      ean: input.ean ?? existing.ean,
      upc: input.upc ?? existing.upc,
      qrCodeUrl: input.qrCodeUrl ?? existing.qrCodeUrl,
      lifecycleStage: input.lifecycleStage ?? existing.lifecycleStage,
      ...(input.tags !== undefined
        ? {
            tags: input.tags === null ? DbNull : (input.tags as InputJsonValue),
          }
        : {}),
      marketingProfileJson:
        input.marketingProfile !== undefined
          ? this.serializeJson(input.marketingProfile)
          : existing.marketingProfileJson,
      seoProfileJson:
        input.seoProfile !== undefined
          ? this.serializeJson(input.seoProfile)
          : existing.seoProfileJson,
      distributionProfileJson:
        input.distributionProfile !== undefined
          ? this.serializeJson(input.distributionProfile)
          : existing.distributionProfileJson,
      complianceProfileJson:
        input.complianceProfile !== undefined
          ? this.serializeJson(input.complianceProfile)
          : existing.complianceProfileJson,
      localizationProfileJson:
        input.localizationProfile !== undefined
          ? this.serializeJson(input.localizationProfile)
          : existing.localizationProfileJson,
      socialProofJson:
        input.socialProof !== undefined
          ? this.serializeJson(input.socialProof)
          : existing.socialProofJson,
      analyticsProfileJson:
        input.analyticsProfile !== undefined
          ? this.serializeJson(input.analyticsProfile)
          : existing.analyticsProfileJson,
      status: input.status ?? existing.status,
    };
    const updated = await updateProduct(id, updateData);

    const eventContext = buildProductEventContext({
      brandId: desiredBrandId ?? updated.brandId ?? undefined,
      actorUserId: context?.actorUserId,
    });
    await emitProductUpdated(
      { id: updated.id },
      { ...eventContext, brandId: updated.brandId ?? undefined },
    );
    return this.mapProduct(updated);
  }

  async remove(id: string, context?: ProductActionContext) {
    const existing = await findProductIdentifiersById(id);
    if (!existing) {
      throw notFound("Product not found");
    }
    if (context?.brandId && existing.brandId && existing.brandId !== context.brandId) {
      throw forbidden("Access denied for this brand");
    }

    await deleteProductWithDependencies(id);

    const eventContext = buildProductEventContext({
      brandId: context?.brandId ?? existing.brandId ?? undefined,
      actorUserId: context?.actorUserId,
    });
    await emitProductDeleted(
      { id, brandId: existing.brandId ?? undefined },
      { ...eventContext, brandId: existing.brandId ?? undefined },
    );
    return { id };
  }

  async createInsight(
    productId: string,
    brandId: string,
    options?: { forceRegenerate?: boolean; tenantId?: string },
  ): Promise<ProductInsightResponse> {
    const product = await findProductForInsight(productId, brandId);

    if (!product) {
      throw notFound("Product not found for this brand");
    }

    const payload = {
      productId: product.id,
      brandId,
      productName: product.name,
      description: product.description ?? "",
      slug: product.slug,
      pricing: {
        b2cNet: this.decimalToNumber(product.pricing?.b2cNet),
        dealerNet: this.decimalToNumber(product.pricing?.dealerNet),
        standPartnerNet: this.decimalToNumber(product.pricing?.standPartnerNet),
      },
    };

    const prompt = this.buildProductInsightPrompt(payload);
    const cacheBase = makeCacheKey("product-insight", {
      productId,
      brandId,
      tenantId: options?.tenantId,
    });
    const key = options?.forceRegenerate ? `${cacheBase}:${Date.now()}` : cacheBase;

    const aiResponse = await orchestrateAI<{ summary: string; details: string }>({
      key,
      messages: [{ role: "user", content: prompt }],
      fallback: () => this.buildRuleBasedInsight(payload),
    });

    const insight = await createProductInsight({
      brandId,
      os: "product",
      entityType: "product",
      entityId: productId,
      summary: aiResponse.result.summary,
      details: aiResponse.result.details,
    });

    return this.mapInsight(insight);
  }

  private buildRuleBasedInsight(input: {
    productName: string;
    description: string;
    pricing: { b2cNet?: number | null; dealerNet?: number | null; standPartnerNet?: number | null };
  }): { summary: string; details: string } {
    const summaryParts = [`${input.productName} insight generated locally`];
    const detailSections: string[] = [];

    if (input.description?.trim()) {
      detailSections.push(
        `• Positioning: ${input.description.trim()}`,
      );
    } else {
      detailSections.push("• Positioning: No marketing description stored yet.");
    }

    const priceLines: string[] = [];
    const pushPrice = (label: string, value?: number | null) => {
      if (typeof value === "number" && Number.isFinite(value)) {
        priceLines.push(`${label}: €${value.toFixed(2)}`);
      }
    };

    pushPrice("B2C net", input.pricing.b2cNet);
    pushPrice("Dealer net", input.pricing.dealerNet);
    pushPrice("Stand partner net", input.pricing.standPartnerNet);

    if (priceLines.length) {
      detailSections.push(`• Pricing snapshot: ${priceLines.join(" | ")}`);
    } else {
      detailSections.push("• Pricing snapshot: No price points have been stored for this SKU.");
    }

    if (input.pricing.b2cNet && input.pricing.dealerNet) {
      const spread = input.pricing.b2cNet - input.pricing.dealerNet;
      const spreadPct = (spread / input.pricing.b2cNet) * 100;
      detailSections.push(
        `• Dealer margin: ${(spreadPct > 0 ? spreadPct : 0).toFixed(1)}% spread between B2C and dealer net.`,
      );
    }

    detailSections.push(
      "• Next step: Sync new competitor checks or run a fresh pricing experiment to replace this offline insight.",
    );

    return {
      summary: summaryParts.join(". "),
      details: detailSections.join("\n"),
    };
  }

  async getLatestInsight(productId: string): Promise<ProductInsightResponse | null> {
    const product = await findProductIdentifiersById(productId);
    if (!product) {
      throw notFound("Product not found");
    }
    if (!product.brandId) return null;
    const insight = await findLatestProductInsight(productId, product.brandId);
    return insight ? this.mapInsight(insight) : null;
  }

  async importProducts(payload: ProductImportPayload, context?: ProductActionContext): Promise<ProductImportResult> {
    const scopedBrandId = context?.brandId ?? payload.brandId ?? undefined;
    if (scopedBrandId) {
      await this.ensureBrandExists(scopedBrandId);
    }

    let imported = 0;
    let updated = 0;
    let primaryProductId: string | undefined;

    for (const item of payload.items) {
      const nextSku = item.sku ?? item.barcode ?? undefined;
      let existing: ProductIdentifierPayload | null = null;
      if (item.id != null) {
        existing = await findProductIdentifiersById(item.id);
      }
      if (!existing) {
        existing = await findProductIdentifiersBySlug(item.slug);
      }

      if (existing && scopedBrandId && existing.brandId && existing.brandId !== scopedBrandId) {
        throw forbidden("Access denied for this brand");
      }

      if (existing) {
        if (item.slug !== existing.slug) {
          await this.ensureSlugUnique(item.slug, existing.id);
        }
        if (nextSku && nextSku !== existing.sku) {
          await this.ensureSkuUnique(nextSku, existing.id);
        }

        const updateData = this.buildProductImportUpdateData(item);
        if (Object.keys(updateData).length) {
          await updateProduct(existing.id, updateData);
        }

        await this.savePricingForImport(
          existing.id,
          scopedBrandId ?? existing.brandId ?? undefined,
          item.pricing,
        );
        updated += 1;
        primaryProductId ??= existing.id;
        continue;
      }

      await this.ensureSlugUnique(item.slug);
      if (nextSku) {
        await this.ensureSkuUnique(nextSku);
      }

      const createData = this.buildProductImportCreateData(item, scopedBrandId);
      const created = await createProduct(createData);
      await this.savePricingForImport(created.id, scopedBrandId ?? created.brandId ?? undefined, item.pricing);
      imported += 1;
      primaryProductId ??= created.id;
    }

    if (primaryProductId) {
      await emitProductImportCompleted(
        { id: primaryProductId, brandId: scopedBrandId ?? undefined },
        buildProductEventContext({
          brandId: scopedBrandId ?? undefined,
          actorUserId: context?.actorUserId,
        }),
      );
    }

    return { imported, updated };
  }

  async exportProducts(filters: ProductExportFilters, context?: ProductActionContext): Promise<ProductExportResult> {
    const brandId = context?.brandId ?? filters.brandId ?? undefined;
    const where: ProductWhereInput = {};
    if (brandId) where.brandId = brandId;
    if (filters.status) where.status = filters.status;
    if (filters.lifecycleStage) where.lifecycleStage = filters.lifecycleStage;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { slug: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const products = await listProducts({
      where,
      orderBy: { createdAt: "desc" },
    });
    const payload = products.map((product) => this.mapProduct(product));
    const format = filters.format ?? "json";

    if (format === "csv") {
      return { format, payload: this.buildExportCsv(payload) };
    }
    return { format, payload };
  }

  async attachMediaToProduct(
    productId: string,
    payload: ProductMediaPayload,
    context?: ProductActionContext,
  ): Promise<ProductResponse> {
    return this.updateProductMedia(productId, payload, context, "attach");
  }

  async detachMediaFromProduct(
    productId: string,
    payload: ProductMediaPayload,
    context?: ProductActionContext,
  ): Promise<ProductResponse> {
    return this.updateProductMedia(productId, payload, context, "detach");
  }

  private buildProductImportCreateData(item: ProductImportItem, brandId?: string): ProductCreateInput {
    const skuValue = item.sku ?? item.barcode ?? null;
    return {
      brandId: brandId ?? undefined,
      categoryId: item.categoryId ?? undefined,
      name: item.name,
      slug: item.slug,
      description: item.description ?? null,
      sku: skuValue ?? undefined,
      barcode: item.barcode ?? null,
      ean: item.ean ?? null,
      upc: item.upc ?? null,
      qrCodeUrl: item.qrCodeUrl ?? null,
      lifecycleStage: item.lifecycleStage ?? "concept",
      tags:
        item.tags === null
          ? DbNull
          : item.tags !== undefined
            ? (item.tags as InputJsonValue)
            : undefined,
      marketingProfileJson: this.serializeJson(item.marketingProfile),
      seoProfileJson: this.serializeJson(item.seoProfile),
      distributionProfileJson: this.serializeJson(item.distributionProfile),
      complianceProfileJson: this.serializeJson(item.complianceProfile),
      localizationProfileJson: this.serializeJson(item.localizationProfile),
      socialProofJson: this.serializeJson(item.socialProof),
      analyticsProfileJson: this.serializeJson(item.analyticsProfile),
      status: item.status ?? "ACTIVE",
      complianceDocIds: item.complianceDocIds ?? undefined,
      specDocIds: item.specDocIds ?? undefined,
      mediaIds: item.mediaIds ?? undefined,
    };
  }

  private buildProductImportUpdateData(item: ProductImportItem): ProductUpdateInput {
    const nextSku = item.sku ?? item.barcode ?? undefined;
    const data: ProductUpdateInput = {
      name: item.name,
      slug: item.slug,
    };

    if (item.description !== undefined) {
      data.description = item.description ?? null;
    }
    if (item.categoryId !== undefined) {
      data.categoryId = item.categoryId ?? null;
    }
    if (nextSku !== undefined) {
      data.sku = nextSku;
    }
    if (item.barcode !== undefined) {
      data.barcode = item.barcode;
    }
    if (item.ean !== undefined) {
      data.ean = item.ean;
    }
    if (item.upc !== undefined) {
      data.upc = item.upc;
    }
    if (item.qrCodeUrl !== undefined) {
      data.qrCodeUrl = item.qrCodeUrl;
    }
    if (item.lifecycleStage !== undefined) {
      data.lifecycleStage = item.lifecycleStage;
    }
    if (item.tags !== undefined) {
      data.tags = item.tags === null ? DbNull : (item.tags as InputJsonValue);
    }
    if (item.marketingProfile !== undefined) {
      data.marketingProfileJson = this.serializeJson(item.marketingProfile);
    }
    if (item.seoProfile !== undefined) {
      data.seoProfileJson = this.serializeJson(item.seoProfile);
    }
    if (item.distributionProfile !== undefined) {
      data.distributionProfileJson = this.serializeJson(item.distributionProfile);
    }
    if (item.complianceProfile !== undefined) {
      data.complianceProfileJson = this.serializeJson(item.complianceProfile);
    }
    if (item.localizationProfile !== undefined) {
      data.localizationProfileJson = this.serializeJson(item.localizationProfile);
    }
    if (item.socialProof !== undefined) {
      data.socialProofJson = this.serializeJson(item.socialProof);
    }
    if (item.analyticsProfile !== undefined) {
      data.analyticsProfileJson = this.serializeJson(item.analyticsProfile);
    }
    if (item.status !== undefined) {
      data.status = item.status;
    }
    if (item.complianceDocIds !== undefined) {
      data.complianceDocIds = item.complianceDocIds ?? null;
    }
    if (item.specDocIds !== undefined) {
      data.specDocIds = item.specDocIds ?? null;
    }
    if (item.mediaIds !== undefined) {
      data.mediaIds = item.mediaIds ?? null;
    }
    return data;
  }

  private async savePricingForImport(
    productId: string,
    brandId: string | undefined,
    pricing?: ProductImportItem["pricing"],
  ) {
    if (!pricing) return;
    const hasPricingValue =
      pricing.cogsEur != null ||
      pricing.fullCostEur != null ||
      pricing.b2cNet != null ||
      pricing.dealerNet != null ||
      pricing.standPartnerNet != null;
    if (!hasPricingValue) return;

    const createData: ProductPricingUncheckedCreateInput = {
      productId,
      brandId: brandId ?? undefined,
    };
    const updateData: ProductPricingUncheckedUpdateInput = {};

    if (pricing.cogsEur != null) {
      createData.cogsEur = pricing.cogsEur;
      updateData.cogsEur = pricing.cogsEur;
    }
    const costValue = pricing.fullCostEur ?? pricing.cogsEur;
    if (costValue != null) {
      createData.fullCostEur = costValue;
      updateData.fullCostEur = costValue;
    }
    if (pricing.b2cNet != null) {
      createData.b2cNet = pricing.b2cNet;
      updateData.b2cNet = pricing.b2cNet;
    }
    if (pricing.dealerNet != null) {
      createData.dealerNet = pricing.dealerNet;
      updateData.dealerNet = pricing.dealerNet;
    }
    if (pricing.standPartnerNet != null) {
      createData.standPartnerNet = pricing.standPartnerNet;
      updateData.standPartnerNet = pricing.standPartnerNet;
    }

    const existing = await findProductPricingByProductId(productId);
    if (existing) {
      if (!Object.keys(updateData).length) return;
      await updateProductPricingById(existing.id, updateData);
      return;
    }
    await createProductPricing(createData);
  }

  private buildExportCsv(rows: ProductResponse[]): string {
    const headers = [
      "id",
      "brandId",
      "categoryId",
      "name",
      "slug",
      "sku",
      "barcode",
      "ean",
      "upc",
      "qrCodeUrl",
      "lifecycleStage",
      "tags",
      "status",
      "description",
      "createdAt",
      "updatedAt",
    ];
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = rows.map((row: any) => {
      const columns = [
        row.id,
        row.brandId ?? "",
        row.categoryId ?? "",
        row.name,
        row.slug,
        row.sku ?? "",
        row.barcode ?? "",
        row.ean ?? "",
        row.upc ?? "",
        row.qrCodeUrl ?? "",
        row.lifecycleStage ?? "",
        row.tags ? JSON.stringify(row.tags) : "",
        row.status ?? "",
        row.description ?? "",
        row.createdAt.toISOString(),
        row.updatedAt.toISOString(),
      ];
      return columns.map((column: any) => escape(String(column))).join(",");
    });
    return [headers.join(","), ...lines].join("\n");
  }

  private async updateProductMedia(
    productId: string,
    payload: ProductMediaPayload,
    context: ProductActionContext | undefined,
    mode: "attach" | "detach",
  ): Promise<ProductResponse> {
    const existing = await findProductById(productId);
    if (!existing) {
      throw notFound("Product not found");
    }
    if (context?.brandId && existing.brandId && existing.brandId !== context.brandId) {
      throw forbidden("Access denied for this brand");
    }
    const current = this.parseStringArray(existing.mediaIds) ?? [];
    const next =
      mode === "attach"
        ? Array.from(new Set([...current, ...payload.mediaIds]))
        : current.filter((id: any) => !payload.mediaIds.includes(id));
    const updated = await updateProduct(productId, {
      mediaIds: next.length ? next : undefined,
    });
    const eventContext = buildProductEventContext({
      brandId: updated.brandId ?? undefined,
      actorUserId: context?.actorUserId,
    });
    await emitProductUpdated(
      { id: updated.id, brandId: updated.brandId ?? undefined },
      eventContext,
    );
    return this.mapProduct(updated);
  }

  private mapProduct(record: ProductPayload): ProductResponse {
    return {
      id: record.id,
      brandId: record.brandId ?? undefined,
      categoryId: record.categoryId ?? undefined,
      name: record.name,
      slug: record.slug,
      description: record.description ?? undefined,
      sku: record.sku ?? undefined,
      status: record.status ?? undefined,
      barcode: record.barcode ?? undefined,
      ean: record.ean ?? undefined,
      upc: record.upc ?? undefined,
      qrCodeUrl: record.qrCodeUrl ?? undefined,
      lifecycleStage: record.lifecycleStage ?? undefined,
      tags: this.parseStringArray(record.tags) ?? null,
      marketingProfile: this.parseJsonString(record.marketingProfileJson),
      seoProfile: this.parseJsonString(record.seoProfileJson),
      distributionProfile: this.parseJsonString(record.distributionProfileJson),
      complianceProfile: this.parseJsonString(record.complianceProfileJson),
      localizationProfile: this.parseJsonString(record.localizationProfileJson),
      socialProof: this.parseJsonString(record.socialProofJson),
      analyticsProfile: this.parseJsonString(record.analyticsProfileJson),
      pricing: this.mapPricing(record.pricing),
      competitorPrices: record.competitorPrices.map((price: any) => ({
        id: price.id,
        productId: price.productId,
        brandId: price.brandId ?? undefined,
        competitor: price.competitor,
        marketplace: price.marketplace ?? undefined,
        country: price.country ?? undefined,
        priceNet: this.decimalToNumber(price.priceNet),
        priceGross: this.decimalToNumber(price.priceGross),
        currency: price.currency ?? undefined,
        collectedAt: price.collectedAt ?? undefined,
      })),
      inventoryItemCount: record._count.inventoryItems,
      complianceDocIds: this.parseStringArray(record.complianceDocIds),
      specDocIds: this.parseStringArray(record.specDocIds),
      mediaIds: this.parseStringArray(record.mediaIds),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private mapPricing(pricing: ProductPricingPayload | null): ProductPricingSnapshot | null {
    if (!pricing) return null;
    return {
      id: pricing.id,
      productId: pricing.productId,
      brandId: pricing.brandId ?? undefined,
      cogsEur: this.decimalToNumber(pricing.cogsEur),
      fullCostEur: this.decimalToNumber(pricing.fullCostEur),
      b2cNet: this.decimalToNumber(pricing.b2cNet),
      b2cGross: this.decimalToNumber(pricing.b2cGross),
      dealerNet: this.decimalToNumber(pricing.dealerNet),
      dealerPlusNet: this.decimalToNumber(pricing.dealerPlusNet),
      standPartnerNet: this.decimalToNumber(pricing.standPartnerNet),
      distributorNet: this.decimalToNumber(pricing.distributorNet),
      amazonNet: this.decimalToNumber(pricing.amazonNet),
      uvpNet: this.decimalToNumber(pricing.uvpNet),
      vatPct: this.decimalToNumber(pricing.vatPct),
    };
  }

  private decimalToNumber(value?: Decimal | null) {
    if (value === null || value === undefined) return null;
    return Number(value);
  }

  private mapInsight(record: ProductInsightPayload): ProductInsightResponse {
    return {
      id: record.id,
      summary: record.summary ?? "",
      details: record.details ?? "",
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private async ensureSlugUnique(slug: string, excludeId?: string) {
    const existing = await findProductIdentifiersBySlug(slug);
    if (existing && existing.id !== excludeId) {
      throw badRequest("Product slug already in use");
    }
  }

  private async ensureSkuUnique(sku?: string | null, excludeId?: string) {
    if (!sku) return;
    const existing = await findProductIdentifiersBySku(sku);
    if (existing && existing.id !== excludeId) {
      throw badRequest("SKU already in use");
    }
  }

  private async ensureBrandExists(brandId: string) {
    const brand = await findBrandById(brandId);
    if (!brand) {
      throw badRequest("Brand not found for provided brandId");
    }
  }

  private parseJsonString(value?: string | null): Record<string, unknown> | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  private serializeJson(value?: Record<string, unknown> | null): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    try {
      return JSON.stringify(value);
    } catch {
      return undefined;
    }
  }

  private parseStringArray(value?: JsonValue | null): string[] | undefined {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value.filter((item: any): item is string => typeof item === "string");
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.filter((item: any): item is string => typeof item === "string");
        }
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private buildProductInsightPrompt(payload: {
    productId: string;
    brandId: string;
    productName: string;
    description: string;
    slug: string;
    pricing: {
      b2cNet?: number | null;
      dealerNet?: number | null;
      standPartnerNet?: number | null;
    };
  }) {
    const lines = [
      `Product Insight Intake`,
      `Brand: ${payload.brandId}`,
      `Product: ${payload.productName}`,
      `Slug: ${payload.slug}`,
      `Description: ${payload.description || "No description provided"}`,
      `Pricing: b2cNet=${payload.pricing.b2cNet ?? "n/a"}, dealerNet=${
        payload.pricing.dealerNet ?? "n/a"
      }, standPartnerNet=${payload.pricing.standPartnerNet ?? "n/a"}`,
      "Compose a concise insight describing the product's state, potential risks, and one action item for Sales or Marketing.",
    ];
    return lines.join("\n");
  }
}

export const productService = new ProductService();
