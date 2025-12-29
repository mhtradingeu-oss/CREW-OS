"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listLogs, updatePricing } from "@/lib/api/pricing";
import { getProduct } from "@/lib/api/product";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { apiErrorMessage } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { usePricing, useAIPricingSuggestion } from "@/lib/hooks/use-pricing";

const schema = z.object({
  basePrice: z.preprocess((val) => (val === "" ? undefined : Number(val)), z.number().optional()),
  cost: z.preprocess((val) => (val === "" ? undefined : Number(val)), z.number().optional()),
  currency: z.string().trim().optional(),
  notes: z.string().optional(),
});

export default function PricingDetailPageClient() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [strategy, setStrategy] = useState("margin");

  const { data, isLoading } = usePricing({ pricingId: id });
  const aiSuggestionQuery = useAIPricingSuggestion(data?.productId, strategy);
  const aiLoading = aiSuggestionQuery.isLoading || aiSuggestionQuery.isFetching;
  const aiSuggestion = aiSuggestionQuery.data;
  const aiError = aiSuggestionQuery.error;
  const logsQuery = useQuery({
    queryKey: ["pricing-logs-preview", data?.productId],
    queryFn: () => listLogs(data?.productId ?? ""),
    enabled: Boolean(data?.productId),
  });
  const productQuery = useQuery({
    queryKey: ["product", data?.productId],
    queryFn: () => getProduct(data?.productId ?? ""),
    enabled: Boolean(data?.productId),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { basePrice: undefined, cost: undefined, currency: undefined, notes: undefined },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        basePrice: data.basePrice ?? undefined,
        cost: data.cost ?? undefined,
        currency: data.currency ?? undefined,
        notes: data.notes ?? undefined,
      });
    }
  }, [data, form]);

  const mutation = useMutation({
    mutationFn: (payload: z.infer<typeof schema>) => updatePricing(id, payload),
    onSuccess: () => {
      toast.success("Pricing updated");
      void queryClient.invalidateQueries({ queryKey: ["pricing", id] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard required={["pricing:read"]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">
              Pricing for {productQuery.data?.name ?? data.productId}
            </h1>
            <p className="text-sm text-muted-foreground">Brand: {data.brandId ?? "N/A"}</p>
            <p className="text-xs text-muted-foreground">
              AI follows brand guardrails and keeps margins healthy. Update prices with care—changes
              are logged automatically.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/products/${data.productId}/pricing/logs`)}
            >
              View logs
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/products/${data.productId}/pricing/drafts`)}
            >
              Manage drafts
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/products/${data.productId}/pricing/competitors`)}
            >
              Competitors
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/pricing")}>
              Back
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>Base price: {data.basePrice ?? "-"}</div>
              <div>Cost: {data.cost ?? "-"}</div>
              <div>Margin: {data.margin ?? "-"}</div>
              <div>Currency: {data.currency ?? "-"}</div>
              <div>Updated: {data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "-"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle>AI Pricing suggestion</CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={strategy}
                    onChange={(event) => setStrategy(event.target.value)}
                    className="min-w-[160px]"
                  >
                    <option value="margin">Protect margin</option>
                    <option value="competitive">Match competitors</option>
                    <option value="clearance">Clearance push</option>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void aiSuggestionQuery.refetch()}
                    disabled={aiLoading || !hasPermission("ai:pricing") || !data?.productId}
                  >
                    {aiLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Confidence score, risk assessment, and rationale under each strategy.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {aiLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Spinner className="h-4 w-4" />
                  Generating suggestion...
                </div>
              ) : aiSuggestion ? (
                <>
                  <div className="grid gap-2 rounded-md border border-border p-3 text-sm">
                    <div className="flex justify-between">
                      <span>Current base price</span>
                      <span className="font-semibold">{data?.basePrice ?? "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Suggested price</span>
                      <span className="font-semibold">{aiSuggestion.suggestedPrice ?? "-"}</span>
                    </div>
                    {data?.basePrice != null && aiSuggestion.suggestedPrice != null ? (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Delta</span>
                        <span>
                          {aiSuggestion.suggestedPrice - data.basePrice >= 0 ? "+" : ""}
                          {(aiSuggestion.suggestedPrice - data.basePrice).toFixed(2)}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Strategy</span>
                      <span>{aiSuggestion.strategy ?? strategy}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Risk {aiSuggestion.riskLevel}</Badge>
                      <Badge variant="secondary">
                        Confidence {Math.round((aiSuggestion.confidenceScore ?? 0) * 100)}%
                      </Badge>
                    </div>
                    <p>{aiSuggestion.reasoning}</p>
                    {aiSuggestion.competitorSummary && (
                      <p className="text-xs text-muted-foreground">
                        Competitors: {aiSuggestion.competitorSummary}
                      </p>
                    )}
                    {aiSuggestion.competitors?.length ? (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold">Competitors:</span> {" "}
                        {aiSuggestion.competitors.map((c) => `${c.name} (${c.price})`).join(", ")}
                      </div>
                    ) : null}
                    <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
                      <div>Market: {aiSuggestion.market ?? "-"}</div>
                      <div>Strategy: {aiSuggestion.strategy ?? strategy}</div>
                      <div>Current net: {aiSuggestion.currentNet ?? "-"}</div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No AI suggestion yet.</p>
              )}
              {aiError ? <p className="text-xs text-red-500">{apiErrorMessage(aiError)}</p> : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            >
              <div className="space-y-2">
                <Label title="Net price before VAT">Base price</Label>
                <Input type="number" step="0.01" {...form.register("basePrice")} />
              </div>
              <div className="space-y-2">
                <Label title="Cost basis">Cost</Label>
                <Input type="number" step="0.01" {...form.register("cost")} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input placeholder="EUR" {...form.register("currency")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Input {...form.register("notes")} />
              </div>
              {hasPermission("pricing:update") && (
                <div className="md:col-span-2">
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {logsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Loading logs...
              </div>
            ) : logsQuery.data && logsQuery.data.length > 0 ? (
              <div className="space-y-2 text-sm">
                {logsQuery.data.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <div className="font-medium">{log.summary ?? "Log entry"}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.channel ?? "base"} — {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Δ {log.newNet ?? "-"} </div>
                  </div>
                ))}
                <Link
                  className="text-primary text-sm"
                  href={`/dashboard/products/${data.productId}/pricing/logs`}
                >
                  View all logs
                </Link>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No logs yet. Generate an AI suggestion or save a pricing change to start the audit
                trail.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
