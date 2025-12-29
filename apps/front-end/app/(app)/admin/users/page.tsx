import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/shell/filter-bar";
import { ModulePageLayout, type TableRow } from "@/components/shell/module-page";

const columns = ["User", "Role", "Status", "Brand", "Last Active"];
const rows: TableRow[] = [
  ["Amara Chen", "Super Admin", "Active", "HAIROTICMEN", "2m ago"],
  ["Sofie K.", "Brand Admin", "Active", "NOVA STACK", "12m ago"],
  ["Ibrahim N.", "Security Lead", "Review", "ORBIT PHASE", "1h ago"],
  ["Field Ops", "Rep", "Active", "HAIROTICMEN", "5m ago"],
];

export default function AdminUsersPage() {
  return (
    <ModulePageLayout
      title="Users & RBAC"
      description="Manage identities, policies, and guardrails for every plane."
      actions={<Button>Invite super admin</Button>}
      kpis={[
        { title: "Active identities", value: "128", hint: "Across brands" },
        { title: "Admins online", value: "6", hint: "Live sessions" },
        { title: "RBAC drift", value: "2 new", hint: "Require approval", trend: "Alert" },
      ]}
      table={{
        title: "Access directory",
        description: "Roles, status, and brand alignments for the platform network.",
        columns,
        rows,
        filters: (
          <FilterBar>
            <Button variant="ghost" size="sm">
              Role: Admins
            </Button>
            <Button variant="ghost" size="sm">
              Status: Active
            </Button>
            <Button variant="ghost" size="sm">
              Filter by brand
            </Button>
          </FilterBar>
        ),
      }}
      aiInsights={{
        description: "AI guardrail cues for the identity plane.",
        items: [
          "AI flags 3 new RBAC requests for security review.",
          "Recommend onboarding default policy for ORBIT PHASE.",
          "Alert: Multi-factor challenge triggered twice today.",
        ],
      }}
    />
  );
}
