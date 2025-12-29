"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAutomations, runAutomation } from "@/lib/api/automations";
import { apiErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/components/layout/page-header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { EmptyState } from "@/components/ui/empty-state";
import { Workflow } from "lucide-react";

export default function AutomationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["automations"],
    queryFn: () => listAutomations({ pageSize: 50 }),
  });

  const activeCount = useMemo(
    () => data?.data?.filter((rule) => rule.isActive).length ?? 0,
    [data],
  );
  const triggerTypes = useMemo(
    () => new Set(data?.data?.map((rule) => rule.triggerType)).size,
    [data],
  );

  const stats = useMemo(
    () => ({
      total: data?.data?.length ?? 0,
      active: activeCount,
      triggers: triggerTypes,
    }),
    [data, activeCount, triggerTypes],
  );

  const runMutation = useMutation({
    mutationFn: (id: string) => runAutomation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automations"] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automation Rules"
        description="Trigger notifications, AI insights, and workflows from events or schedules."
        meta={
          <InfoTooltip content="Backed by the automation engine, plus notifications and AI outputs." />
        }
        actions={
          <Link href="/dashboard/automations/create">
            <Button>Create automation</Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Loaded from automation service</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Enabled and listening</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Triggers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.triggers}</div>
            <p className="text-xs text-muted-foreground">Unique trigger types</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Automation directory</h2>
            <InfoTooltip content="Run history, triggers, and quick rerun actions." />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Loading automations...
            </div>
          ) : isError ? (
            <div className="text-sm text-destructive">Error: {apiErrorMessage(error)}</div>
          ) : data && data.data.length === 0 ? (
            <EmptyState
              title="No automations yet"
              description="Create your first rule to react to events or schedules."
              icon={<Workflow className="h-5 w-5" />}
            />
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last run</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.data ?? []).map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/automations/${rule.id}`}
                          className="font-semibold hover:underline"
                        >
                          {rule.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {rule.description ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs uppercase">
                        {rule.triggerType}
                        {rule.triggerEvent ? ` (${rule.triggerEvent})` : ""}
                      </TableCell>
                      <TableCell className="text-xs">
                        {rule.isActive ? "Active" : "Disabled"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {rule.lastRunAt ? new Date(rule.lastRunAt).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runMutation.mutate(rule.id)}
                          disabled={runMutation.isLoading}
                        >
                          Run now
                        </Button>
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
  );
}
