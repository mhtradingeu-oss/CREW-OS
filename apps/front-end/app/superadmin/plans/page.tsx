import { ModuleScaffold } from "@/components/shell/module-scaffold";
import { PageHeader } from "@/components/shell/page-header";
import { TableWithToolbar } from "@/components/shell/table-with-toolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { planDefinitions, planOverrides, tenants } from "@/lib/superadmin/mock-data";

export default function SuperAdminPlansPage() {
  return (
    <ModuleScaffold
      header={{
        title: "Plans & Feature Flags",
        description: "Read-only plan catalog and per-tenant overrides",
        breadcrumbs: [{ label: "Super Admin" }, { label: "Plans" }],
      }}
    >
      <PageHeader
        title="Plan Catalog"
        description="Definitions returned by backend; feature sets rendered read-only"
        meta={<StatusBadge tone="info">Read-only</StatusBadge>}
      />

      <TableWithToolbar
        title="Plan definitions"
        description="Canonical plan catalog returned by the backend."
        columns={["Plan", "Description", "AI level", "Feature set"]}
        rows={planDefinitions.map((plan) => [
          <div key={plan.key} className="font-semibold">{plan.name}</div>,
          plan.description,
          plan.features.aiLevel,
          <div key={`${plan.key}-features`} className="text-xs text-muted-foreground">
            {Object.entries(plan.features)
              .map(([k, v]) => `${k}:${typeof v === "boolean" ? (v ? "on" : "off") : v}`)
              .join(" • ")}
          </div>,
        ])}
      />

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Tenant plan overrides (read-only)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {planOverrides.map((override) => {
            const tenant = tenants.find((t) => t.id === override.tenantId);
            return (
              <div key={override.tenantId} className="rounded border border-border/60 bg-card/60 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{tenant?.name ?? override.tenantId}</div>
                    <div className="text-xs text-muted-foreground">plan: {tenant?.plan}</div>
                  </div>
                  <StatusBadge tone="info">override</StatusBadge>
                </div>
                <pre className="mt-2 overflow-x-auto rounded bg-muted/60 p-2 text-xs text-muted-foreground">
                  {JSON.stringify(override.overrides, null, 2)}
                </pre>
              </div>
            );
          })}
          {!planOverrides.length && <p className="text-muted-foreground">No overrides configured.</p>}
        </CardContent>
      </Card>
    </ModuleScaffold>
  );
}
