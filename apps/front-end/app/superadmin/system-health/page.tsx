import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { platformStatus } from "@/lib/superadmin/mock-data";

export default function SuperAdminSystemHealthPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">System Health</h1>
        <p className="text-sm text-muted-foreground">High-level health signals for the platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold">API uptime</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{platformStatus.apiUptime}</CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge tone={platformStatus.dbStatus === "online" ? "success" : "warning"}>
              {platformStatus.dbStatus}
            </StatusBadge>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold">Queues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {platformStatus.queues.map((queue) => (
              <div key={queue.name} className="flex items-center justify-between text-sm">
                <span>{queue.name}</span>
                <StatusBadge tone={queue.status === "running" ? "success" : "warning"}>
                  {queue.status}
                </StatusBadge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Background jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {platformStatus.jobs.map((job) => (
            <div key={job.name} className="rounded border border-border/60 bg-card/60 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{job.name}</span>
                <StatusBadge tone={job.status === "healthy" ? "success" : "warning"}>{job.status}</StatusBadge>
              </div>
              <p className="text-xs text-muted-foreground">Last: {job.lastRunAt ?? "-"}</p>
              <p className="text-xs text-muted-foreground">Next: {job.nextRunAt ?? "-"}</p>
            </div>
          ))}
          {!platformStatus.jobs.length && (
            <p className="text-muted-foreground">No jobs reported.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">DB status (placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            Future: connect to backend health endpoint.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
