export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import type { ServiceStatus } from '@/types';

function decodeStatus(code: string): ServiceStatus | 'nodata' {
  if (code === 'o' || code === 'operational') return 'operational';
  if (code === 'd' || code === 'degraded') return 'degraded';
  if (code === 'x' || code === 'down') return 'down';
  return 'nodata';
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ serviceId: string; date: string }> }
) {
  const { serviceId, date } = await context.params;
  if (!serviceId || !date) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const { env } = getRequestContext();
    const kv = (env as unknown as { STATUS_HISTORY: KVNamespace }).STATUS_HISTORY;
    if (!kv) return NextResponse.json(new Array(1440).fill('nodata'));

    const tzParam = request.nextUrl.searchParams.get('tzOffset');
    const tzOffsetMinutes = Math.max(-720, Math.min(840, parseInt(tzParam ?? '0', 10) || 0));
    const tzOffsetSec = tzOffsetMinutes * 60;

    const raw = await kv.get(`m:${serviceId}`);
    if (!raw) return NextResponse.json(new Array(1440).fill('nodata'));

    const all: Record<string, string> = JSON.parse(raw);

    // Epoch range for this local date: local midnight in UTC ± 1 day
    const localDayStart = Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000) - tzOffsetSec;
    const localDayEnd = localDayStart + 86400;

    const minutes: (ServiceStatus | 'nodata')[] = new Array(1440).fill('nodata');
    for (const [epochStr, code] of Object.entries(all)) {
      const epoch = parseInt(epochStr);
      if (epoch >= localDayStart && epoch < localDayEnd) {
        const idx = Math.floor((epoch - localDayStart) / 60);
        if (idx >= 0 && idx < 1440) {
          minutes[idx] = decodeStatus(code);
        }
      }
    }

    return NextResponse.json(minutes, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json(new Array(1440).fill('nodata'));
  }
}
