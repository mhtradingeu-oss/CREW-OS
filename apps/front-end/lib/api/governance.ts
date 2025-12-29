// Governance API (read-only, presenter layer)
// No business/AI/decision/automation logic. No hooks. No side effects.
// All imports explicit, ESM, alias-based.

import { apiFetch } from '@/lib/api/client';
import type { GovernanceApproval, ApiListResponse } from '@/lib/api/types';

export async function listApprovals(): Promise<ApiListResponse<GovernanceApproval>> {
  return apiFetch<ApiListResponse<GovernanceApproval>>('/api/v1/governance/approvals');
}

export async function getApproval(id: string): Promise<GovernanceApproval> {
  return apiFetch<GovernanceApproval>(`/api/v1/governance/approvals/${id}`);
}

export async function listDecisions(): Promise<ApiListResponse<GovernanceApproval>> {
  return apiFetch<ApiListResponse<GovernanceApproval>>('/api/v1/governance/decisions');
}

export async function getDecision(id: string): Promise<GovernanceApproval> {
  return apiFetch<GovernanceApproval>(`/api/v1/governance/decisions/${id}`);
}
