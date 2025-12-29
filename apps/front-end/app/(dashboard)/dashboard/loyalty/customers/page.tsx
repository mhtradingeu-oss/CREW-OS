"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listLoyaltyCustomers, updateLoyaltyCustomer } from "@/lib/api/loyalty";
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
import { Badge } from "@/components/ui/badge";

export default function LoyaltyCustomersPage() {
  const queryClient = useQueryClient();
  const [programId, setProgramId] = useState<string>("");
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["loyalty-customers", programId],
    queryFn: () => listLoyaltyCustomers({ programId: programId || undefined }),
  });

  const filtered = useMemo(() => data?.data ?? [], [data?.data]);
  const sampleCustomerId = filtered[0]?.id;

  const stats = useMemo(() => {
    const points = filtered.reduce((sum, customer) => sum + (customer.pointsBalance ?? 0), 0);
    const tiers = new Set(filtered.map((customer) => customer.tier).filter(Boolean));
    return {
      total: filtered.length,
      avgPoints: filtered.length ? Math.round(points / filtered.length) : 0,
      tiers: tiers.size,
    };
  }, [filtered]);

  const adjustMutation = useMutation({
    mutationFn: (payload: { id: string; delta: number }) =>
      updateLoyaltyCustomer(payload.id, {
        pointsDelta: payload.delta,
        reason: "manual-adjustment",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["loyalty-customers", programId] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loyalty Customers"
        description="Monitor balances, tier health, and manual adjustments with guardrails in place."
        meta={
          <InfoTooltip content="Hook into automation for VIP alerts; adjustments log point deltas." />
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Total members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Filtered by program</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Avg points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.avgPoints}</div>
            <p className="text-xs text-muted-foreground">Per member</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.tiers}</div>
            <p className="text-xs text-muted-foreground">Active tiers</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm space-y-4">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Point adjustments</h2>
              <InfoTooltip content="Grant or retract points with guardrail logging." />
            </div>
            <p className="text-xs text-muted-foreground">
              Select a customer and nudge their balance.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Button
              size="sm"
              disabled={!sampleCustomerId}
              onClick={() =>
                sampleCustomerId && adjustMutation.mutate({ id: sampleCustomerId, delta: 50 })
              }
            >
              +50 pts (sample)
            </Button>
            <Button
              size="sm"
              disabled={!sampleCustomerId}
              onClick={() =>
                sampleCustomerId && adjustMutation.mutate({ id: sampleCustomerId, delta: -25 })
              }
            >
              -25 pts (sample)
            </Button>
            {adjustMutation.isError && (
              <span className="text-xs text-destructive">
                {apiErrorMessage(adjustMutation.error)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Customers</h2>
              <InfoTooltip content="Loyalty program, balance, and tier info." />
            </div>
            <p className="text-xs text-muted-foreground">
              Track balances, tiers, and manual adjustments.
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Filter by program"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-56"
            />
            <Button
              variant="outline"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["loyalty-customers", programId] })
              }
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Loading loyalty customers...
            </div>
          ) : isError ? (
            <div className="text-sm text-destructive">Error: {apiErrorMessage(error)}</div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="text-xs">{customer.id}</TableCell>
                      <TableCell className="text-xs">{customer.programId}</TableCell>
                      <TableCell className="font-semibold">{customer.pointsBalance}</TableCell>
                      <TableCell className="text-xs">{customer.tier ?? "—"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adjustMutation.mutate({ id: customer.id, delta: 50 })}
                        >
                          +50 pts
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adjustMutation.mutate({ id: customer.id, delta: -25 })}
                        >
                          -25 pts
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
