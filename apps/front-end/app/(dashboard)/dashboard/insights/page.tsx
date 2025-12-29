"use client";

import { useEffect, useMemo, useState } from "react";
import { refreshInsights } from "@/lib/api/ai-brain";
import { listBrands } from "@/lib/api/brand";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { useAiInsights } from "@/lib/hooks/use-ai-insights";
import { Modal } from "@/components/ui/modal";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/auth/auth-context";

export default function InsightsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [brandId, setBrandId] = useState<string | undefined>(undefined);
  const [scope, setScope] = useState<string | undefined>(undefined);
  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedInsight, setSelectedInsight] = useState<any | null>(null);
  const { hasPermission } = useAuth();

  const insightParams = useMemo(
    () => ({
      brandId,
      scope,
      periodStart: periodStart || undefined,
      periodEnd: periodEnd || undefined,
      sortOrder,
    }),
    [brandId, scope, periodStart, periodEnd, sortOrder],
  );

  const insightQuery = useAiInsights(insightParams);

  const loadBrands = async () => {
    try {
      const brandList = await listBrands();
      setBrands(brandList?.data ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  useEffect(() => {
    void loadBrands();
  }, []);

  useEffect(() => {
    if (insightQuery.error) {
      toast.error(apiErrorMessage(insightQuery.error));
    }
  }, [insightQuery.error]);

  const handleRefreshInsights = async () => {
    try {
      await refreshInsights({ brandId, scope });
      toast.success("Insights refreshed");
      await insightQuery.refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <PermissionGuard required="ai:read">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">AI Insights</h1>
            <p className="text-sm text-muted-foreground">
              Brand-aware insights with AI narratives. Filter by scope and period, then open details
              for markdown output.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={brandId ?? ""}
              onChange={(e) => setBrandId(e.target.value || undefined)}
            >
              <option value="">All brands</option>
              {brands.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={scope ?? ""}
              onChange={(e) => setScope(e.target.value || undefined)}
            >
              <option value="">All scopes</option>
              <option value="pricing">Pricing</option>
              <option value="crm">CRM</option>
              <option value="marketing">Marketing</option>
              <option value="inventory">Inventory</option>
              <option value="loyalty">Loyalty</option>
            </select>
            <input
              type="date"
              className="rounded-md border px-3 py-2 text-sm"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
            <input
              type="date"
              className="rounded-md border px-3 py-2 text-sm"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
            <Button
              variant="outline"
              onClick={() => insightQuery.refetch()}
              disabled={insightQuery.isFetching}
            >
              Refresh
            </Button>
            {hasPermission("ai:run") && (
              <Button
                variant="outline"
                onClick={handleRefreshInsights}
                disabled={insightQuery.isFetching}
              >
                Refresh insights now
              </Button>
            )}
          </div>
        </div>
        {insightQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : insightQuery.isError ? (
          <div className="flex items-center justify-between rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm">
            <span className="text-destructive">{apiErrorMessage(insightQuery.error)}</span>
            <Button size="sm" onClick={() => insightQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : (Array.isArray(insightQuery.data) ? insightQuery.data.length === 0 : true) ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            <p>No insights yet.</p>
            {hasPermission("ai:run") && (
              <Button className="mt-3" onClick={handleRefreshInsights}>
                Refresh insights now
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {(Array.isArray(insightQuery.data) ? insightQuery.data : []).map((item: any) => (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{item.summary ?? "Insight"}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.scope || item.os || "general"} •{" "}
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedInsight(item)}>
                    View details
                  </Button>
                </div>
                <div className="text-muted-foreground line-clamp-2">
                  {typeof item.details === "string" ? item.details : JSON.stringify(item.details)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!selectedInsight}
        onClose={() => setSelectedInsight(null)}
        title={selectedInsight?.summary ?? "Insight details"}
      >
        {selectedInsight ? (
          <div className="space-y-3 text-sm">
            <div className="text-muted-foreground">
              {selectedInsight.scope || selectedInsight.os || "general"} •{" "}
              {selectedInsight.createdAt
                ? new Date(selectedInsight.createdAt).toLocaleString()
                : ""}
            </div>
            <ReactMarkdown className="prose prose-sm max-w-none">
              {typeof selectedInsight.details === "string"
                ? selectedInsight.details
                : JSON.stringify(selectedInsight.details ?? "", null, 2)}
            </ReactMarkdown>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyText(selectedInsight.details ?? "")}
              >
                Copy text
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </PermissionGuard>
  );
}
