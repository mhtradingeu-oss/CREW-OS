"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listInsights, listReports, refreshInsights, createReport } from "@/lib/api/ai-brain";
import {
  getAutonomyStatus,
  getAutonomyPending,
  updateAutonomyConfig,
  type AutonomyStatus,
} from "@/lib/api/ai-hq";
import { listBrands } from "@/lib/api/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/client";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { useKpiSummary } from "@/lib/hooks/use-kpi-summary";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PeriodOption = "7d" | "30d" | "90d";

export default function AIDashboard() {
  const [insights, setInsights] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
    const [autonomyLoading, setAutonomyLoading] = useState(true);
    const [autonomyStatus, setAutonomyStatus] = useState<AutonomyStatus | null>(null);
    const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [brandId, setBrandId] = useState<string | undefined>(undefined);
  const [scope, setScope] = useState<string | undefined>(undefined);
  const [period, setPeriod] = useState<PeriodOption>("30d");
  const { hasPermission } = useAuth();

  const periodRange = useMemo(() => {
    const end = new Date();
    const start = new Date(end);
    if (period === "7d") start.setDate(end.getDate() - 6);
    else if (period === "30d") start.setDate(end.getDate() - 29);
    else start.setDate(end.getDate() - 89);
    return { start: start.toISOString(), end: end.toISOString() };
  }, [period]);

  const kpiQuery = useKpiSummary({
    brandId,
    scope,
    periodStart: periodRange.start,
    periodEnd: periodRange.end,
  });

  const loadBrands = useCallback(async () => {
    try {
      const brandList = await listBrands();
      setBrands(brandList?.data ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [ins, rep] = await Promise.all([
        listInsights({ brandId, scope, limit: 5 }),
        listReports({ brandId, scope }),
      ]);
      setInsights(ins ?? []);
      setReports(rep?.slice(0, 1) ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [brandId, scope]);

  const loadAutonomy = useCallback(async () => {
    try {
      setAutonomyLoading(true);
      const [status, pending] = await Promise.all([
        getAutonomyStatus(),
        getAutonomyPending({ limit: 5 }),
      ]);
      setAutonomyStatus(status as AutonomyStatus);
      setPendingTasks(pending ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setAutonomyLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadAutonomy();
  }, [loadAutonomy]);

  useEffect(() => {
    if (kpiQuery.error) {
      toast.error(apiErrorMessage(kpiQuery.error));
    }
  }, [kpiQuery.error]);

  const refresh = async () => {
    try {
      setLoading(true);
      await refreshInsights({ brandId, scope });
      toast.success("Insights refreshed");
      await Promise.all([load(), kpiQuery.refetch()]);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setReportLoading(true);
      await createReport({ title: "Strategy Report", brandId, scope });
      toast.success("Report generated");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setReportLoading(false);
    }
  };

  const toggleKillSwitch = async () => {
    if (!autonomyStatus) return;
    try {
      setAutonomyLoading(true);
      const next = !autonomyStatus.globalAutonomyEnabled;
      await updateAutonomyConfig({ globalAutonomyEnabled: next });
      toast.success(next ? "Autonomy enabled" : "Autonomy disabled");
      await loadAutonomy();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setAutonomyLoading(false);
    }
  };

  const summary = kpiQuery.data?.summary;
  const totalLeads =
    kpiQuery.data?.demandSeries?.reduce((sum, item) => sum + (item.leads ?? 0), 0) ?? 0;
  const totalDeals =
    kpiQuery.data?.demandSeries?.reduce((sum, item) => sum + (item.deals ?? 0), 0) ?? 0;

  return (
    <PermissionGuard required="ai:read">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">AI HQ</h1>
            <p className="text-sm text-muted-foreground">
              AI KPIs, insights, and reports in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={brandId ?? ""}
              onChange={(e) => setBrandId(e.target.value || undefined)}
            >
              <option value="">All Brands</option>
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
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodOption)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button
              variant="outline"
              onClick={refresh}
              disabled={loading || !hasPermission("ai:run")}
            >
              {loading ? <Spinner className="h-4 w-4" /> : "Refresh Insights"}
            </Button>
            <Button onClick={generateReport} disabled={reportLoading || !hasPermission("ai:run")}>
              {reportLoading ? <Spinner className="h-4 w-4" /> : "Generate Strategy Report"}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Autonomy</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleKillSwitch}
                disabled={autonomyLoading || !hasPermission(["ai:config:update", "ai:manage"])}
              >
                {autonomyLoading ? <Spinner className="h-4 w-4" /> : autonomyStatus?.globalAutonomyEnabled ? "Disable" : "Enable"}
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md border p-2">
                <div className="text-xs uppercase text-muted-foreground">Status</div>
                <div className="font-semibold">
                  {autonomyStatus?.globalAutonomyEnabled ? "ON" : "OFF"}
                </div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-xs uppercase text-muted-foreground">Last Run</div>
                <div className="font-semibold">{autonomyStatus?.lastRunAt ? new Date(autonomyStatus.lastRunAt).toLocaleString() : "-"}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-xs uppercase text-muted-foreground">Pending</div>
                <div className="font-semibold">{autonomyStatus?.totalPending ?? 0}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-xs uppercase text-muted-foreground">Executed</div>
                <div className="font-semibold">{autonomyStatus?.totalExecuted ?? 0}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending approvals</CardTitle>
              {autonomyLoading && <Spinner className="h-4 w-4" />}
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground">No pending tasks</div>
              ) : (
                pendingTasks.map((task) => (
                  <div key={task.taskId} className="rounded border p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{task.goal ?? "Autonomy task"}</div>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs uppercase">{task.risk ?? ""}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Engine: {task.engine}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {kpiQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-24 w-full" />
            ))
          ) : kpiQuery.data ? (
            <>
              <KpiCard
                title="Revenue"
                value={
                  summary?.revenueCurrency
                    ? `${summary.revenueCurrency} ${summary.revenueTotal.toFixed(2)}`
                    : (summary?.revenueTotal?.toFixed(2) ?? "0")
                }
                subtitle={
                  summary?.revenueChange !== null && summary?.revenueChange !== undefined
                    ? `${summary.revenueChange > 0 ? "▲" : "▼"} ${Math.abs(summary.revenueChange).toFixed(1)}% vs prev`
                    : "No prior period"
                }
              />
              <KpiCard
                title="Inventory Risk"
                value={`${summary?.stockouts ?? 0} stockouts`}
                subtitle={`${summary?.lowStock ?? 0} low-stock SKUs`}
              />
              <KpiCard
                title="Conversion Rate"
                value={
                  summary?.conversionRate !== null && summary?.conversionRate !== undefined
                    ? `${summary.conversionRate}%`
                    : "N/A"
                }
                subtitle={`${totalDeals} deals from ${totalLeads} leads`}
              />
              <KpiCard
                title="Loyalty Engagement"
                value={`${summary?.loyaltyTransactions ?? 0} tx`}
                subtitle={`${summary?.loyaltyPointsNet ?? 0} pts net`}
              />
              <KpiCard
                title="Pricing Deltas"
                value={
                  summary?.pricingDeltaAvg !== null && summary?.pricingDeltaAvg !== undefined
                    ? `${summary.pricingDeltaAvg.toFixed(2)}`
                    : "0"
                }
                subtitle="Avg price change"
              />
            </>
          ) : (
            <div className="md:col-span-5 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No KPI data for this period.
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Revenue Over Time</CardTitle>
              {kpiQuery.isFetching && <Spinner className="h-4 w-4" />}
            </CardHeader>
            <CardContent className="h-64">
              {kpiQuery.isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : kpiQuery.data?.revenueSeries?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kpiQuery.data.revenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No revenue data.
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pricing Deltas</CardTitle>
              {kpiQuery.isFetching && <Spinner className="h-4 w-4" />}
            </CardHeader>
            <CardContent className="h-64">
              {kpiQuery.isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : kpiQuery.data?.pricingSeries?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpiQuery.data.pricingSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="change" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No pricing changes.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inventory Risk</CardTitle>
              {kpiQuery.isFetching && <Spinner className="h-4 w-4" />}
            </CardHeader>
            <CardContent className="h-64">
              {kpiQuery.isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : kpiQuery.data?.inventorySeries?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpiQuery.data.inventorySeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="lowStock" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="stockouts" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No inventory risk data.
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>AI Summary</CardTitle>
              {kpiQuery.isFetching && <Spinner className="h-4 w-4" />}
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {kpiQuery.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : kpiQuery.data?.aiNarrative ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{kpiQuery.data.aiNarrative.overview}</div>
                    {kpiQuery.data.aiNarrative.severity && (
                      <span className="rounded-full bg-muted px-2 py-1 text-xs uppercase">
                        {kpiQuery.data.aiNarrative.severity}
                      </span>
                    )}
                  </div>
                  {kpiQuery.data.aiNarrative.highlights?.length ? (
                    <div>
                      <div className="text-xs font-semibold uppercase text-muted-foreground">
                        Highlights
                      </div>
                      <ul className="list-disc space-y-1 pl-4">
                        {kpiQuery.data.aiNarrative.highlights.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {kpiQuery.data.aiNarrative.risks?.length ? (
                    <div>
                      <div className="text-xs font-semibold uppercase text-muted-foreground">
                        Risks
                      </div>
                      <ul className="list-disc space-y-1 pl-4">
                        {kpiQuery.data.aiNarrative.risks.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="text-muted-foreground">No AI narrative available.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Latest Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <Skeleton className="h-6 w-3/4" />
              ) : insights.length ? (
                insights.map((insight) => (
                  <div key={insight.id} className="rounded border p-2 text-sm">
                    <div className="font-medium">{insight.summary ?? "Insight"}</div>
                    <div className="text-muted-foreground line-clamp-2">{insight.details}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No insights yet.</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Last Report</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-6 w-3/4" />
              ) : reports.length ? (
                <div className="text-sm">
                  <div className="font-medium">{reports[0].title}</div>
                  <div className="text-muted-foreground">{reports[0].scope ?? "N/A"}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No reports yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
}

function KpiCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {subtitle ? <div className="text-xs text-muted-foreground">{subtitle}</div> : null}
      </CardContent>
    </Card>
  );
}
