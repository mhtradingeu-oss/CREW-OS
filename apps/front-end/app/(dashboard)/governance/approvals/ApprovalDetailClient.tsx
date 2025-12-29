// PHASE 8.1 — GOVERNANCE UI ONLY
// This interface approves ExecutionIntents.
// It NEVER executes or triggers automation.

'use client';
import React from "react";
// V1 READ-ONLY: ApprovalDetail is a default export, import accordingly
import ApprovalDetail from "./ApprovalDetail";
import { TenantAppShell } from "@/components/shell/tenant-app-shell";

export default function ApprovalDetailClient() {
  return (
    <TenantAppShell>
      <ApprovalDetail />
    </TenantAppShell>
  );
}
