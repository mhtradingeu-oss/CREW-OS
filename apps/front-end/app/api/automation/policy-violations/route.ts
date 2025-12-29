import { NextRequest, NextResponse } from 'next/server';
// Placeholder for policy violations

const mockViolations = [
  { id: 'pv-1', ruleId: 'rule-1', type: 'forbidden-action', detail: 'Tried to use deleteUser', createdAt: '2025-12-12' },
  { id: 'pv-2', ruleId: 'rule-2', type: 'sensitive-trigger', detail: 'Triggered system.shutdown', createdAt: '2025-12-13' },
];

export async function GET(req: NextRequest) {
  await new Promise((r) => setTimeout(r, 300));
  return NextResponse.json({ items: mockViolations });
}
