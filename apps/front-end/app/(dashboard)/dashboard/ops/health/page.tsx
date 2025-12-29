"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPlatformOpsHealth, listPlatformOpsErrors } from "@/lib/api/platform-ops";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const INFO =
  "Some queue metrics are stubbed until real worker telemetry is available in Phase 5. Errors are powered by the activity log.";

export default function PlatformHealthPage() {
  const { data, isLoading, refetch } = useQuery(["platform-ops", "health"], fetchPlatformOpsHealth);
  const errorsQuery = useQuery(
    ["platform-ops", "recent-errors"],
    () => listPlatformOpsErrors({ pageSize: 3 }),
    {
      enabled: Boolean(data),
    },
  );

  const queueStatus = useMemo(
    () =>
      data?.queues.map((queue) => ({
        ...queue,
        label: `${queue.name} (${queue.status})`,
      })),
    [data],
  );

  return (
    <PermissionGuard required="ops:health">
      <div className="space-y-6">
        <PageHeader
          title="Platform Health"
          description="API, database, and worker snapshot for MH-OS."
          meta={<InfoTooltip content={INFO} />}
          actions={
            <Button variant="outline" onClick={() => refetch()}>
              {isLoading ? <Spinner className="h-4 w-4" /> : "Refresh health"}
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">API status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold">{data?.api.status ?? "unknown"}</span>
                {data?.api.status === "ok" ? (
                  <Badge variant="secondary">Live</Badge>
                ) : (
                  <Badge variant="outline" className="border-destructive text-destructive">
                    Down
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Checked {data?.api.checkedAt ?? "--"}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{data?.db.status ?? "unknown"}</div>
              <p className="text-xs text-muted-foreground">
                Latency {data?.db.latencyMs.toFixed(0) ?? "--"} ms
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">
                Queue / workers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {queueStatus?.map((queue) => (
                <div
                  key={queue.name}
                  className="flex items-center justify-between rounded border px-3 py-2"
                >
                  <div>
                    <div className="font-semibold">{queue.label}</div>
                    <p className="text-xs text-muted-foreground">{queue.note}</p>
                  </div>
                  <Badge variant={queue.status === "OK" ? "outline" : "secondary"}>
                    {queue.status}
                  </Badge>
                </div>
              )) ?? <p className="text-xs text-muted-foreground">Queue data pending</p>}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">Recent incidents</CardTitle>
              <InfoTooltip content="Drawn from the activity log." />
            </div>
            <div className="text-xs text-muted-foreground">
              {errorsQuery.data ? `${errorsQuery.data.data.length} items` : "Loading..."}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {errorsQuery.isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Loading incidents...
              </div>
            )}
            {errorsQuery.error ? (
              <div className="text-sm text-destructive">Failed to load incidents.</div>
            ) : null}
            {errorsQuery.data?.data.length ? (
              errorsQuery.data.data.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-semibold">{incident.module ?? "core"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(incident.createdAt).toLocaleString()}
                    </div>
                    <div className="text-sm">{incident.message}</div>
                  </div>
                  <Badge variant="outline" className="text-[11px] uppercase">
                    {incident.severity ?? "info"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No incidents recorded.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
