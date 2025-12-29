"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAssignRole, useCreateRole, usePermissions, useRoles, useSetRolePermissions } from "@/lib/hooks/use-security";
import { useAuth } from "@/lib/auth/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/lib/api/client";

const roleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

const assignSchema = z.object({
  userId: z.string().min(1),
  role: z.string().min(1),
  asPrimary: z.boolean().default(true),
});

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const rolesQuery = useRoles();
  const permissionsQuery = usePermissions();
  const createRole = useCreateRole();
  const setRolePermissions = useSetRolePermissions(selectedRoleId ?? "");
  const assignRole = useAssignRole();

  const roleForm = useForm<z.infer<typeof roleSchema>>({ resolver: zodResolver(roleSchema) });
  const assignForm = useForm<z.infer<typeof assignSchema>>({ resolver: zodResolver(assignSchema) });

  const selectedRole = useMemo(() => rolesQuery.data?.find((r) => r.id === selectedRoleId), [rolesQuery.data, selectedRoleId]);

  const availablePermissions = permissionsQuery.data ?? [];

  const handleCreateRole = roleForm.handleSubmit((values) => {
    createRole.mutate(values, {
      onSuccess: () => {
        toast.success("Role created");
        roleForm.reset();
      },
      onError: (err) => toast.error(apiErrorMessage(err)),
    });
  });

  const handleAssignRole = (values: z.infer<typeof assignSchema>) => {
    assignRole.mutate(values, {
      onSuccess: () => toast.success("Role assigned"),
      onError: (err) => toast.error(apiErrorMessage(err)),
    });
  };

  const handleSetPermissions = (roleId: string, codes: string[]) => {
    if (!roleId) return;
    setRolePermissions.mutateAsync(codes, {
      onSuccess: () => toast.success("Permissions updated"),
      onError: (err) => toast.error(apiErrorMessage(err)),
    });
  };

  return (
    <PermissionGuard required="security:rbac:view">
      <div className="space-y-6">
        <PageHeader
          title="Roles & RBAC"
          description="Manage roles, permissions, and assignments."
        />

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rolesQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" /> Loading roles...
                </div>
              ) : rolesQuery.data?.length ? (
                <div className="space-y-2">
                  {rolesQuery.data.map((role) => (
                    <div
                      key={role.id}
                      className={`flex items-start justify-between rounded border p-3 ${selectedRoleId === role.id ? "border-primary" : "border-border"}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <button className="text-left font-semibold" onClick={() => setSelectedRoleId(role.id)}>
                            {role.name}
                          </button>
                          <Badge variant="outline">{role.permissions.length} perms</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{role.description || "No description"}</p>
                        <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                          {role.permissions.map((perm) => (
                            <Badge key={perm} variant="secondary">{perm}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No roles yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form className="space-y-3" onSubmit={handleCreateRole}>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...roleForm.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input {...roleForm.register("description")} />
                </div>
                {hasPermission("security:rbac:manage") && (
                  <Button type="submit" disabled={createRole.isPending}>
                    {createRole.isPending ? "Saving..." : "Create"}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {selectedRole && (
          <Card>
            <CardHeader>
              <CardTitle>Permissions for {selectedRole.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {availablePermissions.map((perm) => {
                  const checked = selectedRole.permissions.includes(perm.code);
                  return (
                    <label key={perm.id} className="flex items-center gap-2 rounded border px-2 py-1 text-xs">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = checked
                            ? selectedRole.permissions.filter((p) => p !== perm.code)
                            : [...selectedRole.permissions, perm.code];
                          handleSetPermissions(selectedRole.id, next);
                        }}
                        disabled={!hasPermission("security:rbac:manage")}
                      />
                      <span>{perm.code}</span>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Assign role to user</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-3" onSubmit={assignForm.handleSubmit(handleAssignRole)}>
              <div className="space-y-1">
                <Label>User ID</Label>
                <Input {...assignForm.register("userId")} placeholder="user id" />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Input {...assignForm.register("role")} placeholder="role name" />
              </div>
              <div className="space-y-1">
                <Label>Primary?</Label>
                <input type="checkbox" className="h-4 w-4" {...assignForm.register("asPrimary")} />
              </div>
              <div className="md:col-span-3">
                {hasPermission("security:rbac:manage") && (
                  <Button type="submit" disabled={assignRole.isPending}>
                    {assignRole.isPending ? "Assigning..." : "Assign"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
