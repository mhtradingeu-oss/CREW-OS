import { ModuleScaffold } from "@/components/shell/module-scaffold";
import { PageHeader } from "@/components/shell/page-header";
import { TableWithToolbar } from "@/components/shell/table-with-toolbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { safetyEvents } from "@/lib/superadmin/mock-data";

export default function SuperAdminSafetyEventsPage() {
  return (
    <ModuleScaffold
      header={{
        title: "Safety Events Log",
        description: "Filterable log of AI safety events across tenants (read-only)",
        breadcrumbs: [{ label: "Super Admin" }, { label: "AI Safety" }, { label: "Events" }],
      }}
    >
      <PageHeader
        title="Safety Events"
        description="Filters are UI-only; backend queries can be wired later"
        meta={<StatusBadge tone="info">Read-only</StatusBadge>}
      />
      <TableWithToolbar
        title="Events"
        description="Filters are UI-only; backend queries can be wired later."
        columns={["Severity", "Agent", "Rule", "Tenant", "When", "Status"]}
        rows={safetyEvents.map((event) => [
          <StatusBadge key={`${event.id}-sev`} tone={event.severity === "critical" ? "danger" : event.severity === "high" ? "warning" : "info"}>
            {event.severity}
          </StatusBadge>,
          event.agent,
          event.rule,
          event.tenant,
          new Date(event.occurredAt).toLocaleString(),
          <StatusBadge key={`${event.id}-status`} tone={event.status === "blocked" ? "success" : event.status === "fallback" ? "warning" : "default"}>
            {event.status}
          </StatusBadge>,
        ])}
      />
    </ModuleScaffold>
  );
}
