import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/shell/filter-bar";
import { ModulePageLayout, type TableRow } from "@/components/shell/module-page";

const columns = ["Metric", "Value", "Target", "Owner"];
const rows: TableRow[] = [
  ["Gross margin", "38%", "≥35%", "Finance"],
  ["Cash runway", "5.8 months", "≥4m", "Finance"],
  ["Outstanding invoices", "$182k", "< $250k", "Finance"],
  ["Payouts", "$64k", "Weekly", "Finance"],
];

export default function MoneyFinancePage() {
  return (
    <ModulePageLayout
      title="Money · Finance"
      description="Revenue, margins, payouts, and cash intelligence for brands."
      actions={<Button variant="outline">Export ledger</Button>}
      kpis={[
        { title: "Revenue", value: "$2.1M", hint: "Last 30d" },
        { title: "Margin", value: "38%", hint: "Goal 35%" },
        { title: "Cash runway", value: "5.8m", hint: "Healthy" },
      ]}
      table={{
        title: "Financial guardrails",
        description: "Monitor revenue signals, cost, and payout readiness.",
        columns,
        rows,
        filters: (
          <FilterBar>
            <Button variant="ghost" size="sm">
              Period: Q2
            </Button>
            <Button variant="ghost" size="sm">
              Metric: Margin
            </Button>
          </FilterBar>
        ),
      }}
      aiInsights={{
        items: [
          "AI suggests raising margin target for Stand program by 1.2%.",
          "Flag outstanding invoices from partners with low payment health.",
          "Recommend prepping payout run for sales reps Thursday.",
        ],
      }}
    />
  );
}
