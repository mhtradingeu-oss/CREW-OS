"use client";

import { useState } from "react";
import Link from "next/link";
import { usePolicies, useCreatePolicy, useDeletePolicy } from "@/lib/hooks/use-security";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/client";

export default function PoliciesPage() {
  const [search, setSearch] = useState("");
  const policies = usePolicies({ search });
  const createPolicy = useCreatePolicy();
  const deletePolicy = useDeletePolicy();

  return (
    <PermissionGuard required="security:policies:read">
      <div className="space-y-6">
        <PageHeader title="Security Policies" description="Govern access and constraints across modules." />
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 pb-3">
                <Input
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64"
                />
                <Button variant="outline" onClick={() => policies.refetch()} disabled={policies.isFetching}>
                  {policies.isFetching ? "Searching..." : "Search"}
                </Button>
              </div>
              {policies.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" /> Loading policies...
                </div>
              ) : (
                <div className="overflow-hidden rounded border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policies.data?.data.map((policy) => (
                        <TableRow key={policy.id}>
                          <TableCell>{policy.key}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{policy.category || "—"}</TableCell>
                          <TableCell className="text-xs">{policy.status}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {policy.updatedAt ? new Date(policy.updatedAt).toLocaleString() : ""}
                          </TableCell>
                          <TableCell className="text-right text-sm space-x-2">
                            <Link className="text-primary" href={`/dashboard/security/policies/${policy.id}`}>
                              View
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() =>
                                deletePolicy.mutate(policy.id, {
                                  onSuccess: () => toast.success("Policy deleted"),
                                  onError: (err) => toast.error(apiErrorMessage(err)),
                                })
                              }
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement;
                  const data = new FormData(form);
                  const key = data.get("key") as string;
                  const category = data.get("category") as string;
                  const status = data.get("status") as string;
                  const rulesJson = data.get("rulesJson") as string;
                  createPolicy.mutate(
                    { key, category, status, rulesJson },
                    {
                      onSuccess: () => {
                        toast.success("Policy created");
                        form.reset();
                      },
                      onError: (err) => toast.error(apiErrorMessage(err)),
                    },
                  );
                }}
              >
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input name="key" required />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input name="category" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input name="status" defaultValue="enabled" />
                </div>
                <div className="space-y-2">
                  <Label>Rules JSON</Label>
                  <Input name="rulesJson" placeholder='{"allowRoles":["ADMIN"]}' />
                </div>
                <Button type="submit" disabled={createPolicy.isPending}>
                  {createPolicy.isPending ? "Saving..." : "Create"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
}
