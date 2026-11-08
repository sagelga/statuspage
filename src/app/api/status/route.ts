/**
 * GET /api/status — service health and 30-day history from Cloudflare KV.
 *
 * Query params:
 * - tzOffset    client offset in minutes east of UTC (clamped)
 * - brand       `byteside` | `sagelga` (optional filter)
 * - currentOnly `true` returns badges only (fast path, no history)
 */
import { NextRequest, NextResponse } from 'next/server';
import type { BrandId } from '@/config';
import { filterServicesByBrand, isValidBrandParam } from '@/lib/brand-filter';
import { parseTimezoneOffsetParam } from '@/lib/date-range';
import { getStatusStore } from '@/lib/status-kv';
import {
  buildCurrentStatusResponse,
  buildFullStatusResponse,
  loadServicesConfig,
} from '@/lib/status-response';

const CACHE_CURRENT = 'public, max-age=15, s-maxage=15';
const CACHE_FULL = 'public, max-age=60, s-maxage=60, stale-while-revalidate=120';

export async function GET(request: NextRequest) {
  const tzOffsetMinutes = parseTimezoneOffsetParam(
    request.nextUrl.searchParams.get('tzOffset'),
  );
  const brandParam = request.nextUrl.searchParams.get('brand') as BrandId | null;
  const currentOnly = request.nextUrl.searchParams.get('currentOnly') === 'true';
  const now = new Date();

  try {
    const store = getStatusStore();
    const config = await loadServicesConfig(store);

    if (!config.ok) {
      return NextResponse.json(
        { error: config.error, message: config.message },
        { status: config.status },
      );
    }

    const services = isValidBrandParam(brandParam)
      ? filterServicesByBrand(config.services, brandParam)
      : config.services;

    const data = currentOnly
      ? await buildCurrentStatusResponse(store, services, now)
      : await buildFullStatusResponse(store, services, tzOffsetMinutes, now);

    return NextResponse.json(data, {
      headers: { 'Cache-Control': currentOnly ? CACHE_CURRENT : CACHE_FULL },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
