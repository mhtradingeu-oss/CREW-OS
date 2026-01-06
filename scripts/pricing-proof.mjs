import { prisma } from "../src/core/prisma.js";
import { pricingService } from "../src/modules/pricing/pricing.service.js";

async function main() {
  const product = await prisma.brandProduct.findFirst({
    include: { brand: true },
  });
  if (!product) {
    throw new Error("No product found for Pricing OS proof");
  }

  const brandCurrency = product.brand?.defaultCurrency ?? "EUR";

  const draft = await pricingService.createPriceDraft(
    {
      productId: product.id,
      brandId: product.brandId ?? undefined,
      currency: brandCurrency,
      newNet: 100,
      oldNet: 90,
      channel: "proof",
      status: "DRAFT",
    },
    { actorUserId: "pricing-proof" },
  );

  const publishResult = await pricingService.publishDraft(
    draft.id,
    { approvedById: "pricing-proof" },
    { actorUserId: "pricing-proof", brandId: product.brandId ?? undefined },
  );

  const activePrice = await pricingService.getActivePrice(product.id, {
    actorUserId: "pricing-proof",
    brandId: product.brandId ?? undefined,
  });

  const history = await prisma.aIPricingHistory.findFirst({
    where: {
      productId: product.id,
      newNet: publishResult.pricing.basePrice,
    },
    orderBy: { createdAt: "desc" },
  });
  if (!history) {
    throw new Error("Expected a pricing history entry after publish");
  }

  console.log(
    `PROOF_OK productId=${product.id} draftId=${draft.id} activePriceId=${activePrice.id} historyId=${history.id}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
