// PHASE 8.1 — GOVERNANCE UI ONLY
// This interface approves ExecutionIntents.
// It NEVER executes or triggers automation.

'use client';
import React from "react";
import { ApprovalList } from "./ApprovalList";
import { useAuth } from "@/lib/auth/auth-context";
import { TenantAppShell } from "@/components/shell/tenant-app-shell";

export default function ApprovalsPageClient() {
  const { hasPermission } = useAuth();
  const canApprove = hasPermission("ai:execution:approve");
  return (
    <TenantAppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold">Governance Approvals</h1>
          <span className="badge badge-warning">Phase 8.1 — Governance Only</span>
        </div>
        <div className="rounded-xl bg-yellow-100/80 p-3 text-yellow-900 font-semibold border border-yellow-300">
          EXECUTION DISABLED — Approval does NOT execute. Execution is disabled by design.
        </div>
        <ApprovalList />
        {!canApprove && (
          <div className="mt-4 p-3 rounded bg-slate-800 text-slate-300 border border-slate-700">
            <b>Read-only:</b> You do not have permission to approve execution intents (ai:execution:approve).
          </div>
        )}
      </div>
    </TenantAppShell>
  );
}
