"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLead, updateLead } from "@/lib/api/crm";
import { apiErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import { useLeadAI, useLeads } from "@/lib/hooks/use-crm";

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState({ name: "", email: "", status: "new" });
  const { data, isLoading, isError, error } = useLeads({ search });

  const filteredLeads = useMemo(() => {
    if (!data?.data) return [];
    if (!search.trim()) return data.data;
    return data.data.filter((lead) =>
      (lead.name ?? "").toLowerCase().includes(search.toLowerCase()),
    );
  }, [data?.data, search]);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedLeadId && filteredLeads.length > 0) {
      const firstLeadId = filteredLeads[0]?.id;
      if (firstLeadId) {
        setSelectedLeadId(firstLeadId);
      }
    }
  }, [filteredLeads, selectedLeadId]);
  const selectedLead =
    filteredLeads.find((lead) => lead.id === selectedLeadId) ?? filteredLeads[0] ?? null;

  const {
    data: aiScore,
    isLoading: isScoring,
    error: aiError,
    refetch: refetchScore,
  } = useLeadAI(selectedLead?.id);

  const stats = useMemo(() => {
    const leads = filteredLeads;
    const won = leads.filter((lead) => lead.status === "won").length;
    const lost = leads.filter((lead) => lead.status === "lost").length;
    return {
      total: leads.length,
      won,
      lost,
      conversion: leads.length ? Math.round((won / leads.length) * 100) : 0,
    };
  }, [filteredLeads]);

  const createMutation = useMutation({
    mutationFn: () => createLead(draft),
    onSuccess: () => {
      setDraft({ name: "", email: "", status: "new" });
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; status: string }) =>
      updateLead(payload.id, { status: payload.status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm-leads", search] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM Leads"
        description="Pipeline view, scoring, and quick actions to nudge prospects."
        meta={
          <InfoTooltip content="Filters update local view; scoring and routing happen in CRM service." />
        }
        actions={
          <Input
            placeholder="Search leads"
            className="w-60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Total leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Current view</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Won</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.won}</div>
            <p className="text-xs text-muted-foreground">Closed deals</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.conversion}%</div>
            <p className="text-xs text-muted-foreground">Won/total</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm space-y-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Quick add lead</h2>
            <InfoTooltip content="Capture basic lead data before routing to reps." />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            <Input
              placeholder="Name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
            <Input
              placeholder="Email"
              value={draft.email}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
            />
            <Input
              placeholder="Status"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            />
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isLoading || !draft.email}
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
              <h2 className="text-lg font-semibold">Lead scoring</h2>
              <InfoTooltip content="Refresh the lead score using MH-OS AI for next actions." />
            </div>
            <p className="text-xs text-muted-foreground">
              Pick a prospect, then click “Score by AI” to refresh their probability and reasoning.
            </p>
          </div>
          <Select
            value={selectedLeadId ?? ""}
            onChange={(event) => setSelectedLeadId(event.target.value || null)}
            disabled={!filteredLeads.length}
            className="max-w-[240px]"
          >
            <option value="" disabled>
              Choose a lead...
            </option>
            {filteredLeads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name ?? lead.id}
              </option>
            ))}
          </Select>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedLead ? (
            <>
              <div className="grid gap-2 rounded-md border border-border p-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Company</span>
                  <span>{selectedLead.companyName ?? "N/A"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>AI Score</span>
                  <span className="font-semibold">
                    {aiScore?.score ?? selectedLead.score ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Probability</span>
                  <span className="text-muted-foreground">
                    {aiScore?.probability != null
                      ? `${Math.round(aiScore.probability * 100)}%`
                      : "N/A"}
                  </span>
                </div>
                {selectedLead.dealCount != null && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Deals</span>
                    <span>{selectedLead.dealCount}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm">
                {aiScore?.reasons && aiScore.reasons.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {aiScore.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    {aiScore ? "No reasons returned" : "Score this lead to see driving factors."}
                  </p>
                )}
                {aiScore?.nextAction && (
                  <p className="text-sm font-medium">Next action: {aiScore.nextAction}</p>
                )}
                {aiError ? (
                  <p className="text-xs text-destructive">
                    {apiErrorMessage(aiError)} while scoring.
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => void refetchScore()}
                  disabled={isScoring || !selectedLead?.id}
                >
                  {isScoring ? "Scoring..." : "Score by AI"}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No lead selected to score.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Lead list</h2>
              <InfoTooltip content="Statuses can be toggled to update the pipeline." />
            </div>
            <p className="text-xs text-muted-foreground">Use actions to mark won/lost quickly.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Filter: {search ? `contains "${search}"` : "all leads"}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Loading leads...
            </div>
          ) : isError ? (
            <div className="text-sm text-destructive">Error: {apiErrorMessage(error)}</div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-semibold">{lead.name ?? "Unnamed lead"}</div>
                        <div className="text-xs text-muted-foreground">{lead.id}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] uppercase">
                          {lead.status ?? "new"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lead.email ?? "n/a"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2 text-xs">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: lead.id, status: "won" })}
                        >
                          Mark won
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: lead.id, status: "lost" })}
                        >
                          Mark lost
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
