"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPlatformOpsSecurity } from "@/lib/api/platform-ops";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default function PlatformSecurityPage() {
  const { data, isLoading, isError, refetch } = useQuery(["platform-ops", "security"], () =>
    fetchPlatformOpsSecurity(),
  );

  return (
    <PermissionGuard required="ops:security">
      <div className="space-y-6">
        <PageHeader
          title="Sessions & Security"
          description="Read-only view of users and roles across the platform."
          meta={
            <InfoTooltip content="This view draws from the user table; real session tracking lands in Phase 5." />
          }
          actions={
            <button
              className="text-sm font-medium text-primary underline"
              onClick={() => refetch()}
            >
              Refresh
            </button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{data?.totalUsers ?? "—"}</div>
              <p className="text-xs text-muted-foreground">Tracked accounts</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{data?.adminCount ?? "—"}</div>
              <p className="text-xs text-muted-foreground">Super + admin roles</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              {data
                ? Object.entries(data.roles).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <span>{role}</span>
                      <span>{count}</span>
                    </div>
                  ))
                : "No data"}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">User directory</CardTitle>
              <InfoTooltip content="Statuses pulled from user table; last activity will arrive later." />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Loading security data...
              </div>
            ) : isError ? (
              <div className="text-sm text-destructive">Failed to load security data.</div>
            ) : data?.users.length ? (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="text-xs">{user.email}</TableCell>
                        <TableCell className="text-xs">{user.role ?? "—"}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant={user.status === "ACTIVE" ? "secondary" : "outline"}>
                            {user.status ?? "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(user.updatedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState title="No users yet" description="Users will appear once seeded." />
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
