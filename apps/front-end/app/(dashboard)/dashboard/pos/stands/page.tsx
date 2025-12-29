"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useStandsList } from "@/lib/hooks/use-stand-pos";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { FiltersBar } from "@/components/ui/filters-bar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { Store } from "lucide-react";

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

export default function StandListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { hasPermission } = useAuth();
  const { data, isLoading, isError, error, refetch } = useStandsList({ page: 1, pageSize: 50 });

  const stands = useMemo(() => {
    const list = data?.data ?? [];
    if (!search && !statusFilter) return list;
    return list.filter((stand) => {
      const matchesSearch =
        search === "" ||
        stand.name.toLowerCase().includes(search.toLowerCase()) ||
        stand.partner?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || stand.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  const totalStands = data?.total ?? 0;
  const activeStands = useMemo(
    () => (data?.data ?? []).filter((stand) => stand.status === "ACTIVE").length,
    [data],
  );

  return (
    <PermissionGuard required="pos:read">
      <div className="space-y-6">
        <PageHeader
          title="Stand / POS Network"
          description="Track partner stands, refill cadence, and performance for the brand."
          meta={
            <InfoTooltip content="Stands represent physical partner locations where MH-OS products are sold or refilled." />
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Total stands
                <InfoTooltip content="Live count of stands synced with MH-OS" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalStands}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Active stands
                <InfoTooltip content="Stands flagged as ACTIVE in RBAC" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{activeStands}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Avg. daily sales
                <InfoTooltip content="Coming soon: KPI series will surface average daily sales per stand." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">—</p>
            </CardContent>
          </Card>
        </div>

        <FiltersBar>
          <Input
            className="w-64"
            placeholder="Search by name or partner"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select disabled value="">
            {" "}
            {/* placeholder for future city/country filters */}
            <option>City / Country filters coming soon</option>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </FiltersBar>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            Loading stands...
          </div>
        ) : isError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load stands: {error instanceof Error ? error.message : "Unknown error"}
            <div className="mt-2">
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </div>
        ) : stands.length === 0 ? (
          <EmptyState
            title="No stands yet"
            description="Start by creating a stand partner or onboarding a new location."
            icon={<Store className="h-10 w-10 text-muted-foreground" />}
            action={
              hasPermission("pos:manage") ? (
                <Button onClick={() => toast("Stand creation flow coming soon.")}>
                  Create first stand
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stand</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Locations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last refill</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stands.map((stand) => (
                  <TableRow key={stand.id}>
                    <TableCell>
                      <div className="font-semibold">{stand.name}</div>
                      <p className="text-xs text-muted-foreground">ID: {stand.id}</p>
                    </TableCell>
                    <TableCell>{stand.partner?.name ?? "–"}</TableCell>
                    <TableCell>{stand.locationCount}</TableCell>
                    <TableCell>
                      <StatusBadge tone={stand.status === "ACTIVE" ? "success" : "warning"}>
                        {stand.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      {stand.lastRefillAt ? new Date(stand.lastRefillAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Link
                        className="text-primary text-sm"
                        href={`/dashboard/pos/stands/${stand.id}`}
                      >
                        View details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
