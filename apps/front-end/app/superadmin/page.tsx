import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { SimpleTable } from "@/components/shell/simple-table";
import {
  aiExecutions,
  platformStatus,
  safetyEvents,
  tenantAnalytics,
  tenants,
} from "@/lib/superadmin/mock-data";
import { ModuleScaffold } from "@/components/shell/module-scaffold";
import { PageHeader } from "@/components/shell/page-header";

export default function SuperAdminOverviewPage() {
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === "active").length;
  const suspendedTenants = tenants.filter((t) => t.status === "suspended").length;
  const aiCallsPerDay = tenantAnalytics.reduce((sum, item) => sum + item.calls, 0);
  const highSafetyEvents = safetyEvents.filter((e) => e.severity === "high" || e.severity === "critical").length;

  const recentSafety = [...safetyEvents]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 5);
  const recentExecutions = [...aiExecutions].slice(0, 5);

  return (
    <ModuleScaffold
      header={{
        title: "Super Admin Overview",
        description: "Platform-wide control plane KPIs and AI governance signals (read-only)",
        breadcrumbs: [{ label: "Super Admin" }, { label: "Overview" }],
      }}
    >
      <PageHeader
        title="Mission Control"
        description="Snapshots for tenants, AI safety, and platform health"
        meta={<StatusBadge tone="info">Read-only</StatusBadge>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total tenants" value={totalTenants.toString()} meta="Across all plans" />
        <StatCard title="Active tenants" value={activeTenants.toString()} meta="Healthy" />
        <StatCard
          title="Suspended tenants"
          value={suspendedTenants.toString()}
          meta="Billing or compliance holds"
        />
        <StatCard
          title="AI calls per day"
          value={aiCallsPerDay.toString()}
          meta="Aggregated across tenants"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent AI safety incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleTable
              columns={["Severity", "Agent", "Rule", "Tenant", "Occurred", "Status"]}
              rows={recentSafety.map((event) => [
                <StatusBadge key={event.id} tone={event.severity === "critical" ? "danger" : event.severity === "high" ? "warning" : "info"}>
                  {event.severity}
                </StatusBadge>,
                event.agent,
                event.rule,
                event.tenant,
                new Date(event.occurredAt).toLocaleString(),
                <StatusBadge key={`${event.id}-status`} tone={event.status === "blocked" ? "success" : event.status === "fallback" ? "warning" : "default"}>
                  {event.status}
                </StatusBadge>,
              ])}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Platform status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>API uptime</span>
              <StatusBadge tone="success">{platformStatus.apiUptime}</StatusBadge>
            </div>
            <div className="flex items-center justify-between">
              <span>Database</span>
              <StatusBadge tone={platformStatus.dbStatus === "online" ? "success" : "warning"}>
                {platformStatus.dbStatus}
              </StatusBadge>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Queues</p>
              <div className="space-y-1">
                {platformStatus.queues.map((queue) => (
                  <div key={queue.name} className="flex items-center justify-between rounded border border-border/50 bg-card/50 px-2 py-1">
                    <span>{queue.name}</span>
                    <StatusBadge tone={queue.status === "running" ? "success" : "warning"}>
                      {queue.status}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Jobs</p>
              <div className="space-y-1">
                {platformStatus.jobs.map((job) => (
                  <div key={job.name} className="rounded border border-border/50 bg-card/50 px-2 py-1">
                    <div className="flex items-center justify-between">
                      <span>{job.name}</span>
                      <StatusBadge tone={job.status === "healthy" ? "success" : "warning"}>
                        {job.status}
                      </StatusBadge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Last: {job.lastRunAt ?? "-"} • Next: {job.nextRunAt ?? "-"}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent AI execution logs</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleTable
              columns={["Run", "Agent", "Model", "Tokens", "Cost", "Duration", "Status"]}
              rows={recentExecutions.map((run) => [
                run.runId,
                run.agent,
                run.model,
                run.tokens,
                `$${run.costUsd.toFixed(2)}`,
                `${run.durationMs} ms`,
                <StatusBadge key={`${run.runId}-status`} tone={run.status === "success" ? "success" : run.status === "fallback" ? "warning" : "danger"}>
                  {run.status}
                </StatusBadge>,
              ])}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Safety events summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>High/Critical events</span>
              <StatusBadge tone={highSafetyEvents ? "warning" : "success"}>{highSafetyEvents}</StatusBadge>
            </div>
            <div className="flex items-center justify-between">
              <span>Last event</span>
              <span className="text-muted-foreground">
                {recentSafety[0] ? new Date(recentSafety[0].occurredAt).toLocaleString() : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Guardrails engaged</span>
              <StatusBadge tone="info">Firewall, Fallbacks</StatusBadge>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleScaffold>
  );
}
