import { NextRequest, NextResponse } from 'next/server';
// Placeholder for audit log entries

const mockAuditLog = [
  { id: 'log-1', action: 'created', entityType: 'automation-rule', entityId: 'rule-1', createdAt: '2025-12-10' },
  { id: 'log-2', action: 'run', entityType: 'automation-rule', entityId: 'rule-2', createdAt: '2025-12-11' },
];

export async function GET(req: NextRequest) {
  await new Promise((r) => setTimeout(r, 300));
  return NextResponse.json({ items: mockAuditLog });
}
