// Governance Approvals Page (Server Component)
// Architectural: Read-only, no execution, no business logic
// All imports explicit, ESM, alias-based

import { listApprovals } from '@/lib/api/governance.ts';
import type { GovernanceApproval } from '@/lib/api/types.ts';

export const dynamic = 'force-dynamic'; // SSR for up-to-date data

export default async function GovernanceApprovalsPage() {
  const approvals = await listApprovals();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Governance Approvals</h1>
      <table className="min-w-full border text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Type</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Created</th>
            <th className="border px-2 py-1">Updated</th>
          </tr>
        </thead>
        <tbody>
          {approvals.items.map((a: GovernanceApproval) => (
            <tr key={a.id}>
              <td className="border px-2 py-1">{a.id}</td>
              <td className="border px-2 py-1">{a.type}</td>
              <td className="border px-2 py-1">{a.status}</td>
              <td className="border px-2 py-1">{a.createdAt}</td>
              <td className="border px-2 py-1">{a.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
