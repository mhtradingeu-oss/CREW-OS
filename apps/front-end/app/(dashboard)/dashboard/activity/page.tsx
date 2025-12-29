"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listActivity } from "@/lib/api/activity";
import { apiErrorMessage } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { EmptyState } from "@/components/ui/empty-state";
import { Activity as ActivityIcon } from "lucide-react";
import { ActivityTimeline, type TimelineItem } from "@/components/ui/activity-timeline";

export default function ActivityPage() {
  const [filters, setFilters] = useState<{ brandId?: string; module?: string }>({});
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["activity", filters],
    queryFn: () => listActivity({ ...filters, pageSize: 50 }),
  });
  const grouped = useMemo(() => {
    const buckets: Record<string, TimelineItem[]> = {};
    (data?.data ?? []).forEach((item) => {
      const at = new Date(item.createdAt);
      const key = at.toDateString();
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push({
        id: item.id,
        title: item.module ?? "general",
        subtitle: item.type,
        meta: `Brand: ${item.brandId ?? "—"} • Actor: ${item.userId ?? "system"} • Source: ${item.source ?? "api"}`,
        at,
      });
    });
    return Object.entries(buckets).map(([day, events]) => ({ day, events }));
  }, [data]);

  const stats = useMemo(() => {
    const total = data?.data?.length ?? 0;
    const modules = new Set(data?.data?.map((item) => item.module)).size;
    const brands = new Set(data?.data?.map((item) => item.brandId)).size;
    return { total, modules, brands };
  }, [data]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Activity Log"
        description="Trace every significant action across brands, pricing, CRM, and automations."
        meta={
          <InfoTooltip content="Logged via the event hub. Extend filters as new modules come online." />
        }
        actions={
          <>
            <Input
              placeholder="Filter by brandId"
              className="w-44"
              value={filters.brandId ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, brandId: e.target.value || undefined }))
              }
            />
            <Input
              placeholder="Module (pricing, crm...)"
              className="w-48"
              value={filters.module ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, module: e.target.value || undefined }))
              }
            />
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Last 50 rows</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.modules}</div>
            <p className="text-xs text-muted-foreground">Source contexts</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.brands}</div>
            <p className="text-xs text-muted-foreground">Tenants surfaced</p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            Loading activity...
          </div>
        )}
        {isError && <div className="text-sm text-destructive">Error: {apiErrorMessage(error)}</div>}
        {!isLoading && data && grouped.length === 0 && (
          <EmptyState
            title="No activity yet"
            description="Events will show here as the system runs."
            icon={<ActivityIcon className="h-5 w-5" />}
          />
        )}
        {!isLoading && data && grouped.length > 0 && <ActivityTimeline items={grouped} />}
      </Card>
    </div>
  );
}
