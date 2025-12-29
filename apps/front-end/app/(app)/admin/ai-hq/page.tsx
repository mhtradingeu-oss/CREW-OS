import { Button } from "../../../../components/ui/button.tsx";
import { FilterBar } from "../../../../components/shell/filter-bar.tsx";
import { ModulePageLayout, type TableRow } from "../../../../components/shell/module-page.tsx";

const columns = ["Insight", "Plane", "Confidence", "Owner"];
const rows: TableRow[] = [
  ["Pricing AI is trending cautious", "Commerce", "92%", "Pricing"],
  ["CRM assistant flagged churn lead", "Growth", "88%", "CRM"],
  ["Automation queue backlog", "Automations", "64%", "Ops"],
  ["Virtual office ready", "Virtual HQ", "71%", "AI"],
];

export default function AdminAiHqPage() {
  return (
    <ModulePageLayout
      title="AI HQ & Insights"
      description="Central console for AI metrics, confidence scoring, and recommended actions."
      actions={<Button variant="outline">Export insights</Button>}
      kpis={[
        { title: "AI requests", value: "4.3k", hint: "Daily" },
        { title: "Guardrail score", value: "99%", hint: "Safe" },
        { title: "Confidence", value: "92/100", hint: "Aggregated" },
      ]}
      table={{
        title: "Signal log",
        description: "Latest AI narratives aligned to each plane.",
        columns,
        rows,
        filters: (
          <FilterBar>
            <Button variant="ghost" size="sm">
              Confidence: ≥80
            </Button>
            <Button variant="ghost" size="sm">
              Plane: Growth
            </Button>
            <Button variant="ghost" size="sm">
              Latest
            </Button>
          </FilterBar>
        ),
      }}
      aiInsights={{
        description: "AI Brain signals waiting for approval.",
        items: [
          "AI recommends launching pricing experiment for three high-performing SKUs.",
          "Churn assistant suggests VIP outreach from CRM + Loyalty.",
          "Automations flagged a backlog of webhook retries for platform ops.",
        ],
      }}
    />
  );
}
