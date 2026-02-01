import { NextResponse } from 'next/server';
import { getFullHealthReport } from '@/lib/content-health';

export async function GET() {
  const report = getFullHealthReport();
  return NextResponse.json(report);
}
