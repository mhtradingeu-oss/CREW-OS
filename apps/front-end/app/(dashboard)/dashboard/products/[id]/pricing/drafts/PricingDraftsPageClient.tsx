"use client";

import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listDrafts, createDraft } from "@/lib/api/pricing";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { apiErrorMessage } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGuard } from "@/components/layout/permission-guard";

const schema = z.object({
  channel: z.string().min(1),
  oldNet: z.preprocess((val) => Number(val), z.number()),
  newNet: z.preprocess((val) => Number(val), z.number()),
  status: z.string().optional(),
});

export default function PricingDraftsPageClient() {
  const params = useParams();
  const productId = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["pricing-drafts", productId],
    queryFn: () => listDrafts(productId),
    enabled: Boolean(productId),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { channel: "", status: "DRAFT" },
  });

  const mutation = useMutation({
    mutationFn: (payload: z.infer<typeof schema>) => createDraft(productId, payload),
    onSuccess: () => {
      toast.success("Draft created");
      void queryClient.invalidateQueries({ queryKey: ["pricing-drafts", productId] });
      form.reset();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!hasPermission("pricing:read")) return <div>Access denied.</div>;

  return (
    <PermissionGuard required="pricing:read">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Pricing Drafts</h1>
          <Button variant="outline" onClick={() => router.push(`/dashboard/products/${productId}`)}>
            Back
          </Button>
        </div>
        {hasPermission("pricing:update") && (
          <form
            className="grid gap-4 md:grid-cols-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="space-y-2 md:col-span-2">
              <Label>Channel</Label>
              <Input {...form.register("channel")} />
            </div>
            <div className="space-y-2">
              <Label>Old Net</Label>
              <Input type="number" step="0.01" {...form.register("oldNet")} />
            </div>
            <div className="space-y-2">
              <Label>New Net</Label>
              <Input type="number" step="0.01" {...form.register("newNet")} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Input {...form.register("status")} />
            </div>
            <div className="md:col-span-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Create draft"}
              </Button>
            </div>
          </form>
        )}
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            Loading drafts...
          </div>
        ) : isError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load drafts: {apiErrorMessage(error)}
            <div>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </div>
        ) : data && data.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            No drafts yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Old</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((draft) => (
                  <TableRow key={draft.id}>
                    <TableCell>{draft.channel}</TableCell>
                    <TableCell>{draft.oldNet ?? "-"}</TableCell>
                    <TableCell>{draft.newNet ?? "-"}</TableCell>
                    <TableCell>{draft.status ?? "-"}</TableCell>
                    <TableCell>{draft.createdAt ? new Date(draft.createdAt).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
