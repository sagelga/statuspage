export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { SERVICES_BY_BRAND, BrandId } from '@/config';
import type { ServiceDefinition } from '@/types';
import { StatusResponse, ServiceStatus } from '@/types';

interface ServicesConfig {
  services: ServiceDefinition[];
  updatedAt: string;
}

const STATUS_PRIORITY: Record<string, number> = {
  x: 2, down: 2,
  d: 1, degraded: 1,
  o: 0, operational: 0,
  nodata: -1,
};

function decodeStatus(code: string): ServiceStatus | 'nodata' {
  if (code === 'o' || code === 'operational') return 'operational';
  if (code === 'd' || code === 'degraded') return 'degraded';
  if (code === 'x' || code === 'down') return 'down';
  return 'nodata';
}

function getLast30Dates(tzOffsetMinutes: number): string[] {
  const dates: string[] = [];
  const nowLocal = Date.now() + tzOffsetMinutes * 60000;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(nowLocal);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

async function fetchFromKV(key: string): Promise<string | null> {
  const { env } = getRequestContext();
  const kv = (env as unknown as { STATUS_HISTORY: KVNamespace }).STATUS_HISTORY;
  if (!kv) {
    console.log(`[KV] namespace not available, key=${key}`);
    return null;
  }
  const value = await kv.get(key);
  console.log(`[KV] get key=${key} hit=${value !== null} length=${value?.length ?? 0}`);
  return value;
}

// Reads per-day uptime % from epoch-based minute data (m:{serviceId})
// Returns { opPct, funcPct } where:
//   opPct  = operational / total  (strict: degraded counts against uptime)
//   funcPct = (operational + degraded) / total  (functional: service was responding)
async function readDailyUptimePct(
  serviceId: string, tzOffsetMinutes: number
): Promise<{ opPct: (number | null)[]; funcPct: (number | null)[] }> {
  const dates = getLast30Dates(tzOffsetMinutes);
  const empty = { opPct: new Array(30).fill(null), funcPct: new Array(30).fill(null) };
  const raw = await fetchFromKV(`m:${serviceId}`);
  if (!raw) return empty;

  try {
    const all: Record<string, string> = JSON.parse(raw);
    const tzOffsetSec = tzOffsetMinutes * 60;

    const opPct: (number | null)[] = [];
    const funcPct: (number | null)[] = [];

    for (const localDate of dates) {
      const localDayStart = Math.floor(new Date(`${localDate}T00:00:00Z`).getTime() / 1000) - tzOffsetSec;
      const localDayEnd = localDayStart + 86400;

      let operational = 0;
      let functional = 0; // operational + degraded
      let known = 0;
      for (const [epochStr, code] of Object.entries(all)) {
        const epoch = parseInt(epochStr);
        if (epoch >= localDayStart && epoch < localDayEnd) {
          known++;
          if (code === 'o' || code === 'operational') { operational++; functional++; }
          else if (code === 'd' || code === 'degraded') { functional++; }
          // 'x' / 'down' contributes to known but neither counter
        }
      }
      opPct.push(known === 0 ? null : (operational / known) * 100);
      funcPct.push(known === 0 ? null : (functional / known) * 100);
    }
    return { opPct, funcPct };
  } catch {
    return empty;
  }
}

// Reads 30-day daily summary from the compact daily:{serviceId} key
async function readDailyHistory(serviceId: string, tzOffsetMinutes: number): Promise<(ServiceStatus | 'nodata')[]> {
  const dates = getLast30Dates(tzOffsetMinutes);
  const raw = await fetchFromKV(`daily:${serviceId}`);
  if (!raw) return new Array(30).fill('nodata');
  try {
    const parsed = JSON.parse(raw);
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
      return dates.map(d => decodeStatus(byDate[d] ?? 'nodata'));
    }

    // For non-UTC: each local date overlaps two UTC dates; take worst status
    return dates.map(localDate => {
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

// Reads current status from epoch-based minute data (m:{serviceId})
async function getCurrentStatus(serviceId: string): Promise<ServiceStatus> {
  const nowEpoch = Math.floor(Date.now() / 1000);

  const raw = await fetchFromKV(`m:${serviceId}`);
  if (!raw) {
    // Fallback: check today's daily summary
    const dailyRaw = await fetchFromKV(`daily:${serviceId}`);
    if (dailyRaw) {
      try {
        const parsed = JSON.parse(dailyRaw);
        const today = new Date().toISOString().slice(0, 10);
        const code = Array.isArray(parsed)
          ? (parsed as { date: string; status: string }[]).find(e => e.date === today)?.status
          : (parsed as Record<string, string>)[today];
        if (code) {
          const s = decodeStatus(code);
          if (s !== 'nodata') return s;
        }
      } catch { /* fall through */ }
    }
    return 'operational';
  }

  try {
    const all: Record<string, string> = JSON.parse(raw);

    // Find most recent entry at or before now
    let latestEpoch = -1;
    let latestCode = '';
    for (const [epochStr, code] of Object.entries(all)) {
      const epoch = parseInt(epochStr);
      if (epoch <= nowEpoch && epoch > latestEpoch) {
        latestEpoch = epoch;
        latestCode = code;
      }
    }

    if (latestCode) {
      const s = decodeStatus(latestCode);
      if (s !== 'nodata') return s;
    }
    return 'operational';
  } catch {
    return 'operational';
  }
}

function calculateOverallStatus(statuses: ServiceStatus[]): ServiceStatus {
  if (statuses.some(s => s === 'down')) return 'down';
  if (statuses.some(s => s === 'degraded')) return 'degraded';
  return 'operational';
}

export async function GET(request: NextRequest) {
  const tzParam = request.nextUrl.searchParams.get('tzOffset');
  const tzOffsetMinutes = Math.max(-720, Math.min(840, parseInt(tzParam ?? '0', 10) || 0));
  const brandParam = request.nextUrl.searchParams.get('brand') as BrandId | null;
  const now = new Date();
  try {
    const configRaw = await fetchFromKV('config:services');

    if (!configRaw) {
      console.error('[API] KV config unavailable - pulse worker may not be running');
      return NextResponse.json({
        error: 'Configuration unavailable',
        message: 'KV config:services not found. Ensure statuspage-pulse worker is deployed and running.'
      }, { status: 503 });
    }

    let services: ServiceDefinition[];
    try {
      const config: ServicesConfig = JSON.parse(configRaw);
      services = config.services;
      console.log(`[API] Using ${services.length} services from KV config (updated: ${config.updatedAt})`);
    } catch (e) {
      console.error('[API] Failed to parse config from KV:', e);
      return NextResponse.json({
        error: 'Configuration parse error',
        message: 'Failed to parse config:services from KV.'
      }, { status: 500 });
    }

    let servicesToUse = services;
    if (brandParam === 'byteside' || brandParam === 'sagelga') {
      const brandIds = new Set(SERVICES_BY_BRAND[brandParam].map(s => s.id));
      servicesToUse = services.filter(s => brandIds.has(s.id));
      console.log(`[API] brand filter=${brandParam} services=${servicesToUse.length}/${services.length}`);
    }

    const history: Record<string, (ServiceStatus | 'nodata')[]> = {};
    const dailyUptime: Record<string, (number | null)[]> = {};
    const dailyFuncUptime: Record<string, (number | null)[]> = {};
    const currentStatuses = await Promise.all(
      servicesToUse.map(async (svc) => {
        const [currentStatus, dailyHistory, { opPct, funcPct }] = await Promise.all([
          getCurrentStatus(svc.id),
          readDailyHistory(svc.id, tzOffsetMinutes),
          readDailyUptimePct(svc.id, tzOffsetMinutes),
        ]);
        history[svc.id] = dailyHistory;
        dailyUptime[svc.id] = opPct;
        dailyFuncUptime[svc.id] = funcPct;
        const pingRaw = await fetchFromKV(`ping:${svc.id}`);
        const responseTime = pingRaw !== null ? parseInt(pingRaw, 10) : null;
        return { ...svc, status: currentStatus, responseTime, statusCode: null };
      })
    );

    const data: StatusResponse = {
      status: calculateOverallStatus(currentStatuses.map(s => s.status)),
      checkedAt: now.toISOString(),
      services: currentStatuses,
      history,
      dailyUptime,
      dailyFuncUptime,
    };

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
