import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/shell/filter-bar";
import { ModulePageLayout, type TableRow } from "@/components/shell/module-page";

const columns = ["Warehouse", "Stock", "Risk", "Owner", "Next Action"];
const rows: TableRow[] = [
  ["Berlin Hub", "82%", "Monitor", "Inventory", "Reorder"],
  ["Dubai 3PL", "41%", "Low", "Supply", "Schedule pickup"],
  ["LA Fulfillment", "19%", "High", "Field", "Stand refill"],
  ["Global Returns", "12%", "Audit", "Ops", "Investigate"],
];

export default function CommerceInventoryPage() {
  return (
    <ModulePageLayout
      title="Commerce · Inventory"
      description="Global stock health, 3PL sync, and risk signals."
      kpis={[
        { title: "Stock coverage", value: "64%", hint: "Target 80%" },
        { title: "High-risk sites", value: "3", hint: "Alerts" },
        { title: "Refill suggestions", value: "5", hint: "Auto" },
      ]}
      table={{
        title: "Inventory watchlist",
        description: "Follow up on low stock, audits, and stand refill cues.",
        columns,
        rows,
        filters: (
          <FilterBar>
            <Button variant="ghost" size="sm">
              Risk: High
            </Button>
            <Button variant="ghost" size="sm">
              Refill pending
            </Button>
          </FilterBar>
        ),
      }}
      aiInsights={{
        items: [
          "AI recommends prioritizing LA Fulfillment refill now.",
          "Prepare automation to reorder Berlin Hub before weekend.",
          "Set up notification for Dubai pick-up window.",
        ],
      }}
    />
  );
}
