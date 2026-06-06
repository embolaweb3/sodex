import { NextResponse } from 'next/server';
import { checkLiveness, hasApiKey } from '@/lib/sosovalue';

export async function GET() {
  const source = await checkLiveness();
  return NextResponse.json({
    source,
    hasKey: hasApiKey(),
    fetchedAt: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
