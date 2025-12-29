"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGuard } from "@/components/layout/permission-guard";
import { FiltersBar } from "@/components/ui/filters-bar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useSalesRepsList } from "@/lib/hooks/use-sales-reps";
import { useAuth } from "@/lib/auth/auth-context";
import { Building2 } from "lucide-react";

const statusFilterOptions = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

export default function SalesRepsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { hasPermission } = useAuth();
  const { data, isLoading, isError, error, refetch } = useSalesRepsList({ page: 1, pageSize: 50 });

  const reps = useMemo(() => {
    const list = data?.data ?? [];
    if (!search && !status) return list;
    return list.filter((rep: any) => {
      const matchesSearch =
        search === "" ||
        rep.code?.toLowerCase().includes(search.toLowerCase()) ||
        rep.region?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !status || rep.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, status]);

  const territoryCount = useMemo(
    () => (data?.data ?? []).reduce((total: number, rep: any) => total + rep.territoryCount, 0),
    [data],
  );

  return (
    <PermissionGuard required="sales-rep:read">
      <div className="space-y-6">
        <PageHeader
          title="Sales Reps"
          description="Field sales engine for salons, pharmacies, and retail partners."
          meta={
            <InfoTooltip content="Manage territories, visits, and pipeline for each sales rep." />
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Active reps
                <InfoTooltip content="Number of reps surfaced in this workspace." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{data?.total ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Territories
                <InfoTooltip content="Total territories assigned across active reps." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{territoryCount}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Open leads
                <InfoTooltip content="Lead totals will surface once pipeline API is enabled." />
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
            placeholder="Search by rep code or region"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            {statusFilterOptions.map((option: typeof statusFilterOptions[number]) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </FiltersBar>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            Loading reps...
          </div>
        ) : isError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load reps: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        ) : reps.length === 0 ? (
          <EmptyState
            title="No sales reps yet"
            description="Seed reps through the backend or wait for onboarding data."
            icon={<Building2 className="h-10 w-10 text-muted-foreground" />}
            action={hasPermission("sales-rep:manage") ? <Button>Create rep</Button> : undefined}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / Code</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Territories</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reps.map((rep: any) => (
                  <TableRow key={rep.id}>
                    <TableCell>
                      <div className="font-semibold">{rep.code ?? "–"}</div>
                      <p className="text-xs text-muted-foreground">Brand: {rep.brandId ?? "N/A"}</p>
                    </TableCell>
                    <TableCell>{rep.region ?? "—"}</TableCell>
                    <TableCell>{rep.territoryCount}</TableCell>
                    <TableCell>
                      <StatusBadge tone={rep.status === "ACTIVE" ? "success" : "warning"}>
                        {rep.status ?? "Unknown"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        className="text-primary text-sm"
                        href={`/dashboard/sales-reps/${rep.id}`}
                      >
                        Open profile
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
