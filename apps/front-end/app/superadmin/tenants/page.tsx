import Link from "next/link";
import { ModuleScaffold } from "@/components/shell/module-scaffold";
import { PageHeader } from "@/components/shell/page-header";
import { TableWithToolbar } from "@/components/shell/table-with-toolbar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { tenants } from "@/lib/superadmin/mock-data";

export default function SuperAdminTenantsPage() {
  return (
    <ModuleScaffold
      header={{
        title: "Tenants",
        description: "Read-only list of tenants with search, filters, pagination placeholders",
        breadcrumbs: [{ label: "Super Admin" }, { label: "Tenants" }],
      }}
    >
      <PageHeader
        title="Tenants Directory"
        description="View tenants, plans, and status. Actions are read-only."
        meta={<StatusBadge tone="info">Read-only</StatusBadge>}
      />
      <TableWithToolbar
        title="Tenants"
        description="Search tenants and drill into plan, feature flags, and activity."
        columns={["Tenant", "Plan", "Created", "Status", "Actions"]}
        rows={tenants.map((tenant) => [
          <div key={tenant.id} className="space-y-1">
            <div className="font-semibold">{tenant.name}</div>
            <div className="text-xs text-muted-foreground">{tenant.domains.join(", ")}</div>
          </div>,
          tenant.plan,
          new Date(tenant.createdAt).toLocaleDateString(),
          <StatusBadge key={`${tenant.id}-status`} tone={tenant.status === "active" ? "success" : tenant.status === "trial" ? "info" : "warning"}>
            {tenant.status}
          </StatusBadge>,
          <Button key={`${tenant.id}-link`} asChild variant="ghost" size="sm">
            <Link href={`/superadmin/tenants/${tenant.id}`}>View</Link>
          </Button>,
        ])}
        actions={<Button variant="outline" size="sm">Refresh</Button>}
        bulkActions={<div className="text-xs text-muted-foreground">Pagination: UI placeholder</div>}
      />
    </ModuleScaffold>
  );
}
