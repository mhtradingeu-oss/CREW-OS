import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/shell/filter-bar";
import { ModulePageLayout, type TableRow } from "@/components/shell/module-page";

const columns = ["Stand", "City", "Inventory", "Status", "Owner"];
const rows: TableRow[] = [
  ["Brixton", "London", "Low", "Refill", "Stand Team"],
  ["Roosevelt", "NYC", "Healthy", "Live", "Field"],
  ["Kuala Lumpur", "KUL", "Critical", "Automation", "Stand Ops"],
  ["Dubai Mall", "DXB", "Medium", "Monitoring", "Field"],
];

export default function FieldStandPage() {
  return (
    <ModulePageLayout
      title="Field · Stand / POS"
      description="Stand program insights, inventory risk, and refill timeline."
      actions={<Button variant="outline">Create refill order</Button>}
      kpis={[
        { title: "Live stands", value: "42", hint: "Global" },
        { title: "Refill alerts", value: "6", hint: "Critical" },
        { title: "Automation ready", value: "3", hint: "Queued" },
      ]}
      table={{
        title: "Refill board",
        description: "Track stand health, inventory, and tasks.",
        columns,
        rows,
        filters: (
          <FilterBar>
            <Button variant="ghost" size="sm">
              Inventory: Low
            </Button>
            <Button variant="ghost" size="sm">
              Region: EMEA
            </Button>
          </FilterBar>
        ),
      }}
      aiInsights={{
        items: [
          "AI recommends pushing stand refill automation for Brixton.",
          "Suggest prepping Dubai Mall for premium launch kit.",
          "Virtual HQ flagged Kuala Lumpur as a high-risk refill.",
        ],
      }}
    />
  );
}
