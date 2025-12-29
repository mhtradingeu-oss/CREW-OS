# Inventory OS

## Purpose
Controls warehousing, stock forecasting, adjustments, transfers, and integrates with Stand/Dealer/Partner replenishment loops.

## Responsibilities
- Maintain stock levels per warehouse/stand, register transactions, reconciliations, and auto-replenish rules.
- Sync shipments, purchase orders, stock adjustments, and KPI records for logistics oversight.
- Trigger notifications/automations when safety stock, reorder points, or partner demands change.

## Inputs
- Supplier shipments, Sales orders, Stand partner sales, purchase orders, automation triggers (low stock, stockouts).
- Forecasts from AI Inventory Forecaster, Stand Program restock requests, campaign/marketing signals affecting demand.

## Outputs
- Stock snapshots, reserved quantities, reorder suggestions, auto replenishment orders, KPI logs (`InventoryKPIRecord`).
- Events for Automation (place reorder), Notification (low stock), AI Brain (inventory insights).

## Internal Components
- Models: `Warehouse`, `InventoryItem`, `InventoryTransaction`, `StockAdjustment`, `PurchaseOrder`, `Shipment`, `InventoryKPIRecord`, `StandInventorySnapshot`.
- Reorder engine that ties in `ReorderSuggestion` (planned), auto-fulfillment automations, and AI forecasting.

## Required API Endpoints
- `GET /api/v1/inventory/list`, `POST /api/v1/inventory/movement`, `POST /api/v1/inventory/reorder`, `GET /api/v1/inventory/forecast`.
- Automation: `POST /api/v1/inventory/automation/low-stock`.
- AI: `POST /api/v1/inventory/ai/forecast`.

## Required Data Models
- `Warehouse`, `InventoryItem`, `InventoryTransaction`, `StockAdjustment`, `PurchaseOrder`, `Shipment`, `InventoryKPIRecord`, `AIInsight`.

## Integration Notes
- Supplies Stand OS and Partner OS with availability data and interacts with Pricing OS for safety-stock driven pricing shifts.
- Works with Logistics & Packaging metadata, Finance OS for costing, and Automation OS for reorder workflows.
