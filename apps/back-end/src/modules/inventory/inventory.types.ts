export interface InventoryWarehouseDTO {
  id: string;
  name: string;
  location?: string | null;
}

export interface InventoryProductDTO {
  id: string;
  name: string;
  sku?: string | null;
}

export interface InventoryItemDTO {
  id: string;
  brandId?: string;
  quantity: number;
  warehouse: InventoryWarehouseDTO;
  product: InventoryProductDTO;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListInventoryParams {
  brandId?: string;
  warehouseId?: string;
  productId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedInventory {
  items: InventoryItemDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InventoryTransactionDTO {
  id: string;
  brandId?: string;
  warehouseId: string;
  productId: string;
  type: string;
  quantity: number;
  reason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockAdjustmentDTO {
  id: string;
  brandId?: string;
  productId: string;
  warehouseId?: string | null;
  quantity: number;
  reason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReorderSuggestionDTO {
  id: string;
  brandId?: string;
  productId: string;
  warehouseId?: string | null;
  suggestedQty: number;
  reason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInventoryItemInput {
  brandId: string;
  warehouseId: string;
  productId: string;
  quantity?: number;
}

export interface CreateInventoryAdjustmentInput {
  brandId: string;
  inventoryItemId: string;
  delta: number;
  reason?: string;
  createdByUserId?: string;
}

export interface InventoryAdjustmentResult {
  inventoryItem: InventoryItemDTO;
  transaction: InventoryTransactionDTO;
  adjustment: StockAdjustmentDTO;
}

export interface InventoryEventPayload {
  brandId?: string;
  productId?: string;
  warehouseId?: string;
  inventoryItemId?: string;
  action?: "created" | "updated" | "deleted" | string;
  metadata?: Record<string, unknown> | null;
  userId?: string;
}

export interface InventoryLowStockPayload extends InventoryEventPayload {
  currentStock: number;
  threshold: number;
}

export interface InventoryInsightItem {
  productId: string;
  productName?: string;
  sku?: string | null;
  warehouseId?: string;
  warehouseName?: string;
  quantity: number;
}

export interface InventoryInsightResult {
  summary: string;
  recommendation?: string;
  lowStockItems: InventoryInsightItem[];
  slowMovingItems: InventoryInsightItem[];
  overstockItems: InventoryInsightItem[];
  details?: string;
}
