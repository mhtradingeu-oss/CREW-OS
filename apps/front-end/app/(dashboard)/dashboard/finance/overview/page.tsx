"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listFinance } from "@/lib/api/finance";
import { apiErrorMessage } from "@/lib/api/client";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function FinanceOverviewPage() {
  const [filter, setFilter] = useState("");
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["finance", filter],
    queryFn: () => listFinance({ pageSize: 50 }),
  });

  const filtered = useMemo(() => {
    if (!data?.data) return [];
    if (!filter.trim()) return data.data;
    return data.data.filter((record) =>
      (record.productId ?? "").toLowerCase().includes(filter.toLowerCase()),
    );
  }, [data?.data, filter]);

  const summary = useMemo(() => {
    const total = filtered.reduce((sum, record) => sum + (record.amount ?? 0), 0);
    const count = filtered.length;
    const currency = filtered[0]?.currency ?? "EUR";
    return { total, count, currency };
  }, [filtered]);

  const chartData = useMemo(() => {
    const buckets: Record<string, number> = {};
    filtered.forEach((record) => {
      const key = record.periodStart
        ? new Date(record.periodStart).toLocaleDateString()
        : "Unknown";
      buckets[key] = (buckets[key] ?? 0) + (record.amount ?? 0);
    });
    return Object.entries(buckets).map(([label, value]) => ({ label, value }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Overview"
        description="Track revenue, channels, and cash signals for HAIROTICMEN and other brands."
        meta={
          <InfoTooltip content="Data comes from revenue records; extend with KPIs once available." />
        }
        actions={
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filter by product"
              className="w-56"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Total revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {summary.currency} {summary.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From {summary.count} records</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.count}</div>
            <p className="text-xs text-muted-foreground">Grouped by product/channel</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.currency}</div>
            <p className="text-xs text-muted-foreground">Primary ledger currency</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Revenue trend</h2>
            <InfoTooltip content="Line chart grouped by period start." />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-60">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No revenue data yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Records</h2>
            <InfoTooltip content="Detailed revenue records for reconciliation." />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Loading finance records...
            </div>
          ) : isError ? (
            <div className="text-sm text-destructive">Error: {apiErrorMessage(error)}</div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-xs">{record.brandId ?? "—"}</TableCell>
                      <TableCell className="text-xs">{record.productId ?? "—"}</TableCell>
                      <TableCell className="text-xs">{record.channel ?? "—"}</TableCell>
                      <TableCell className="font-semibold">
                        {record.amount ?? 0} {record.currency ?? ""}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {record.periodStart
                          ? new Date(record.periodStart).toLocaleDateString()
                          : "—"}{" "}
                        -{record.periodEnd ? new Date(record.periodEnd).toLocaleDateString() : "—"}
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
