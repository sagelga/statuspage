/**
 * GET /api/minutes/[serviceId]/[date] — 1440 minute-level status cells
 * for one local calendar day, read from the KV `m:{serviceId}` epoch map.
 */
import { NextRequest, NextResponse } from 'next/server';
import { parseTimezoneOffsetParam } from '@/lib/date-range';
import { buildMinuteCells, MINUTES_PER_DAY } from '@/lib/minute-cells';
import { parseMinuteMap } from '@/lib/minute-map';
import { getStatusStore } from '@/lib/status-kv';

const NO_STORE = { 'Cache-Control': 'no-store' };

function emptyResponse() {
  return NextResponse.json(new Array(MINUTES_PER_DAY).fill('nodata'));
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ serviceId: string; date: string }> },
) {
  const { serviceId, date } = await context.params;
  if (!serviceId || !date) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const tzOffsetMinutes = parseTimezoneOffsetParam(
      request.nextUrl.searchParams.get('tzOffset'),
    );
    const store = getStatusStore();
    const minuteMap = parseMinuteMap(await store.get(`m:${serviceId}`));

    return NextResponse.json(
      buildMinuteCells(minuteMap, date, tzOffsetMinutes),
      { headers: NO_STORE },
    );
  } catch {
    return emptyResponse();
  }
}
