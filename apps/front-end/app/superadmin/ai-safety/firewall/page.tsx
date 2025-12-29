import { ModuleScaffold } from "@/components/shell/module-scaffold";
import { PageHeader } from "@/components/shell/page-header";
import { TableWithToolbar } from "@/components/shell/table-with-toolbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { safetyRules } from "@/lib/superadmin/mock-data";

const firewallRows = safetyRules.map((rule) => [
  rule.name,
  rule.category,
  <StatusBadge key={`${rule.id}-sev`} tone={rule.severity === "critical" ? "danger" : rule.severity === "high" ? "warning" : "info"}>
    {rule.severity}
  </StatusBadge>,
  <StatusBadge key={`${rule.id}-status`} tone={rule.status === "active" ? "success" : "warning"}>
    {rule.status}
  </StatusBadge>,
  <span key={`${rule.id}-desc`} className="text-sm text-muted-foreground">{rule.description}</span>,
]);

export default function SuperAdminFirewallPage() {
  return (
    <ModuleScaffold
      header={{
        title: "AI Safety Firewall",
        description: "Read-only firewall rules enforced at the platform boundary",
        breadcrumbs: [{ label: "Super Admin" }, { label: "AI Safety" }, { label: "Firewall" }],
      }}
    >
      <PageHeader
        title="Firewall"
        description="Rules synced from backend policies; mutations disabled"
        meta={<StatusBadge tone="info">Read-only</StatusBadge>}
      />
      <TableWithToolbar
        title="Firewall rules"
        description="Rules are synced from backend policies; mutations are disabled."
        columns={["Rule", "Category", "Severity", "Status", "Description"]}
        rows={firewallRows}
      />
    </ModuleScaffold>
  );
}
