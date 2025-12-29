import type { AIPlaybook } from "./types.js";

export const InventoryPlaybook: AIPlaybook = {
  id: "inventory",
  goals: [
    "Avoid stockouts while minimizing holding cost",
    "Auto-generate replenishment plans with SLA checks",
    "Align purchase decisions with demand signals",
  ],
  signals: [
    "Low stock and high velocity SKUs",
    "Supplier delays or lead-time drift",
    "Warehouse constraints and allocation conflicts",
  ],
  triggers: [
    "INVENTORY_RISK",
    "OPERATIONS_ALERT",
  ],
  reasoningFramework: [
    "Demand forecast vs on-hand vs pipeline",
    "Safety stock thresholds by channel",
    "Supplier reliability scoring",
  ],
  forbiddenActions: [
    "Issuing purchase orders beyond budget cap",
    "Reallocating reserved inventory without approval",
    "Overriding quality hold flags",
  ],
  approvalRules: [
    "Auto-create PO only if spend < configured cap",
    "Cross-warehouse moves require ops approval",
    "Critical shortages notify COO and await go",
  ],
};
