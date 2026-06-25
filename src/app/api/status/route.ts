/**
 * GET /api/status — Edge route reading pulse worker data from Cloudflare KV.
 * - config:services — service definitions
 * - m:{id} — epoch-minute status codes (uptime % + current status)
 * - daily:{id} — per-UTC-date summaries (tz overlap merged for non-UTC clients)
 * - ping:{id} — latest response time ms
 * Query: tzOffset (clamped), brand (filter), currentOnly (fast badges, skip history).
 */
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { BrandId } from '@/config';
import { filterServiceDefinitions, isValidBrandParam } from '@/lib/brand-filter';
import { decodeStatus, STATUS_PRIORITY } from '@/lib/decode-status';
import { deriveFromMinuteMap } from '@/lib/derive-minute-uptime';
import { getLast30IsoDates, parseTimezoneOffsetParam } from '@/lib/date-range';
import type { CurrentStatusResponse, ServiceDefinition, StatusResponse } from '@/types';
import { ServiceStatus } from '@/types';

interface ServicesConfig {
  services: ServiceDefinition[];
  updatedAt: string;
}

const CACHE_CURRENT = 'public, max-age=15, s-maxage=15';
const CACHE_FULL = 'public, max-age=60, s-maxage=60, stale-while-revalidate=120';

/** Read a string value from the STATUS_HISTORY KV namespace (edge binding). */
async function fetchFromKV(key: string): Promise<string | null> {
  const { env } = getRequestContext();
  const kv = (env as unknown as { STATUS_HISTORY: KVNamespace }).STATUS_HISTORY;
  if (!kv) return null;
  return kv.get(key);
}

function parseMinuteMap(raw: string | null): Record<string, string> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return null;
  }
}

function currentStatusFromDailyRaw(dailyRaw: string | null): ServiceStatus | null {
  if (!dailyRaw) return null;
  try {
    const parsed = JSON.parse(dailyRaw);
    const today = new Date().toISOString().slice(0, 10);
    const code = Array.isArray(parsed)
      ? (parsed as { date: string; status: string }[]).find((e) => e.date === today)?.status
      : (parsed as Record<string, string>)[today];
    if (!code) return null;
    const s = decodeStatus(code);
    return s === 'nodata' ? null : s;
  } catch {
    return null;
  }
}

function readDailyHistoryFromRaw(
  dailyRaw: string | null,
  tzOffsetMinutes: number,
): (ServiceStatus | 'nodata')[] {
  const dates = getLast30IsoDates(tzOffsetMinutes);
  if (!dailyRaw) return new Array(30).fill('nodata');
  try {
    const parsed = JSON.parse(dailyRaw);
    const byDate: Record<string, string> = {};
    if (Array.isArray(parsed)) {
      for (const e of parsed as { date: string; status: string }[]) {
        byDate[e.date] = e.status;
      }
    } else {
      for (const [date, status] of Object.entries(parsed)) {
        byDate[date] = status as string;
      }
    }

    if (tzOffsetMinutes === 0) {
      return dates.map((d) => decodeStatus(byDate[d] ?? 'nodata'));
    }

    return dates.map((localDate) => {
      const localDateMs = new Date(`${localDate}T00:00:00Z`).getTime();
      let s1: string, s2: string;
      if (tzOffsetMinutes > 0) {
        const prevUtcDate = new Date(localDateMs - 86400000).toISOString().slice(0, 10);
        s1 = byDate[prevUtcDate] ?? 'nodata';
        s2 = byDate[localDate] ?? 'nodata';
      } else {
        const nextUtcDate = new Date(localDateMs + 86400000).toISOString().slice(0, 10);
        s1 = byDate[localDate] ?? 'nodata';
        s2 = byDate[nextUtcDate] ?? 'nodata';
      }
      const p1 = STATUS_PRIORITY[s1] ?? -1;
      const p2 = STATUS_PRIORITY[s2] ?? -1;
      return decodeStatus(p1 >= p2 ? s1 : s2);
    });
  } catch {
    return new Array(30).fill('nodata');
  }
}

