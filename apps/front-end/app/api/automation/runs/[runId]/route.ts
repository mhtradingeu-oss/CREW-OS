import { NextRequest, NextResponse } from 'next/server';
// Placeholder for run detail and action runs

const mockRunDetail = {
  id: 'run-1',
  ruleId: 'rule-1',
  status: 'SUCCESS',
  startedAt: '2025-12-10',
  finishedAt: '2025-12-10',
  actionRuns: [
    { id: 'ar-1', actionType: 'notification', status: 'SUCCESS', startedAt: '2025-12-10' },
    { id: 'ar-2', actionType: 'crm.createTask', status: 'FAILED', startedAt: '2025-12-10' },
  ],
};

export async function GET(req: NextRequest, { params }: { params: { runId: string } }) {
  await new Promise((r) => setTimeout(r, 300));
  return NextResponse.json(mockRunDetail);
}
