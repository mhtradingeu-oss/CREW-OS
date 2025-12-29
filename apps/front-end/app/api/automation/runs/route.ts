import { NextRequest, NextResponse } from 'next/server';
// Placeholder for runs list

const mockRuns = [
  { id: 'run-1', ruleId: 'rule-1', status: 'SUCCESS', startedAt: '2025-12-10', finishedAt: '2025-12-10' },
  { id: 'run-2', ruleId: 'rule-2', status: 'FAILED', startedAt: '2025-12-11', finishedAt: '2025-12-11' },
];

export async function GET(req: NextRequest) {
  await new Promise((r) => setTimeout(r, 300));
  return NextResponse.json({ items: mockRuns });
}