async function loadServiceCurrent(svc: ServiceDefinition): Promise<ServiceDefinition & {
  status: ServiceStatus;
  responseTime: number | null;
  statusCode: null;
}> {
  const [minuteRaw, pingRaw] = await Promise.all([
    fetchFromKV(`m:${svc.id}`),
    fetchFromKV(`ping:${svc.id}`),
  ]);
  const minuteMap = parseMinuteMap(minuteRaw);
  const nowEpoch = Math.floor(Date.now() / 1000);
  let status: ServiceStatus;
  if (minuteMap) {
    status = deriveFromMinuteMap(minuteMap, 0, nowEpoch).currentStatus;
  } else {
    const dailyRaw = await fetchFromKV(`daily:${svc.id}`);
    status = currentStatusFromDailyRaw(dailyRaw) ?? 'operational';
  }
  const responseTime = pingRaw !== null ? parseInt(pingRaw, 10) : null;
  return { ...svc, status, responseTime, statusCode: null };
}

async function loadServiceFull(
  svc: ServiceDefinition,
  tzOffsetMinutes: number,
): Promise<{
  service: ServiceDefinition & { status: ServiceStatus; responseTime: number | null; statusCode: null };
  history: (ServiceStatus | 'nodata')[];
  opPct: (number | null)[];
  funcPct: (number | null)[];
}> {
  const nowEpoch = Math.floor(Date.now() / 1000);
  const [minuteRaw, dailyRaw, pingRaw] = await Promise.all([
    fetchFromKV(`m:${svc.id}`),
    fetchFromKV(`daily:${svc.id}`),
    fetchFromKV(`ping:${svc.id}`),
  ]);

  const minuteMap = parseMinuteMap(minuteRaw);
  const { currentStatus, opPct, funcPct } = deriveFromMinuteMap(minuteMap, tzOffsetMinutes, nowEpoch);
  const status = minuteMap ? currentStatus : (currentStatusFromDailyRaw(dailyRaw) ?? 'operational');
  const responseTime = pingRaw !== null ? parseInt(pingRaw, 10) : null;

  return {
    service: { ...svc, status, responseTime, statusCode: null },
    history: readDailyHistoryFromRaw(dailyRaw, tzOffsetMinutes),
    opPct,
    funcPct,
  };
}

function calculateOverallStatus(statuses: ServiceStatus[]): ServiceStatus {
  if (statuses.some((s) => s === 'down')) return 'down';
  if (statuses.some((s) => s === 'degraded')) return 'degraded';
  return 'operational';
}

export async function GET(request: NextRequest) {
  const tzParam = request.nextUrl.searchParams.get('tzOffset');
  const tzOffsetMinutes = parseTimezoneOffsetParam(tzParam);
  const brandParam = request.nextUrl.searchParams.get('brand') as BrandId | null;
  const now = new Date();
  try {
    const configRaw = await fetchFromKV('config:services');

    if (!configRaw) {
      return NextResponse.json({
        error: 'Configuration unavailable',
        message: 'KV config:services not found. Ensure statuspage-pulse worker is deployed and running.',
      }, { status: 503 });
    }

    let services: ServiceDefinition[];
    try {
      const config: ServicesConfig = JSON.parse(configRaw);
      services = config.services;
    } catch {
      return NextResponse.json({
        error: 'Configuration parse error',
        message: 'Failed to parse config:services from KV.',
      }, { status: 500 });
    }

    let servicesToUse = services;
    if (isValidBrandParam(brandParam)) {
      servicesToUse = filterServiceDefinitions(services, brandParam);
    }

    const currentOnly = request.nextUrl.searchParams.get('currentOnly') === 'true';

    if (currentOnly) {
      const currentStatuses = await Promise.all(servicesToUse.map(loadServiceCurrent));

      const data: CurrentStatusResponse = {
        status: calculateOverallStatus(currentStatuses.map((s) => s.status)),
        checkedAt: now.toISOString(),
        services: currentStatuses,
        history: {},
      };

      return NextResponse.json(data, {
        headers: { 'Cache-Control': CACHE_CURRENT },
      });
    }

    const history: Record<string, (ServiceStatus | 'nodata')[]> = {};
    const dailyUptime: Record<string, (number | null)[]> = {};
    const dailyFuncUptime: Record<string, (number | null)[]> = {};

    const loaded = await Promise.all(
      servicesToUse.map((svc) => loadServiceFull(svc, tzOffsetMinutes)),
    );

    const currentStatuses = loaded.map(({ service, history: h, opPct, funcPct }) => {
      history[service.id] = h;
      dailyUptime[service.id] = opPct;
      dailyFuncUptime[service.id] = funcPct;
      return service;
    });

    const data: StatusResponse = {
      status: calculateOverallStatus(currentStatuses.map((s) => s.status)),
      checkedAt: now.toISOString(),
      services: currentStatuses,
      history,
      dailyUptime,
      dailyFuncUptime,
    };

    return NextResponse.json(data, {
      headers: { 'Cache-Control': CACHE_FULL },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}