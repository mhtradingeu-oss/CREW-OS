"use client";

import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addCompetitor, listCompetitors } from "@/lib/api/pricing";
import type { CompetitorPriceDto } from "@/lib/types/pricing";
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
import { PermissionGuard } from "@/components/layout/permission-guard";

const schema = z.object({
  competitor: z.string().min(1),
  marketplace: z.string().optional(),
  country: z.string().optional(),
  priceNet: z.preprocess((val) => (val === "" ? undefined : Number(val)), z.number()),
  priceGross: z.preprocess((val) => (val === "" ? undefined : Number(val)), z.number()),
  currency: z.string().length(3).optional(),
});

export default function CompetitorPricingPageClient() {
  const params = useParams();
  const productId = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery<CompetitorPriceDto[]>({
    queryKey: ["competitors", productId],
    queryFn: () => listCompetitors(productId),
    enabled: Boolean(productId),
  });

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (payload: z.infer<typeof schema>) => addCompetitor(productId, payload),
    onSuccess: () => {
      toast.success("Competitor price recorded");
      void queryClient.invalidateQueries({ queryKey: ["competitors", productId] });
      form.reset();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!hasPermission("pricing:read")) return <div>Access denied.</div>;

  return (
    <PermissionGuard required="pricing:read">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Competitor Prices</h1>
          <Button variant="outline" onClick={() => router.push(`/dashboard/products/${productId}`)}>
            Back
          </Button>
        </div>
        {hasPermission("pricing:update") && (
          <form
            className="grid gap-4 md:grid-cols-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label>Competitor</Label>
              <Input {...form.register("competitor")} />
            </div>
            <div className="space-y-2">
              <Label>Marketplace</Label>
              <Input {...form.register("marketplace")} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input {...form.register("country")} />
            </div>
            <div className="space-y-2">
              <Label>Price Net</Label>
              <Input type="number" step="0.01" {...form.register("priceNet")} />
            </div>
            <div className="space-y-2">
              <Label>Price Gross</Label>
              <Input type="number" step="0.01" {...form.register("priceGross")} />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input placeholder="EUR" {...form.register("currency")} />
            </div>
            <div className="md:col-span-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Add competitor price"}
              </Button>
            </div>
          </form>
        )}
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            Loading competitor prices...
          </div>
        ) : isError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load competitors: {apiErrorMessage(error)}
            <div>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </div>
        ) : data && data.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            No competitor prices yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competitor</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.competitor}</TableCell>
                    <TableCell>{item.marketplace ?? "-"}</TableCell>
                    <TableCell>{item.country ?? "-"}</TableCell>
                    <TableCell>{item.priceNet ?? "-"}</TableCell>
                    <TableCell>{item.currency ?? "-"}</TableCell>
                    <TableCell>
                      {item.collectedAt ? new Date(item.collectedAt).toLocaleString() : "-"}
                    </TableCell>
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
