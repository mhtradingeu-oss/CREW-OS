"use client";

import { useState } from "react";
import { useAiRestrictions, useCreateAiRestriction, useDeleteAiRestriction } from "@/lib/hooks/use-security";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/client";

export default function AiRestrictionsPage() {
  const restrictions = useAiRestrictions();
  const createRestriction = useCreateAiRestriction();
  const deleteRestriction = useDeleteAiRestriction();
  const [submitting, setSubmitting] = useState(false);

  return (
    <PermissionGuard required="ai:manage">
      <div className="space-y-6">
        <PageHeader title="AI Restriction Policies" description="Control allowed and blocked AI actions." />
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Policies</CardTitle>
            </CardHeader>
            <CardContent>
              {restrictions.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" /> Loading policies...
                </div>
              ) : (
                <div className="overflow-hidden rounded border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Rules</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {restrictions.data?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.rulesJson ? item.rulesJson.slice(0, 80) : "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() =>
                                deleteRestriction.mutate(item.id, {
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
              <CardTitle>Create AI restriction</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement;
                  const fd = new FormData(form);
                  const name = (fd.get("name") as string) ?? "";
                  const rulesJson = (fd.get("rulesJson") as string) || undefined;
                  setSubmitting(true);
                  await createRestriction.mutateAsync(
                    { name, rulesJson },
                    {
                      onSuccess: () => {
                        toast.success("Restriction created");
                        form.reset();
                      },
                      onError: (err) => toast.error(apiErrorMessage(err)),
                    },
                  );
                  setSubmitting(false);
                }}
              >
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input name="name" required />
                </div>
                <div className="space-y-1">
                  <Label>Rules JSON</Label>
                  <Textarea name="rulesJson" placeholder='{"blocked": ["export_data"], "allowed": ["summarize"]}' />
                </div>
                <Button type="submit" disabled={submitting || createRestriction.isPending}>
                  {submitting ? "Saving..." : "Create"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
}
