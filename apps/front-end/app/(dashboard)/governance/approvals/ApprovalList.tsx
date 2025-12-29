// PHASE 8.1 — GOVERNANCE UI ONLY
// This interface approves ExecutionIntents.
// It NEVER executes or triggers automation.

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { SimpleTable } from "@/components/shell/simple-table";
import { FilterBar } from "@/components/shell/filter-bar";
import Link from "next/link";

// Types for ExecutionIntent summary (minimal, for list)
type ExecutionIntentSummary = {
  intentId: string;
  scope: string;
  riskLevel: string;
  decisionId: string;
  createdAt: string;
  approval: { status: "PENDING" | "APPROVED" | "REJECTED" };
};

type FilterState = {
  status: "ALL" | "PENDING" | "APPROVED" | "REJECTED";
  scope: string;
  riskLevel: string;
};

const statusOptions = ["ALL", "PENDING", "APPROVED", "REJECTED"];

export function ApprovalList() {
  const { hasPermission } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    status: "ALL",
    scope: "",
    riskLevel: "",
  });
  const { data, isLoading, error } = useQuery<ExecutionIntentSummary[]>({
    queryKey: ["execution-intents", filters],
    queryFn: async () => {
      const res = await api.get("/ai/execution-intents");
      return res.data as ExecutionIntentSummary[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((item) => {
      if (filters.status !== "ALL" && item.approval.status !== filters.status) return false;
      if (filters.scope && item.scope !== filters.scope) return false;
      if (filters.riskLevel && item.riskLevel !== filters.riskLevel) return false;
      return true;
    });
  }, [data, filters]);

  return (
    <div className="space-y-4">
      <FilterBar>
        <label>Status:
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value as FilterState["status"] }))}>
            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </label>
        <label>Scope:
          <input value={filters.scope} onChange={e => setFilters(f => ({ ...f, scope: e.target.value }))} placeholder="Any" />
        </label>
        <label>Risk Level:
          <input value={filters.riskLevel} onChange={e => setFilters(f => ({ ...f, riskLevel: e.target.value }))} placeholder="Any" />
        </label>
      </FilterBar>
      <SimpleTable
        columns={["Intent ID", "Scope", "Risk Level", "Decision ID", "Created At", "Status", "Actions"]}
        rows={filtered.map((item) => [
          <span key={`intentId-${item.intentId}`} className="font-mono text-xs">{item.intentId}</span>,
          <span key={`scope-${item.intentId}`}>{item.scope}</span>,
          <span key={`riskLevel-${item.intentId}`}>{item.riskLevel}</span>,
          <span key={`decisionId-${item.decisionId}`} className="font-mono text-xs">{item.decisionId}</span>,
          <span key={`createdAt-${item.intentId}`}>{new Date(item.createdAt).toLocaleString()}</span>,
          <span key={`status-${item.intentId}`} className={`badge badge-${item.approval.status.toLowerCase()}`}>{item.approval.status}</span>,
          <Link key={`view-${item.intentId}`} href={`/governance/approvals/${item.intentId}`} className="btn btn-sm">View</Link>,
        ])}
      />
      {isLoading && <div>Loading...</div>}
      {error ? <div className="text-red-500">Error loading approvals</div> : null}
      {filtered.length === 0 && !isLoading && <div>No matching approvals found.</div>}
    </div>
  );
}
