import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/shell/filter-bar";
import { ModulePageLayout, type TableRow } from "@/components/shell/module-page";

const columns = ["Rep", "Territory", "Pipeline", "Status", "Next Visit"];
const rows: TableRow[] = [
  ["Mara Lee", "Europe", "$340k", "On Target", "Wed"],
  ["Tariq B.", "Middle East", "$210k", "Needs lift", "Fri"],
  ["Sun Park", "Korea", "$128k", "Green", "Mon"],
  ["Ravi S.", "India", "$98k", "Monitoring", "Thu"],
];

export default function FieldSalesRepsPage() {
  return (
    <ModulePageLayout
      title="Field · Sales Rep Engine"
      description="Territory performance, visits, commissions, and pipeline health."
      actions={<Button variant="outline">Plan ride-along</Button>}
      kpis={[
        { title: "Pipeline", value: "$776k", hint: "P50" },
        { title: "Visits", value: "102", hint: "This week" },
        { title: "Quota coverage", value: "86%", hint: "Team" },
      ]}
      table={{
        title: "Territory board",
        description: "Pipeline, visits, and next actions for reps.",
        columns,
        rows,
        filters: (
          <FilterBar>
            <Button variant="ghost" size="sm">
              Status: On Target
            </Button>
            <Button variant="ghost" size="sm">
              Visits: Next 7d
            </Button>
          </FilterBar>
        ),
      }}
      aiInsights={{
        items: [
          "AI suggests boosting Tariq B. with loyalty incentives.",
          "Sun Park flagged for cross-selling Nova stack.",
          "Commission automation ready for final review.",
        ],
      }}
    />
  );
}
