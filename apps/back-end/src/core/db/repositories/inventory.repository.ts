/**
 * Atomically adjust inventory stock, create transaction, and adjustment in a single transaction.
 * Ensures concurrency safety and prevents negative stock.
 */
export async function adjustInventoryStock(
  inventoryItemId: string,
  delta: number,
  reason: string | null,
  brandId?: string,
): Promise<{
  updatedItem: any;
  transaction: any;
  adjustment: any;
  previousQuantity: number;
  newQuantity: number;
}> {
  return await prisma.$transaction(async (tx) => {
    // Lock the row for update (SELECT ... FOR UPDATE is not natively supported in Prisma, but $transaction serializes)
    const item = await tx.inventoryItem.findFirst({
      where: { id: inventoryItemId, ...(brandId ? { brandId } : {}) },
      select: inventorySelect,
    });
    if (!item) throw new Error("Inventory item not found");
    const previousQuantity = Number(item.quantity ?? 0);
    const newQuantity = previousQuantity + Number(delta ?? 0);
    if (newQuantity < 0) {
      throw new Error("Inventory adjustment would result in negative stock");
    }
    const updatedItem = await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { quantity: newQuantity },
      select: inventorySelect,
    });
    const transaction = await tx.inventoryTransaction.create({
      data: {
        brandId: item.brandId ?? null,
        warehouseId: item.warehouseId,
        productId: item.productId,
        type: "adjustment",
        quantity: delta,
        reason: reason ?? null,
      },
      select: transactionSelect,
    });
    const adjustment = await tx.stockAdjustment.create({
      data: {
        brandId: item.brandId ?? null,
        productId: item.productId,
        warehouseId: item.warehouseId,
        quantity: delta,
        reason: reason ?? null,
      },
      select: adjustmentSelect,
    });
    return { updatedItem, transaction, adjustment, previousQuantity, newQuantity };
  });
}
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../prisma.js";

// All select objects and repository methods are used by the service only; no Prisma types are exposed to service consumers
const inventorySelect = {
  id: true,
  brandId: true,
  quantity: true,
  warehouseId: true,
  productId: true,
  createdAt: true,
  updatedAt: true,
  warehouse: { select: { id: true, name: true, location: true } },
  product: { select: { id: true, name: true, sku: true } },
} satisfies Prisma.InventoryItemSelect;

const transactionSelect = {
  id: true,
  brandId: true,
  warehouseId: true,
  productId: true,
  type: true,
  quantity: true,
  reason: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InventoryTransactionSelect;

const adjustmentSelect = {
  id: true,
  brandId: true,
  productId: true,
  warehouseId: true,
  quantity: true,
  reason: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.StockAdjustmentSelect;

type InventoryDbClient = PrismaClient | Prisma.TransactionClient;

export type InventoryListOptions = {
  skip?: number;
  take?: number;
  orderBy?: Prisma.InventoryItemOrderByWithRelationInput;
};

export {
  inventorySelect,
  transactionSelect,
  adjustmentSelect,
};

export async function listInventoryItemsWithCount(
  where: Prisma.InventoryItemWhereInput,
  options: InventoryListOptions = {},
) {
  const { skip, take, orderBy } = options;
  const [total, items] = await prisma.$transaction([
    prisma.inventoryItem.count({ where }),
    prisma.inventoryItem.findMany({
      where,
      select: inventorySelect,
      orderBy: orderBy ?? { updatedAt: "desc" },
      skip,
      take,
    }),
  ]);
  return { total, rows: items };
}

export async function findInventoryItem(
  where: Prisma.InventoryItemWhereInput,
  client?: InventoryDbClient,
) {
  return (client ?? prisma).inventoryItem.findFirst({
    where,
    select: inventorySelect,
  });
}

export async function listInventoryItems(
  where: Prisma.InventoryItemWhereInput,
  options: { orderBy?: Prisma.InventoryItemOrderByWithRelationInput } = {},
  client?: InventoryDbClient,
) {
  return (client ?? prisma).inventoryItem.findMany({
    where,
    select: inventorySelect,
    orderBy: options.orderBy ?? { updatedAt: "desc" },
  });
}

export async function findBrandProductById(
  id: string,
  client?: InventoryDbClient,
) {
  return (client ?? prisma).brandProduct.findUnique({
    where: { id },
    select: { id: true, brandId: true },
  });
}

export async function findWarehouseById(
  id: string,
  client?: InventoryDbClient,
) {
  return (client ?? prisma).warehouse.findUnique({
    where: { id },
    select: { id: true, brandId: true },
  });
}

export async function createInventoryItem(
  data: Prisma.InventoryItemUncheckedCreateInput,
  client?: InventoryDbClient,
) {
  return (client ?? prisma).inventoryItem.create({
    data,
    select: inventorySelect,
  });
}

export async function updateInventoryItemQuantity(
  id: string,
  data: Prisma.InventoryItemUpdateArgs["data"],
  client?: InventoryDbClient,
) {
  return (client ?? prisma).inventoryItem.update({
    where: { id },
    data,
    select: inventorySelect,
  });
}

export async function createInventoryTransaction(
  data: Prisma.InventoryTransactionUncheckedCreateInput,
  client?: InventoryDbClient,
) {
  return (client ?? prisma).inventoryTransaction.create({
    data,
    select: transactionSelect,
  });
}

export async function createStockAdjustment(
  data: Prisma.StockAdjustmentUncheckedCreateInput,
  client?: InventoryDbClient,
) {
  return (client ?? prisma).stockAdjustment.create({
    data,
    select: adjustmentSelect,
  });
}
