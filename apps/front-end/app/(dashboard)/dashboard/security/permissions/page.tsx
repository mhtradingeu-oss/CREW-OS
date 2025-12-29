"use client";

import { useMemo, useState } from "react";
import { usePermissions, useRoles } from "@/lib/hooks/use-security";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

export default function PermissionsPage() {
  const permissionsQuery = usePermissions();
  const rolesQuery = useRoles();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const data = permissionsQuery.data ?? [];
    if (!search) return data;
    return data.filter((p) => p.code.toLowerCase().includes(search.toLowerCase()));
  }, [permissionsQuery.data, search]);

  return (
    <PermissionGuard required="security:rbac:view">
      <div className="space-y-6">
        <PageHeader title="Permissions" description="Browse permission codes and which roles include them." />
        <div className="flex gap-3">
          <Input placeholder="Search permission" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Permissions directory</CardTitle>
          </CardHeader>
          <CardContent>
            {permissionsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Loading permissions...
              </div>
            ) : (
              <div className="overflow-hidden rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Roles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((perm) => {
                      const rolesWith = (rolesQuery.data ?? []).filter((r) => r.permissions.includes(perm.code));
                      return (
                        <TableRow key={perm.id}>
                          <TableCell>{perm.code}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{perm.description || "—"}</TableCell>
                          <TableCell className="flex flex-wrap gap-1 text-xs">
                            {rolesWith.map((r) => (
                              <Badge key={r.id} variant="secondary">{r.name}</Badge>
                            ))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
