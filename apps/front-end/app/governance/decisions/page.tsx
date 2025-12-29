// Governance Decisions Page (Server Component)
// Architectural: Read-only, no execution, no business logic
// All imports explicit, ESM, alias-based

import { listDecisions } from '@/lib/api/governance.ts';
import type { GovernanceApproval } from '@/lib/api/types.ts';

export const dynamic = 'force-dynamic'; // SSR for up-to-date data

export default async function GovernanceDecisionsPage() {
  const decisions = await listDecisions();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Governance Decisions</h1>
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
          {decisions.items.map((d: GovernanceApproval) => (
            <tr key={d.id}>
              <td className="border px-2 py-1">{d.id}</td>
              <td className="border px-2 py-1">{d.type}</td>
              <td className="border px-2 py-1">{d.status}</td>
              <td className="border px-2 py-1">{d.createdAt}</td>
              <td className="border px-2 py-1">{d.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
