import { NextRequest, NextResponse } from 'next/server';
// Placeholder for rule detail and versions

const mockRuleDetail = {
  id: 'rule-1',
  name: 'Welcome Email',
  state: 'ACTIVE',
  createdAt: '2025-12-01',
  versions: [
    { id: 'v1', versionNumber: 1, state: 'ACTIVE', createdAt: '2025-12-01' },
    { id: 'v2', versionNumber: 2, state: 'REVIEW', createdAt: '2025-12-10' },
  ],
};

export async function GET(req: NextRequest, { params }: { params: { ruleId: string } }) {
  // Simulate loading delay
  await new Promise((r) => setTimeout(r, 300));
  return NextResponse.json(mockRuleDetail);
}
