import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { ruleId: string, versionId: string } }) {
  // Simulate success
  return NextResponse.json({ success: true });
}
