"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listPlatformOpsErrors } from "@/lib/api/platform-ops";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

const initialFilters = { module: "", severity: "", from: "", to: "" };

export default function PlatformErrorsPage() {
  const [filters, setFilters] = useState(initialFilters);

  const { data, isLoading, isError, refetch } = useQuery(
    ["platform-ops", "errors", filters.module, filters.severity, filters.from, filters.to],
    () =>
      listPlatformOpsErrors({
        module: filters.module || undefined,
        severity: filters.severity || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page: 1,
        pageSize: 20,
      }),
  );

  const summary = useMemo(() => {
    const list = data?.data ?? [];
    const critical = list.filter((item) => item.severity === "critical").length;
    const modules = new Set(list.map((item) => item.module ?? "core")).size;
    return {
      total: data?.total ?? 0,
      critical,
      modules,
    };
  }, [data]);

  return (
    <PermissionGuard required="ops:errors">
      <div className="space-y-6">
        <PageHeader
          title="Error Center"
          description="Surface issues detected via the activity log. Filter by severity, module, or timeframe."
          meta={
            <InfoTooltip content="Errors are mapped from activity entries; severity values are not always set." />
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
              <CardTitle className="text-xs uppercase text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.total}</div>
              <p className="text-xs text-muted-foreground">Last 20 entries</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.critical}</div>
              <p className="text-xs text-muted-foreground">Severity flag</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.modules}</div>
              <p className="text-xs text-muted-foreground">Unique module contexts</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold">Filters</CardTitle>
                <InfoTooltip content="Module, severity, and date range for targeted troubleshooting." />
              </div>
              <p className="text-xs text-muted-foreground">Leave blank for all records.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Module"
                value={filters.module}
                onChange={(e) => setFilters((prev) => ({ ...prev, module: e.target.value }))}
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
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Loading errors...
              </div>
            ) : isError ? (
              <div className="text-sm text-destructive">Failed to load errors.</div>
            ) : data?.data && data.data.length === 0 ? (
              <EmptyState title="No errors" description="Checks are clean." />
            ) : (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.map((error) => (
                      <TableRow key={error.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(error.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">{error.module ?? "core"}</TableCell>
                        <TableCell className="text-xs uppercase">
                          <Badge variant="outline">{error.severity ?? "info"}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{error.message}</TableCell>
                        <TableCell className="text-right">
                          <button
                            className={cn(
                              "text-xs font-medium text-primary underline-offset-2 hover:underline",
                            )}
                            onClick={() =>
                              navigator.clipboard.writeText(
                                JSON.stringify(error.meta ?? {}, null, 2),
                              )
                            }
                          >
                            Copy payload
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
