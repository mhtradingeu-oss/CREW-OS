import { NextRequest, NextResponse } from 'next/server';
// This is a placeholder. Replace with real data fetching from backend control plane API.

const mockRules = [
  { id: 'rule-1', name: 'Welcome Email', state: 'ACTIVE', createdAt: '2025-12-01' },
  { id: 'rule-2', name: 'Abandoned Cart', state: 'PAUSED', createdAt: '2025-12-05' },
];

export async function GET(req: NextRequest) {
  // Simulate loading delay
  await new Promise((r) => setTimeout(r, 300));
  return NextResponse.json({ items: mockRules });
}
