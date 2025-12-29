import { TableWithToolbar } from "@/components/shell/table-with-toolbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { users } from "@/lib/superadmin/mock-data";

export default function SuperAdminUsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Users & Roles</h1>
        <p className="text-sm text-muted-foreground">Platform-level users. Read-only view.</p>
      </div>
      <TableWithToolbar
        title="Users"
        columns={["Email", "Role", "Status"]}
        rows={users.map((user) => [
          user.email,
          user.role,
          <StatusBadge key={user.id} tone={user.status === "active" ? "success" : "warning"}>
            {user.status}
          </StatusBadge>,
        ])}
      />
    </div>
  );
}
