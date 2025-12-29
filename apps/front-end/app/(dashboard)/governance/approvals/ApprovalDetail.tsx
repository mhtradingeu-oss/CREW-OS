"use client";

// PHASE 8.1 — GOVERNANCE UI ONLY
// This interface approves ExecutionIntents.
// It NEVER executes or triggers automation.
// EXECUTION IS DISABLED BY DESIGN.

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter, useParams } from "next/navigation";

/* =========================
   Types (UI-only, minimal)
   ========================= */

type ApprovalHistoryItem = {
  timestamp: string;
  userId: string;
  status: string;
  reason?: string;
};

type ExecutionIntentDetail = {
  intentId: string;
  scope: string;
  riskLevel: string;
  decisionId: string;
  createdAt: string;
  approval: {
    status: "PENDING" | "APPROVED" | "REJECTED";
    history: ApprovalHistoryItem[];
  };
  decision: {
    decisionId: string;
    scope: string;
    intent: string;
    primaryAgent: string;
    rationale: string;
  };
  plan: {
    kind: string;
    summary: string;
    steps: string[];
    constraints: { label: string; value: string }[];
  };
  governance: {
    riskLevel: string;
    safety: { reasons: string[] };
    policyRefs?: string[];
  };
};

/* =========================
   Component
   ========================= */

export default function ApprovalDetail() {
  const { hasPermission } = useAuth();
  const canApprove = hasPermission("ai:execution:approve");

  const { intentId } = useParams<{ intentId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // V1 READ-ONLY — mutation state removed

  const { data, isLoading } = useQuery<ExecutionIntentDetail>({
    queryKey: ["execution-intent", intentId],
    queryFn: async () => {
      // V1 READ-ONLY — only GET allowed
      return await apiFetch<ExecutionIntentDetail>(`/ai/execution-intents/${intentId}`);
    },
    enabled: Boolean(intentId),
  });

  // V1 READ-ONLY — mutation logic removed

  if (isLoading || !data) {
    return <div>Loading...</div>;
  }

  const { decision, plan, governance, approval, createdAt } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Execution Intent Detail</h1>
        <span className="badge badge-warning">
          Phase 8.1 — Governance Only
        </span>
      </div>

      {/* Banner */}
      <div className="rounded-xl bg-yellow-100/80 p-3 text-yellow-900 font-semibold border border-yellow-300">
        EXECUTION DISABLED — Approval does NOT execute. Execution is disabled by
        design.
      </div>

      {/* Decision Summary */}
      <div className="rounded-xl border bg-white/5 p-4">
        <h2 className="font-semibold text-lg mb-2">Decision Summary</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><b>Decision ID:</b> {decision.decisionId}</div>
          <div><b>Scope:</b> {decision.scope}</div>
          <div><b>Intent:</b> {decision.intent}</div>
          <div><b>Primary Agent:</b> {decision.primaryAgent}</div>
          <div className="col-span-2">
            <b>Rationale:</b> {decision.rationale}
          </div>
        </div>
      </div>

      {/* Execution Intent */}
      <div className="rounded-xl border bg-white/5 p-4">
        <h2 className="font-semibold text-lg mb-2">Execution Intent</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><b>Plan Kind:</b> {plan.kind}</div>
          <div><b>Plan Summary:</b> {plan.summary}</div>
          <div className="col-span-2">
            <b>Steps:</b>
            <ul className="list-disc ml-6">
              {plan.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="col-span-2">
            <b>Constraints:</b>
            <ul className="list-disc ml-6">
              {plan.constraints.map((c, i) => (
                <li key={i}>
                  <input
                    type="text"
                    value={c.value}
                    disabled
                    className="bg-slate-200 text-slate-500 px-2 py-1 rounded"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Governance */}
      <div className="rounded-xl border bg-white/5 p-4">
        <h2 className="font-semibold text-lg mb-2">Governance</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><b>Risk Level:</b> {governance.riskLevel}</div>
          <div>
            <b>Safety Reasons:</b>
            <ul className="list-disc ml-6">
              {governance.safety.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          {governance.policyRefs?.length ? (
            <div className="col-span-2">
              <b>Policy Refs:</b> {governance.policyRefs.join(", ")}
            </div>
          ) : null}
        </div>
      </div>

      {/* Audit Trail */}
      <div className="rounded-xl border bg-white/5 p-4">
        <h2 className="font-semibold text-lg mb-2">Audit Trail</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <b>Created At:</b>{" "}
            {new Date(createdAt).toLocaleString()}
          </div>
          <div className="col-span-2">
            <b>Approval History:</b>
            <ul className="list-disc ml-6">
              {approval.history.map((h, i) => (
                <li key={i}>
                  {h.status} by {h.userId} at{" "}
                  {new Date(h.timestamp).toLocaleString()}
                  {h.reason ? ` — ${h.reason}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Actions (V1 READ-ONLY — execution disabled) */}
      <div className="flex gap-4 mt-4">
        <span className="text-gray-500 italic">Approval actions are disabled in V1 (read-only, governance only).</span>
      </div>
    </div>
  );
}
