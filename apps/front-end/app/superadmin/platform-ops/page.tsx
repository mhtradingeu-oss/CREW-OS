import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { SimpleTable } from "@/components/shell/simple-table";
import { eventTypes, permissionCodes, policies, rbacRoles } from "@/lib/superadmin/mock-data";

export default function SuperAdminPlatformOpsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Platform Ops</h1>
        <p className="text-sm text-muted-foreground">Read-only governance views for RBAC, policies, and event topology.</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">RBAC Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleTable
            columns={["Role", "Description", "Permissions"]}
            rows={rbacRoles.map((role) => [
              <StatusBadge key={role.code} tone="info">{role.code}</StatusBadge>,
              role.description,
              role.permissions.join(", "),
            ])}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Permission codes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-xs">
          {permissionCodes.map((code) => (
            <StatusBadge key={code} tone="default">{code}</StatusBadge>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {policies.map((policy) => (
            <div key={policy.id as string} className="rounded border border-border/60 bg-card/60 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{policy.name}</span>
                <StatusBadge tone="info">read-only</StatusBadge>
              </div>
              <pre className="mt-2 overflow-x-auto rounded bg-muted/60 p-2 text-xs text-muted-foreground">
                {JSON.stringify(policy.statement, null, 2)}
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Event types / subscribers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {eventTypes.map((evt) => (
            <div key={evt} className="flex items-center justify-between rounded border border-border/60 bg-card/60 px-3 py-2">
              <span>{evt}</span>
              <StatusBadge tone="default">subscriber list TBD</StatusBadge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
