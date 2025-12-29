"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listPlatformOpsAudit, PlatformOpsAuditRecord } from "@/lib/api/platform-ops";
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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const initialFilters = { module: "", userId: "", severity: "", from: "", to: "" };

export default function PlatformAuditPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [selected, setSelected] = useState<PlatformOpsAuditRecord | null>(null);

  const { data, isLoading, isError, refetch } = useQuery(
    [
      "platform-ops",
      "audit",
      filters.module,
      filters.userId,
      filters.severity,
      filters.from,
      filters.to,
    ],
    () =>
      listPlatformOpsAudit({
        module: filters.module || undefined,
        userId: filters.userId || undefined,
        severity: filters.severity || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page: 1,
        pageSize: 20,
      }),
  );

  const summary = useMemo(() => {
    const entries = data?.data ?? [];
    const modules = new Set(entries.map((entry) => entry.module ?? "core")).size;
    const users = new Set(entries.map((entry) => entry.userId ?? "system")).size;
    return {
      total: data?.total ?? 0,
      modules,
      users,
    };
  }, [data]);

  return (
    <PermissionGuard required="ops:audit">
      <div className="space-y-6">
        <PageHeader
          title="Audit Trails"
          description="Track RBAC updates, automation signals, and AI actions with filters."
          meta={
            <InfoTooltip content="Results come from the activity log; meta payloads include context." />
          }
          actions={
            <button
              className="text-sm font-medium text-primary underline"
              onClick={() => refetch()}
            >
              Refresh
            </button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.total}</div>
              <p className="text-xs text-muted-foreground">Most recent 20 records</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.modules}</div>
              <p className="text-xs text-muted-foreground">Unique contexts</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.users}</div>
              <p className="text-xs text-muted-foreground">Actors surfaced</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold">Filters</CardTitle>
                <InfoTooltip content="Module, actor, severity, and date range for audit drill-down." />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Module"
                value={filters.module}
                onChange={(e) => setFilters((prev) => ({ ...prev, module: e.target.value }))}
                className="w-40"
              />
              <Input
                placeholder="User ID"
                value={filters.userId}
                onChange={(e) => setFilters((prev) => ({ ...prev, userId: e.target.value }))}
                className="w-40"
              />
              <Input
                placeholder="Severity"
                value={filters.severity}
                onChange={(e) => setFilters((prev) => ({ ...prev, severity: e.target.value }))}
                className="w-32"
              />
              <Input
                placeholder="From"
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
              />
              <Input
                placeholder="To"
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
              />
              <button
                className="text-sm text-muted-foreground underline"
                onClick={() => setFilters(initialFilters)}
              >
                Reset
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Loading audit trails...
              </div>
            ) : isError ? (
              <div className="text-sm text-destructive">Failed to load audit data.</div>
            ) : data?.data.length === 0 ? (
              <EmptyState
                title="No audit records"
                description="Introduce activity to see entries."
              />
            ) : (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {entry.userId ?? "system"}
                        </TableCell>
                        <TableCell className="text-sm">{entry.module ?? "core"}</TableCell>
                        <TableCell className="text-sm">{entry.type}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline">{entry.severity ?? "info"}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            className={cn(
                              "text-xs font-semibold text-primary underline-offset-2 hover:underline",
                              selected?.id === entry.id && "text-primary-foreground",
                            )}
                            onClick={() => setSelected(entry)}
                          >
                            View
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {selected && (
              <Card className="rounded-lg border">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Payload</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                    {JSON.stringify(selected.meta ?? { message: "No payload" }, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
