"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPlatformOpsJobs } from "@/lib/api/platform-ops";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function PlatformBackupsPage() {
  const { data, isLoading, isError, refetch } = useQuery(
    ["platform-ops", "jobs"],
    () => fetchPlatformOpsJobs(),
    {
      refetchOnWindowFocus: false,
    },
  );

  return (
    <PermissionGuard required="ops:jobs">
      <div className="space-y-6">
        <PageHeader
          title="Backups & Jobs"
          description="High-level view of scheduled jobs and platform snapshots."
          meta={
            <InfoTooltip content="Job data pulled from the scheduled_jobs table; some entries may be placeholder." />
          }
          actions={
            <Button variant="outline" onClick={() => refetch()}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Last backup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {data?.lastBackupAt ? new Date(data.lastBackupAt).toLocaleString() : "—"}
              </div>
              <p className="text-xs text-muted-foreground">Snapshot timestamp</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{data?.policy ?? "Scheduled jobs"}</div>
              <p className="text-xs text-muted-foreground">Daily backups + automations</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Next window</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {data?.upcomingWindow ? new Date(data.upcomingWindow).toLocaleTimeString() : "—"}
              </div>
              <p className="text-xs text-muted-foreground">Earliest scheduled run</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Job history</CardTitle>
              <InfoTooltip content="Jobs order by last run time; actual backup payloads will live in Phase 5." />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Loading jobs...
              </div>
            ) : isError ? (
              <div className="text-sm text-destructive">Failed to load job history.</div>
            ) : data?.jobs.length ? (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last run</TableHead>
                      <TableHead>Next run</TableHead>
                      <TableHead className="text-right">Cron</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-semibold">{job.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              job.status === "failed" ? "border-destructive text-destructive" : ""
                            }
                          >
                            {job.status ?? "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {job.nextRunAt ? new Date(job.nextRunAt).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {job.cronExpression ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState
                title="No jobs yet"
                description="Scheduled jobs will appear here once configured."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
