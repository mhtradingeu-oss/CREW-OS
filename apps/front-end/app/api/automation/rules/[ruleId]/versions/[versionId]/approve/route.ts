import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { ruleId: string, versionId: string } }) {
  // Simulate policy violation for demonstration
  if (params.versionId === 'blocked') {
    return NextResponse.json({ error: 'Policy violation: cannot approve this version.' }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
