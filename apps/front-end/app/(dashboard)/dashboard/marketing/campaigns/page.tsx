"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCampaign, listCampaigns } from "@/lib/api/marketing";
import { apiErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({ name: "", objective: "", status: "draft" });
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["campaigns", search],
    queryFn: () => listCampaigns({ pageSize: 50 }),
  });

  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    if (!search.trim()) return data.data;
    return data.data.filter(
      (campaign) => campaign.name?.toLowerCase().includes(search.toLowerCase()) ?? false,
    );
  }, [data?.data, search]);

  const stats = useMemo(() => {
    const campaigns = filteredData;
    const active = campaigns.filter((c) => c.status === "active").length;
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget ?? 0), 0);
    return {
      total: campaigns.length,
      active,
      totalBudget,
    };
  }, [filteredData]);

  const createMutation = useMutation({
    mutationFn: () => createCampaign(draft),
    onSuccess: () => {
      setDraft({ name: "", objective: "", status: "draft" });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing Campaigns"
        description="Track programs, channels, and performance with quick filters."
        meta={<InfoTooltip content="Campaigns stored via Prisma; channel metrics attach later." />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">
              Total programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Filtered by search</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Campaigns running now</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex items-center gap-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Budget</CardTitle>
            <InfoTooltip content="Aggregate of all visible campaign budgets." />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">€{stats.totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current view</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm space-y-4">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Launch a campaign</h2>
              <InfoTooltip content="Create structured campaigns, then link to channel data when ready." />
            </div>
            <p className="text-xs text-muted-foreground">
              Name + objective + status are required to seed a campaign.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              placeholder="Name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
            <Input
              placeholder="Objective"
              value={draft.objective}
              onChange={(e) => setDraft((d) => ({ ...d, objective: e.target.value }))}
            />
            <Input
              placeholder="Status"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            />
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isLoading || !draft.name}
            >
              {createMutation.isLoading ? "Saving..." : "Create"}
            </Button>
          </div>
          {createMutation.isError && (
            <div className="text-sm text-destructive mt-2">
              {apiErrorMessage(createMutation.error)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Campaigns</h2>
              <InfoTooltip content="Filter by name and track statuses & budgets." />
            </div>
            <p className="text-xs text-muted-foreground">Sort by objective, status, and budget.</p>
          </div>
          <div className="flex gap-2">
            <Label htmlFor="campaign-search" className="text-xs text-muted-foreground">
              Search
            </Label>
            <Input
              id="campaign-search"
              placeholder="Search campaigns"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Loading campaigns...
            </div>
          ) : isError ? (
            <div className="text-sm text-destructive">Error: {apiErrorMessage(error)}</div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Objective</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-semibold">{campaign.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {campaign.objective ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] uppercase">
                          {campaign.status ?? "draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{campaign.budget ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(campaign.createdAt).toLocaleDateString()}
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
