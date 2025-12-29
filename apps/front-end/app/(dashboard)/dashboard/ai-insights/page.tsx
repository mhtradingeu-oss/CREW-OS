"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { listInsights, getInsight } from "@/lib/api/ai-brain";
import { apiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { useAuth } from "@/lib/auth/auth-context";

const DOMAINS = [
  "pricing",
  "inventory",
  "crm",
  "marketing",
  "partner",
  "finance",
  "autonomy",
  "governance",
];

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ domain: "", agentId: "", severity: "", brandId: "" });
  const { hasPermission } = useAuth();

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listInsights({
        domain: filters.domain || undefined,
        agentId: filters.agentId || undefined,
        severity: filters.severity ? (filters.severity as any) : undefined,
        brandId: filters.brandId || undefined,
        limit: 50,
      });
      setInsights(res ?? []);
      setSelected(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters.domain, filters.agentId, filters.severity, filters.brandId]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const loadDetail = async (id: string) => {
    try {
      const detail = await getInsight(id);
      setSelected(detail);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const severityBadge = useMemo(() => {
    const sev = (selected as any)?.details?.severity ?? (selected as any)?.severity;
    if (!sev) return null;
    return (
      <Badge variant="outline" className="uppercase">
        {sev}
      </Badge>
    );
  }, [selected]);

  return (
    <PermissionGuard required={"ai:read"}>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">AI Insights</h1>
            <p className="text-sm text-muted-foreground">Browse AI insight history by domain and agent.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <select
              className="rounded-md border px-3 py-2"
              value={filters.domain}
              onChange={(e) => setFilters((p) => ({ ...p, domain: e.target.value }))}
            >
              <option value="">All domains</option>
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <Input
              placeholder="Agent ID"
              value={filters.agentId}
              onChange={(e) => setFilters((p) => ({ ...p, agentId: e.target.value }))}
            />
            <select
              className="rounded-md border px-3 py-2"
              value={filters.severity}
              onChange={(e) => setFilters((p) => ({ ...p, severity: e.target.value }))}
            >
              <option value="">Any severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <Input
              placeholder="Brand ID"
              value={filters.brandId}
              onChange={(e) => setFilters((p) => ({ ...p, brandId: e.target.value }))}
            />
            <Button variant="outline" onClick={fetchList} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Insights</CardTitle>
              {loading && <Skeleton className="h-4 w-24" />}
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : insights.length === 0 ? (
                <div className="text-sm text-muted-foreground">No insights found.</div>
              ) : (
                insights.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-full rounded-md border p-3 text-left text-sm transition hover:border-primary ${selected?.id === item.id ? "border-primary bg-primary/5" : ""}`}
                    onClick={() => void loadDetail(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{item.summary ?? "Insight"}</div>
                      <Badge variant="secondary" className="uppercase">
                        {item.os ?? item.domain ?? ""}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                    </div>
                    {item.details ? (
                      <div className="line-clamp-2 text-xs text-muted-foreground">{item.details}</div>
                    ) : null}
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Insight detail</CardTitle>
              {severityBadge}
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {!selected ? (
                <div className="text-sm text-muted-foreground">Select an insight to view details.</div>
              ) : (
                <>
                  <div className="font-semibold">{selected.summary ?? "Insight"}</div>
                  <div className="text-xs text-muted-foreground">
                    {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ""}
                  </div>
                  <div className="rounded-md border bg-muted/40 p-2 whitespace-pre-wrap">
                    {typeof selected.details === "string" ? selected.details : JSON.stringify(selected.details, null, 2)}
                  </div>
                  {selected.entityId ? (
                    <div className="text-xs text-muted-foreground">Related: {selected.entityId}</div>
                  ) : null}
                  {hasPermission("ai:config:read") && selected.brandId ? (
                    <div className="text-xs text-muted-foreground">Brand: {selected.brandId}</div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
}
