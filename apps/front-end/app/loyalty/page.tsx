// Loyalty Page (Server Component)
// Architectural: Read-only, no business logic
// All imports explicit, ESM, alias-based

import { getLoyaltyStatus } from '@/lib/api/loyalty.ts';
import type { LoyaltyStatus } from '@/lib/api/types.ts';

interface Props {
  searchParams: { userId?: string };
}

export default async function LoyaltyPage({ searchParams }: Props) {
  const userId = searchParams.userId || '';
  let status: LoyaltyStatus | null = null;
  if (userId) {
    try {
      status = await getLoyaltyStatus(userId);
    } catch {
      status = null;
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Loyalty Status</h1>
      {!userId && <div>Provide a userId in the URL to view status.</div>}
      {status && (
        <div className="mt-4">
          <div><b>User ID:</b> {status.userId}</div>
          <div><b>Points:</b> {status.points}</div>
          <div><b>Tier:</b> {status.tier}</div>
        </div>
      )}
      {userId && !status && <div className="mt-4 text-red-600">No status found for this user.</div>}
    </div>
  );
}
