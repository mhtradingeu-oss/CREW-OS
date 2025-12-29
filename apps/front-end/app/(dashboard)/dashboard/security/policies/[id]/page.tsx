"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { usePolicy, useUpdatePolicy } from "@/lib/hooks/use-security";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  key: z.string().min(1),
  category: z.string().optional(),
  status: z.string().optional(),
  rulesJson: z.string().optional(),
  brandId: z.string().optional(),
});

export default function PolicyDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const policy = usePolicy(id);
  const updatePolicy = useUpdatePolicy(id);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (policy.data) {
      form.reset({
        key: policy.data.key,
        category: policy.data.category ?? "",
        status: policy.data.status,
        rulesJson: policy.data.rulesJson ?? "",
        brandId: policy.data.brandId ?? "",
      });
    }
  }, [policy.data, form]);

  const onSubmit = form.handleSubmit((values) => {
    updatePolicy.mutate(values, {
      onSuccess: () => toast.success("Policy updated"),
      onError: (err) => toast.error(apiErrorMessage(err)),
    });
  });

  return (
    <PermissionGuard required="security:policies:read">
      <div className="space-y-6">
        <PageHeader title={policy.data?.key ?? "Policy"} description="Edit policy and constraints." />
        {policy.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Loading...
          </div>
        ) : policy.data ? (
          <Card>
            <CardHeader>
              <CardTitle>Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={onSubmit}>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input {...form.register("key")} />
                  </div>
                  <div className="space-y-1">
                    <Label>Category</Label>
                    <Input {...form.register("category")} />
                  </div>
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Input {...form.register("status")} />
                  </div>
                  <div className="space-y-1">
                    <Label>Brand ID (optional)</Label>
                    <Input {...form.register("brandId")} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Rules JSON</Label>
                  <Textarea className="min-h-[160px]" {...form.register("rulesJson")} />
                </div>
                <Button type="submit" disabled={updatePolicy.isPending}>
                  {updatePolicy.isPending ? "Saving..." : "Save"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-destructive">Policy not found.</p>
        )}
      </div>
    </PermissionGuard>
  );
}
