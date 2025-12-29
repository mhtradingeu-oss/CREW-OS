"use client";

import { notFound } from "next/navigation";
import { ModuleScaffold } from "@/components/shell/module-scaffold";
import { PageHeader } from "@/components/shell/page-header";
import { Tabs } from "@/components/shell/tabs";
import { SimpleTable } from "@/components/shell/simple-table";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  tenantActivity,
  tenantFeatureFlags,
  tenantPlanHistory,
  tenantUsers,
  tenants,
} from "@/lib/superadmin/mock-data";

type PageProps = {
  params: { tenantId: string };
};

export default function TenantDetailPage({ params }: PageProps) {
  const tenant = tenants.find((t) => t.id === params.tenantId);

  if (!tenant) return notFound();

  const planHistory = tenantPlanHistory[tenant.id] ?? [];
  const flags = tenantFeatureFlags[tenant.id];
  const users = tenantUsers[tenant.id] ?? [];

  const activityList = tenantActivity[tenant.id] ?? [];
  const activityGroups: Record<string, typeof activityList> = {};
  activityList.forEach((item) => {
    const day = new Date(item.at).toDateString();
    if (!activityGroups[day]) activityGroups[day] = [];
    activityGroups[day].push(item);
  });
  const activityTimeline = Object.entries(activityGroups).map(([day, events]) => ({
    day,
    events: events.map((ev) => ({
      id: ev.id,
      title: ev.title,
      subtitle: ev.meta,
      at: new Date(ev.at),
    })),
  }));

  return (
    <ModuleScaffold
      header={{
        title: tenant.name,
        description: "Read-only tenant record",
        breadcrumbs: [
          { label: "Super Admin", href: "/superadmin" },
          { label: "Tenants", href: "/superadmin/tenants" },
          { label: tenant.name },
        ],
        meta: <StatusBadge tone={tenant.status === "active" ? "success" : tenant.status === "trial" ? "info" : "warning"}>{tenant.status}</StatusBadge>,
      }}
    >
      <PageHeader
        title="Tenant Detail"
        description="Overview, plan history, feature flags, users, and activity"
        meta={<StatusBadge tone="info">Read-only</StatusBadge>}
        actions={<Button variant="outline" size="sm">Refresh</Button>}
      />

      <Tabs
        tabs={[
          {
            value: "overview",
            label: "Overview",
            content: (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">Domains:</span>
                    <span className="text-muted-foreground">{tenant.domains.join(", ")}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">Plan:</span>
                    <StatusBadge tone="info">{tenant.plan}</StatusBadge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">Created:</span>
                    <span className="text-muted-foreground">{new Date(tenant.createdAt).toLocaleDateString()}</span>
                  </div>
                  {tenant.brandPrimary ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Brand color:</span>
                      <span className="h-4 w-4 rounded" style={{ background: tenant.brandPrimary }} />
                      <span className="text-muted-foreground">{tenant.brandPrimary}</span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ),
          },
          {
            value: "plan",
            label: "Plan History",
            content: (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Plan history</CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleTable
                    columns={["Plan", "Changed", "Reason"]}
                    rows={planHistory.map((entry) => [
                      entry.plan,
                      new Date(entry.changedAt).toLocaleString(),
                      entry.reason,
                    ])}
                  />
                </CardContent>
              </Card>
            ),
          },
          {
            value: "flags",
            label: "Feature Flags",
            content: flags ? (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Feature flags (read-only)</CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleTable
                    columns={["Feature", "Enabled"]}
                    rows={Object.entries(flags).map(([key, value]) => [
                      key,
                      <StatusBadge key={key} tone={value ? "success" : "danger"}>{value ? "on" : "off"}</StatusBadge>,
                    ])}
                  />
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">No flags found.</p>
            ),
          },
          {
            value: "users",
            label: "Users",
            content: (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleTable
                    columns={["Name", "Email", "Role", "Status"]}
                    rows={users.map((user) => [
                      user.name,
                      user.email,
                      user.role,
                      <StatusBadge key={user.id} tone={user.status === "active" ? "success" : "warning"}>
                        {user.status}
                      </StatusBadge>,
                    ])}
                  />
                </CardContent>
              </Card>
            ),
          },
          {
            value: "activity",
            label: "Activity",
            content: (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {activityTimeline.length ? (
                    <ActivityTimeline items={activityTimeline} />
                  ) : (
                    <p className="text-sm text-muted-foreground">No activity recorded.</p>
                  )}
                </CardContent>
              </Card>
            ),
          },
        ]}
        defaultValue="overview"
      />
    </ModuleScaffold>
  );
}
