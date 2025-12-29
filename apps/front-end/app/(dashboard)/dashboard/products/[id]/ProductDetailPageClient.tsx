"use client";

import { z } from "zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProduct, updateProduct, createProductInsight } from "@/lib/api/product";
import { listPricing } from "@/lib/api/pricing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/client";
import { useProductInsight } from "@/lib/hooks/use-product-insight";

const schema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  brandId: z.string().optional(),
  status: z.string().optional(),
});

export default function ProductDetailPageClient() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
  });
  const pricingQuery = useQuery({
    queryKey: ["pricing", id],
    queryFn: async () => {
      const pricingList = await listPricing({ productId: id });
      return pricingList.data[0];
    },
    enabled: Boolean(id),
  });

  const {
    data: insight,
    isLoading: isInsightLoading,
    isError: isInsightError,
    error: insightError,
    refetch: refetchInsight,
  } = useProductInsight(id);

  const insightMutation = useMutation({
    mutationFn: (payload: { forceRegenerate?: boolean }) => {
      if (!data?.brandId) {
        throw new Error("Product must belong to a brand before generating insights.");
      }
      return createProductInsight(id, {
        brandId: data.brandId,
        forceRegenerate: payload.forceRegenerate,
      });
    },
    onSuccess: (_, variables) => {
      toast.success(variables?.forceRegenerate ? "Insight refreshed" : "Insight generated");
      void refetchInsight();
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      sku: "",
      brandId: "",
      status: "",
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        name: data.name,
        slug: data.slug,
        description: data.description ?? "",
        sku: data.sku ?? "",
        brandId: data.brandId ?? "",
        status: data.status ?? "",
      });
    }
  }, [data, form]);

  const mutation = useMutation({
    mutationFn: (payload: z.infer<typeof schema>) => updateProduct(id, payload),
    onSuccess: () => {
      toast.success("Product updated");
      void queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const brandId = data?.brandId;
  const canRunInsight = Boolean(brandId);
  const insightTimestamp = insight ? new Date(insight.updatedAt ?? insight.createdAt).toLocaleString() : null;

  const handleGenerate = async () => {
    if (!canRunInsight) {
      toast.error("Assign the product to a brand before generating insights.");
      return;
    }
    try {
      await insightMutation.mutateAsync({ forceRegenerate: false });
    } catch {
      /* handled above */
    }
  };

  const handleRefresh = async () => {
    if (!canRunInsight) {
      toast.error("Assign the product to a brand before refreshing insights.");
      return;
    }
    try {
      await insightMutation.mutateAsync({ forceRegenerate: true });
    } catch {
      /* handled above */
    }
  };

  if (!hasPermission(["product:read", "product:update"])) return <div>Access denied.</div>;
  if (isLoading || !data) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{data.name}</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard/products")}>
          Back
        </Button>
      </div>
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input {...form.register("slug")} />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input {...form.register("description")} />
        </div>
        <div className="space-y-2">
          <Label>SKU</Label>
          <Input {...form.register("sku")} />
        </div>
        <div className="space-y-2">
          <Label>Brand ID</Label>
          <Input {...form.register("brandId")} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Input {...form.register("status")} />
        </div>
        {hasPermission("product:update") && (
          <div className="md:col-span-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        )}
      </form>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Pricing snapshot & AI insight</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pricing highlights stay in sync with the latest AI summary for this product.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Pricing snapshot
              </p>
              {pricingQuery.isLoading ? (
                <div className="text-sm text-muted-foreground">Loading pricing data...</div>
              ) : pricingQuery.data ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Base price</span>
                    <span className="font-medium">{pricingQuery.data.basePrice ?? "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cost</span>
                    <span className="font-medium">{pricingQuery.data.cost ?? "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Margin</span>
                    <span className="font-medium">{pricingQuery.data.margin ?? "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Currency</span>
                    <span className="font-medium">{pricingQuery.data.currency ?? "-"}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No pricing recorded yet.</div>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">AI insight</p>
              {isInsightLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" />
                  Fetching the latest insight...
                </div>
              ) : insight ? (
                <>
                  <p className="text-base font-semibold text-slate-900">{insight.summary}</p>
                  <pre className="rounded-md border border-slate-200 bg-slate-900/5 p-3 text-sm text-slate-800">
                    {insight.details}
                  </pre>
                  {insightTimestamp && (
                    <p className="text-xs text-muted-foreground">Last updated {insightTimestamp}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Generate an insight to capture summary, tone, and next actions.
                </p>
              )}
              {isInsightError && (
                <p className="text-xs text-destructive">Failed to load insight: {apiErrorMessage(insightError)}</p>
              )}
              {insightMutation.isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" />
                  Talking to the insight engine...
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerate} disabled={!canRunInsight || insightMutation.isLoading}>
              Generate Insight
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={!canRunInsight || insightMutation.isLoading}
            >
              Refresh Insight
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/products/${id}/pricing/drafts`)}
            >
              Manage drafts
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/products/${id}/pricing/competitors`)}
            >
              Competitors
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/products/${id}/pricing/logs`)}
            >
              Pricing logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
