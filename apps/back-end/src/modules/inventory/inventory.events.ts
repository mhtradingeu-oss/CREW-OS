import { publish } from "../../core/events/event-bus.js";
import type { InventoryEventPayload, InventoryLowStockPayload } from "./inventory.types.js";

export enum InventoryEvents {
  CREATED = "inventory.created",
  UPDATED = "inventory.updated",
  DELETED = "inventory.deleted",
  STOCK_LOW = "inventory.stock.low",
}

export async function emitInventoryCreated(payload: InventoryEventPayload) {
  await publish(InventoryEvents.CREATED, payload);
}

export async function emitInventoryStockLow(payload: InventoryLowStockPayload) {
  await publish(InventoryEvents.STOCK_LOW, payload);
}
