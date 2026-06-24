/**
 * GET /api/minutes/[serviceId]/[date] — Edge route returning 1440 minute-level status cells.
 * Reads epoch-keyed codes from KV `m:{serviceId}` and maps them to local minute indices
 * using tzOffset. Codes are decoded via lib/decode-status decodeStatus.
 * Missing KV or out-of-range epochs yield `nodata` placeholders.
 */
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { decodeStatus } from '@/lib/decode-status';
import { parseTimezoneOffsetParam } from '@/lib/date-range';
import type { ServiceStatus } from '@/types';

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

    // tzOffset aligns UTC epoch keys to the user's local calendar day
    const tzParam = request.nextUrl.searchParams.get('tzOffset');
    const tzOffsetMinutes = parseTimezoneOffsetParam(tzParam);
    const tzOffsetSec = tzOffsetMinutes * 60;

    const raw = await kv.get(`m:${serviceId}`);
    if (!raw) return NextResponse.json(new Array(1440).fill('nodata'));

    const all: Record<string, string> = JSON.parse(raw);

    // Local midnight for `date` expressed as UTC epoch bounds (86400s window)
    const localDayStart = Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000) - tzOffsetSec;
    const localDayEnd = localDayStart + 86400;

    const minutes: (ServiceStatus | 'nodata')[] = new Array(1440).fill('nodata');
    for (const [epochStr, code] of Object.entries(all)) {
      const epoch = parseInt(epochStr);
      if (epoch >= localDayStart && epoch < localDayEnd) {
        const idx = Math.floor((epoch - localDayStart) / 60);
        if (idx >= 0 && idx < 1440) {
          // compact KV code → ServiceStatus | nodata
          minutes[idx] = decodeStatus(code);
        }
      }
    }

    return NextResponse.json(minutes, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json(new Array(1440).fill('nodata'));
  }
}
