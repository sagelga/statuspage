export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ serviceId: string; date: string }> }
) {
  const { serviceId, date } = await context.params;

  if (!serviceId || !date) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const { env } = getRequestContext();
    const kv = (env as unknown as { STATUS_HISTORY: KVNamespace }).STATUS_HISTORY;
    if (!kv) {
      return NextResponse.json(new Array(1440).fill('nodata'));
    }

    const raw = await kv.get(`minutes:${serviceId}`);
    if (!raw) {
      return NextResponse.json(new Array(1440).fill('nodata'));
    }
    const parsed = JSON.parse(raw) as Record<string, Record<string, string>>;
    const todayMinutes = parsed[date];
    if (!todayMinutes) {
      return NextResponse.json(new Array(1440).fill('nodata'));
    }
    // Expand "HHMM"-keyed object to 1440-element array
    const minutes = new Array(1440).fill('nodata');
    for (const [k, v] of Object.entries(todayMinutes)) {
      const i = parseInt(k, 10);
      if (i >= 0 && i < 1440) minutes[i] = v;
    }
    return NextResponse.json(minutes, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(new Array(1440).fill('nodata'));
  }
}
