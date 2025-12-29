import pkg from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

const { Prisma: PrismaNamespace } = pkg;

export type SalesOrderDuplicateParams = {
  repId: string;
  brandId: string;
  productId: string;
  quantity: number;
  windowStart: Date;
};

export type SalesOrderTransactionParams = {
  repId: string;
  brandId: string;
  productId: string;
  quantity: number;
  total: number;
  unitPrice: number;
  invoiceCurrency: string;
  invoiceStatus: string;
  invoiceIssuedAt: Date;
  revenueCurrency: string;
  revenuePeriodStart: Date;
  revenuePeriodEnd?: Date | null;
  inventoryAdjustment: {
    inventoryItemId: string;
    delta: number;
    reason?: string;
    brandId?: string;
  };
};

export type InventoryAdjustmentHandler = (
  adjustment: SalesOrderTransactionParams["inventoryAdjustment"],
  tx: Prisma.TransactionClient,
) => Promise<void>;

export async function findDuplicateSalesOrder(params: SalesOrderDuplicateParams) {
  return prisma.salesOrder.findFirst({
    where: {
      repId: params.repId,
      brandId: params.brandId,
      status: { not: "CANCELLED" },
      createdAt: { gte: params.windowStart },
      items: {
        some: {
          productId: params.productId,
          quantity: params.quantity,
        },
      },
    },
  });
}

export async function createSalesOrderTransaction(
  params: SalesOrderTransactionParams,
  adjustInventory: InventoryAdjustmentHandler,
) {
  return prisma.$transaction(async (tx) => {
    await adjustInventory(params.inventoryAdjustment, tx);

    const order = await tx.salesOrder.create({
      data: {
        repId: params.repId,
        brandId: params.brandId,
        status: "PLACED",
        total: new PrismaNamespace.Decimal(params.total),
        items: {
          create: {
            productId: params.productId,
            quantity: params.quantity,
            price: new PrismaNamespace.Decimal(params.unitPrice),
          },
        },
      },
    });

    const invoice = await tx.financeInvoice.create({
      data: {
        brandId: params.brandId,
        customerId: undefined,
        amount: params.total,
        currency: params.invoiceCurrency,
        status: params.invoiceStatus,
        issuedAt: params.invoiceIssuedAt,
      },
    });

    const revenueRecord = await tx.revenueRecord.create({
      data: {
        brandId: params.brandId,
        productId: params.productId,
        amount: params.total,
        currency: params.revenueCurrency,
        periodStart: params.revenuePeriodStart,
        periodEnd: params.revenuePeriodEnd ?? null,
      },
    });

    return { order, invoice, revenueRecord };
  });
}
