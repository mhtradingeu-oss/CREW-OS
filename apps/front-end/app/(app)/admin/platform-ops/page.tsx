import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/shell/filter-bar";
import { ModulePageLayout, type TableRow } from "@/components/shell/module-page";
import { RequireRole } from "@/components/auth";

const columns = ["Metric", "Value", "Target", "Owner"];
const rows: TableRow[] = [
  ["API latency", "212ms", "< 250ms", "Infra"],
  ["Queue depth", "18", "< 25", "Ops"],
  ["Error alerts", "4", "0", "Security"],
  ["Backups", "Last run 02:00", "Hourly", "Platform"],
];

export default function AdminPlatformOpsPage() {
  return (
    <RequireRole role="SUPER_ADMIN">
      <ModulePageLayout
        title="Platform Ops & Maintenance"
        description="Health, backups, sessions, jobs, and audit logs for the SuperApp."
        actions={<Button variant="outline">View health board</Button>}
        kpis={[
          { title: "API success", value: "99.3%", hint: "Last 24h" },
          { title: "Error budget", value: "4 / 10", hint: "Remaining" },
          { title: "Backups", value: "On schedule", hint: "Hourly" },
        ]}
        table={{
          title: "Ops scoreboard",
          description: "Status for queues, sessions, and jobs.",
          columns,
          rows,
          filters: (
            <FilterBar>
              <Button variant="ghost" size="sm">
                Jobs
              </Button>
              <Button variant="ghost" size="sm">
                Backups
              </Button>
              <Button variant="ghost" size="sm">
                Security
              </Button>
            </FilterBar>
          ),
        }}
        aiInsights={{
          items: [
            "AI recommends running drill for queue depth at 03:00 UTC.",
            "Schedule audit log snapshot for crew review.",
            "Backups: no drift detected; keep Guardrail Safe.",
          ],
        }}
      />
    </RequireRole>
  );
}
