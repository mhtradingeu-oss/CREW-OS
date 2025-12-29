// Governance Decision Details Page (Server Component)
// Architectural: Read-only, no execution, no business logic
// All imports explicit, ESM, alias-based

import { getDecision } from '@/lib/api/governance.ts';
import type { GovernanceApproval } from '@/lib/api/types.ts';
import { notFound } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default async function GovernanceDecisionPage({ params }: Props) {
  let decision: GovernanceApproval | null = null;
  try {
    decision = await getDecision(params.id);
  } catch {
    notFound();
  }
  if (!decision) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Decision Details</h1>
      <div className="mb-2"><b>ID:</b> {decision.id}</div>
      <div className="mb-2"><b>Type:</b> {decision.type}</div>
      <div className="mb-2"><b>Status:</b> {decision.status}</div>
      <div className="mb-2"><b>Created:</b> {decision.createdAt}</div>
      <div className="mb-2"><b>Updated:</b> {decision.updatedAt}</div>
      {decision.decisionBy && (
        <div className="mb-2"><b>Decision By:</b> {decision.decisionBy}</div>
      )}
      {decision.decisionAt && (
        <div className="mb-2"><b>Decision At:</b> {decision.decisionAt}</div>
      )}
    </div>
  );
}
