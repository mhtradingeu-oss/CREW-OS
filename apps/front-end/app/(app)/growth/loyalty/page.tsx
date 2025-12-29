import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/shell/filter-bar";
import { ModulePageLayout, type TableRow } from "@/components/shell/module-page";

const columns = ["Program", "Tier", "Status", "Points", "Owner"];
const rows: TableRow[] = [
  ["Global Loyalty", "Platinum", "Healthy", "1.2M", "Loyalty"],
  ["Stand Rewards", "Gold", "Monitoring", "432k", "Field"],
  ["CRM Bonus", "Silver", "Draft", "89k", "Growth"],
  ["Partner Uplift", "Emerald", "Piloted", "55k", "Brand"],
];

export default function GrowthLoyaltyPage() {
  return (
    <ModulePageLayout
      title="Growth · Loyalty"
      description="Track tiers, points, and activation health."
      actions={<Button variant="outline">Launch campaign</Button>}
      kpis={[
        { title: "Members", value: "480k", hint: "Active" },
        { title: "Points issued", value: "9.4M", hint: "YTD" },
        { title: "Redemptions", value: "128k", hint: "Last 30d" },
      ]}
      table={{
        title: "Tier leaderboard",
        description: "Progress, points, and ownership for loyalty tiers.",
        columns,
        rows,
        filters: (
          <FilterBar>
            <Button variant="ghost" size="sm">
              Tier: Platinum
            </Button>
            <Button variant="ghost" size="sm">
              Status: Healthy
            </Button>
          </FilterBar>
        ),
      }}
      aiInsights={{
        items: [
          "AI suggests bumping platinum perks for VIP cohort.",
          "Stand Rewards needs refill automation to trigger at 20%.",
          "Partner Uplift pilot ready for loyalty automation trial.",
        ],
      }}
    />
  );
}
