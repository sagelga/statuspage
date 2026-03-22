export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { SERVICES } from '@/config';
import type { ServiceDefinition } from '@/types';
import { StatusResponse, ServiceStatus } from '@/types';

interface ServicesConfig {
  services: ServiceDefinition[];
  updatedAt: string;
}

function getLast30Dates(): string[] {
  const dates: string[] = [];
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
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

async function readDailyHistory(serviceId: string): Promise<(ServiceStatus | 'nodata')[]> {
  const dates = getLast30Dates();
  const raw = await fetchFromKV(`daily:${serviceId}`);
  if (!raw) return new Array(30).fill('nodata');
  try {
    const parsed = JSON.parse(raw);
    const byDate: Record<string, ServiceStatus | 'nodata'> = {};
    if (Array.isArray(parsed)) {
      // array format: [{date, status}, ...]
      for (const e of parsed as { date: string; status: ServiceStatus | 'nodata' }[]) {
        byDate[e.date] = e.status;
      }
    } else {
      // object format: {"2026-03-16": "operational", ...}
      for (const [date, status] of Object.entries(parsed)) {
        byDate[date] = status as ServiceStatus | 'nodata';
      }
    }
    return dates.map(d => byDate[d] ?? 'nodata');
  } catch {
    return new Array(30).fill('nodata');
  }
}

async function getCurrentStatus(serviceId: string): Promise<ServiceStatus> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const raw = await fetchFromKV(`minutes:${serviceId}`);

  if (!raw) {
    const dailyRaw = await fetchFromKV(`daily:${serviceId}`);
    if (dailyRaw) {
      try {
        const parsed = JSON.parse(dailyRaw);
        let todayStatus: ServiceStatus | 'nodata' | undefined;
        if (Array.isArray(parsed)) {
          todayStatus = (parsed as { date: string; status: ServiceStatus | 'nodata' }[]).find(e => e.date === date)?.status;
        } else {
          todayStatus = (parsed as Record<string, ServiceStatus | 'nodata'>)[date];
        }
        if (todayStatus && todayStatus !== 'nodata') return todayStatus;
      } catch { /* fall through */ }
    }
    return 'operational';
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, Record<string, ServiceStatus | 'nodata'>>;
    const todayMinutes = parsed[date];
    if (!todayMinutes) return 'operational';

    // Calculate 1-based minute slot (0001-1440)
    // Hours * 60 + minutes gives us 0-1439; add 1 to get 1-1440
    const minuteSlot = now.getUTCHours() * 60 + now.getUTCMinutes() + 1;
    // Search backwards from current slot to find the most recent non-nodata status
    for (let slot = minuteSlot; slot >= 1; slot--) {
      const key = String(slot).padStart(4, '0');
      const status = todayMinutes[key];
      if (status && status !== 'nodata') return status as ServiceStatus;
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

export async function GET() {
  const now = new Date();
  try {
    // Read services config from KV (written by pulse worker)
    const configRaw = await fetchFromKV('config:services');

    if (!configRaw) {
      // KV unavailable - return error so frontend shows error state
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

    const history: Record<string, (ServiceStatus | 'nodata')[]> = {};
    const currentStatuses = await Promise.all(
      services.map(async (svc) => {
        const [currentStatus, dailyHistory] = await Promise.all([
          getCurrentStatus(svc.id),
          readDailyHistory(svc.id),
        ]);
        history[svc.id] = dailyHistory;
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
    };

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
