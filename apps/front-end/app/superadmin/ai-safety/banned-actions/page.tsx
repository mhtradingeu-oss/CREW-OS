import { ModuleScaffold } from "@/components/shell/module-scaffold";
import { PageHeader } from "@/components/shell/page-header";
import { TableWithToolbar } from "@/components/shell/table-with-toolbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { bannedActions } from "@/lib/superadmin/mock-data";

export default function SuperAdminBannedActionsPage() {
  return (
    <ModuleScaffold
      header={{
        title: "Banned Actions",
        description: "Read-only banned or observed actions for AI agents",
        breadcrumbs: [{ label: "Super Admin" }, { label: "AI Safety" }, { label: "Banned Actions" }],
      }}
    >
      <PageHeader
        title="Banned Actions"
        description="Defined in AI safety policies"
        meta={<StatusBadge tone="info">Read-only</StatusBadge>}
      />
      <TableWithToolbar
        title="Banned actions"
        description="Defined in AI safety policies."
        columns={["Action", "Domain", "Reason", "Status"]}
        rows={bannedActions.map((item) => [
          item.action,
          item.domain,
          <span key={`${item.id}-reason`} className="text-sm text-muted-foreground">{item.reason}</span>,
          <StatusBadge key={`${item.id}-status`} tone={item.status === "enforced" ? "danger" : "warning"}>
            {item.status}
          </StatusBadge>,
        ])}
      />
    </ModuleScaffold>
  );
}
