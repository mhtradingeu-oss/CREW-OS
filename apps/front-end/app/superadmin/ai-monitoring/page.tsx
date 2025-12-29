"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ModuleScaffold } from "@/components/shell/module-scaffold";
import { PageHeader } from "@/components/shell/page-header";
import { TableWithToolbar } from "@/components/shell/table-with-toolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { aiExecutions, tenantAnalytics } from "@/lib/superadmin/mock-data";
import type { AiExecution, ErrorRecord, FallbackRecord } from "@/lib/superadmin/mock-data";
import { useAiMonitoringData } from "../../../lib/superadmin/use-ai-monitoring";

export default function SuperAdminAiMonitoringPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "fallback" | "error">("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const { executions, fallbacks, errors, totalExecutions } = useAiMonitoringData({
    status: statusFilter === "all" ? undefined : statusFilter,
    tenant: tenantFilter === "all" ? undefined : tenantFilter,
    page,
    pageSize,
  });

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalExecutions / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [page, pageSize, totalExecutions]);

  const totalCost = useMemo(() => aiExecutions.reduce((sum, run) => sum + run.costUsd, 0), []);
  const totalCalls = useMemo(() => tenantAnalytics.reduce((sum, item) => sum + item.calls, 0), []);
  const avgLatency = useMemo(
    () => Math.round(tenantAnalytics.reduce((sum, item) => sum + item.avgLatencyMs, 0) / tenantAnalytics.length),
    [],
  );

  const successRate = useMemo(() => {
    if (!aiExecutions.length) return 0;
    const successes = aiExecutions.filter((run) => run.status === "success").length;
    return Math.round((successes / aiExecutions.length) * 100);
  }, []);

  const topAgent = useMemo(() => {
    const counts: Record<string, number> = {};
    aiExecutions.forEach((run) => {
      counts[run.agent] = (counts[run.agent] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  }, []);

  const topModel = useMemo(() => {
    const counts: Record<string, number> = {};
    aiExecutions.forEach((run) => {
      counts[run.model] = (counts[run.model] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  }, []);

  const tenantOptions = useMemo(() => {
    const ids = new Set<string>();
    aiExecutions.forEach((run) => ids.add(run.tenant));
    return Array.from(ids);
  }, []);

  const callsPerDay = useMemo(
    () =>
      aiExecutions.map((run, idx) => ({
        day: `Day ${idx + 1}`,
        calls: Math.max(8, Math.round(run.tokens / 800)),
        latency: run.durationMs,
      })),
    [],
  );

  const costTrend = useMemo(
    () => tenantAnalytics.map((t) => ({ tenant: t.tenant, cost: t.costUsd, calls: t.calls })),
    [],
  );

  const contextLabel = tenantFilter === "all" ? "all tenants" : tenantFilter;

  return (
    <ModuleScaffold
      header={{
        title: "AI Monitoring",
        description: "Read-only visibility into executions, fallbacks, errors, and costs",
        breadcrumbs: [{ label: "Super Admin" }, { label: "AI Monitoring" }],
      }}
    >
      <PageHeader
        title="AI Monitoring"
        description="Execution logs, fallbacks, errors, and analytics placeholders"
        meta={<StatusBadge tone="info">Read-only</StatusBadge>}
      />

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
        <StatCard title="Executions (24h)" value={aiExecutions.length.toString()} meta="Latest sample window" />
        <StatCard title="Success rate" value={`${successRate}%`} meta="Across all runs" />
        <StatCard title="Total cost" value={`$${totalCost.toFixed(2)}`} meta="Across executions shown" />
        <StatCard title="Avg latency" value={`${avgLatency} ms`} meta="Per tenant average" />
        <StatCard title="Top agent" value={topAgent} meta={`Top model: ${topModel}`} />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="fallback">Fallback</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="tenant-filter">Tenant</label>
            <select
              id="tenant-filter"
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="all">All tenants</option>
              {tenantOptions.map((tenant) => (
                <option key={tenant} value={tenant}>
                  {tenant}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Results</label>
            <div className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
              {totalExecutions} runs · page {page} of {Math.max(1, Math.ceil(totalExecutions / pageSize))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Calls per day</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={callsPerDay} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calls" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="latency" stroke="#14b8a6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Cost trend</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costTrend} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="tenant" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="cost" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="calls" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <TableWithToolbar
        title="Executions"
        description={`Run-level visibility (${contextLabel})`}
        columns={["Run", "Agent", "Model", "Tokens", "Cost", "Duration", "Status", "Tenant"]}
        rows={executions.map((run: AiExecution) => [
          run.runId,
          run.agent,
          run.model,
          run.tokens,
          `$${run.costUsd.toFixed(2)}`,
          `${run.durationMs} ms`,
          <StatusBadge key={`${run.runId}-status`} tone={run.status === "success" ? "success" : run.status === "fallback" ? "warning" : "danger"}>
            {run.status}
          </StatusBadge>,
          run.tenant,
        ])}
        filters={
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setPage(1);
              }}
              className="h-10 rounded-md border border-border bg-background px-2 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="success">Success</option>
              <option value="fallback">Fallback</option>
              <option value="error">Error</option>
            </select>
            <select
              value={tenantFilter}
              onChange={(e) => {
                setTenantFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-border bg-background px-2 text-sm"
            >
              <option value="all">All tenants</option>
              {tenantOptions.map((tenant) => (
                <option key={tenant} value={tenant}>
                  {tenant}
                </option>
              ))}
            </select>
          </div>
        }
        actions={<StatusBadge tone="info">Page {page}</StatusBadge>}
        bulkActions={
          <div className="flex items-center gap-2 text-sm">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * pageSize >= totalExecutions}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <TableWithToolbar
          title="Fallbacks"
          description="Safety or strategy downgrades"
          columns={["Run", "Agent", "Reason", "Strategy", "Tenant"]}
          rows={fallbacks.map((fb: FallbackRecord) => [fb.runId, fb.agent, fb.reason, fb.strategy, fb.tenant])}
          searchPlaceholder="Search fallbacks"
        />
        <TableWithToolbar
          title="Errors"
          description="Model or pipeline failures"
          columns={["Agent", "Message", "Tenant", "When"]}
          rows={errors.map((err: ErrorRecord) => [
            err.agent,
            err.message,
            err.tenant,
            new Date(err.occurredAt).toLocaleString(),
          ])}
          searchPlaceholder="Search errors"
        />
      </div>

      <TableWithToolbar
        title="Per-tenant analytics"
        description="Call volume, cost, and latency"
        columns={["Tenant", "Calls", "Cost", "Avg latency"]}
        rows={tenantAnalytics.map((row) => [
          row.tenant,
          row.calls,
          `$${row.costUsd.toFixed(2)}`,
          `${row.avgLatencyMs} ms`,
        ])}
        searchPlaceholder="Search tenants"
      />
    </ModuleScaffold>
  );
}
