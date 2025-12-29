"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
} from "@/lib/api/notifications";
import { apiErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/components/layout/page-header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { StatusBadge } from "@/components/ui/status-badge";
import { FiltersBar } from "@/components/ui/filters-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>();
  const [type, setType] = useState<string>();
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["notifications", { status, type }],
    queryFn: () => listNotifications({ status, type, pageSize: 50 }),
  });

  const markReadMutation = useMutation({
    mutationFn: (ids: string[]) => markNotificationsRead(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    const ids = data?.data?.map((n) => n.id) ?? [];
    if (selected.length === ids.length) {
      setSelected([]);
    } else {
      setSelected(ids);
    }
  };

  const summary = useMemo(() => {
    const total = data?.data?.length ?? 0;
    const unread = data?.data?.filter((n) => n.status !== "read").length ?? 0;
    const types = new Set(data?.data?.map((n) => n.type)).size;
    return { total, unread, types };
  }, [data]);

  return (
    <PermissionGuard required="notifications:read">
      <div className="space-y-6">
        <PageHeader
          title="Notification Center"
          description="Ops inbox for AI signals, pricing alerts, and automation outcomes."
          meta={
            <InfoTooltip content="Wired to in-app notifications. Extend with channels later." />
          }
          actions={
            <FiltersBar>
              <Input
                placeholder="Filter by type"
                value={type ?? ""}
                onChange={(e) => setType(e.target.value || undefined)}
                className="w-36"
              />
              <Input
                placeholder="Status (read/unread)"
                value={status ?? ""}
                onChange={(e) => setStatus(e.target.value || undefined)}
                className="w-40"
              />
              <Button
                variant="outline"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ["notifications", { status, type }] })
                }
              >
                Refresh
              </Button>
              <Button
                variant="secondary"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isLoading}
              >
                {markAllMutation.isLoading ? "Marking..." : "Mark all read"}
              </Button>
            </FiltersBar>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">
                Total notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.total}</div>
              <p className="text-xs text-muted-foreground">Filtered view</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Unread</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.unread}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Channels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.types}</div>
              <p className="text-xs text-muted-foreground">Notification types</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <InfoTooltip content="Select notifications to mark as read or rerun automations." />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Loading notifications...
              </div>
            ) : isError ? (
              <div className="text-sm text-destructive">Error: {apiErrorMessage(error)}</div>
            ) : data?.data && data.data.length === 0 ? (
              <EmptyState title="No notifications yet" description="You're all caught up." />
            ) : (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 bg-card">
                      <TableHead className="w-8">
                        <input
                          type="checkbox"
                          checked={
                            Boolean(data?.data?.length) &&
                            selected.length === (data?.data?.length ?? 0)
                          }
                          onChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.data ?? []).map((item: any) => (
                      <TableRow
                        key={item.id}
                        className={cn(item.status !== "read" && "bg-accent/40")}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selected.includes(item.id)}
                            onChange={() => toggle(item.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.message}</div>
                        </TableCell>
                        <TableCell className="text-xs uppercase text-muted-foreground">
                          {item.type ?? "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <StatusBadge tone={item.status === "read" ? "success" : "warning"}>
                            {item.status ?? "unread"}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.status !== "read" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markReadMutation.mutate([item.id])}
                              disabled={markReadMutation.isLoading}
                            >
                              Mark read
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          {selected.length > 0 && (
            <div className="mt-3 flex items-center gap-2 px-6 text-xs">
              <Button
                size="sm"
                variant="outline"
                onClick={() => markReadMutation.mutate(selected)}
                disabled={markReadMutation.isLoading}
              >
                Mark selected read
              </Button>
              <span className="text-muted-foreground">{selected.length} selected</span>
            </div>
          )}
        </Card>
      </div>
    </PermissionGuard>
  );
}
