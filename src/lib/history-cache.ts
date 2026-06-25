/**
 * Client-side cache for immutable uptime history (local calendar days before today).
 * Keys: tzOffset + serviceId + ISO date. Stored in localStorage; never overwritten once written.
 */
import { SERVICES_BY_BRAND, type BrandId } from '@/config';
import { getLast30IsoDates } from '@/lib/date-range';
import type { ServiceStatus, StatusResponse } from '@/types';

const CACHE_VERSION = 'v1';
const IMMUTABLE_DAY_COUNT = 29;

export interface CachedDay {
  status: ServiceStatus | 'nodata';
  opPct: number | null;
  funcPct: number | null;
}

function getStorage(): Storage | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

export function cacheKey(tzOffset: number, serviceId: string, isoDate: string): string {
  return `status-hist:${CACHE_VERSION}:${tzOffset}:${serviceId}:${isoDate}`;
}

/** True for indices 0–28 (strictly before today's local calendar date). */
export function isImmutableDayIndex(index: number, tzOffset: number, nowMs = Date.now()): boolean {
  const dates = getLast30IsoDates(tzOffset, nowMs);
  return index >= 0 && index < dates.length - 1;
}

export function readCachedDay(
  tzOffset: number,
  serviceId: string,
  isoDate: string,
): CachedDay | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(cacheKey(tzOffset, serviceId, isoDate));
    if (!raw) return null;
    return JSON.parse(raw) as CachedDay;
  } catch {
    return null;
  }
}

export function writeCachedDay(
  tzOffset: number,
  serviceId: string,
  isoDate: string,
  day: CachedDay,
): void {
  const storage = getStorage();
  if (!storage) return;
  const key = cacheKey(tzOffset, serviceId, isoDate);
  if (storage.getItem(key) !== null) return;
  try {
    storage.setItem(key, JSON.stringify(day));
  } catch {
    // Quota exceeded or private mode — ignore
  }
}

export function persistImmutableFromResponse(data: StatusResponse, tzOffset: number): void {
  const dates = getLast30IsoDates(tzOffset);
  for (const svc of data.services) {
    const hist = data.history?.[svc.id];
    if (!hist || hist.length < 30) continue;
    for (let i = 0; i < IMMUTABLE_DAY_COUNT; i++) {
      writeCachedDay(tzOffset, svc.id, dates[i], {
        status: hist[i] ?? 'nodata',
        opPct: data.dailyUptime?.[svc.id]?.[i] ?? null,
        funcPct: data.dailyFuncUptime?.[svc.id]?.[i] ?? null,
      });
    }
  }
}

function fillServiceHistoryFromCache(
  serviceId: string,
  existing: (ServiceStatus | 'nodata')[] | undefined,
  tzOffset: number,
): (ServiceStatus | 'nodata')[] | undefined {
  const dates = getLast30IsoDates(tzOffset);
  if (!existing) {
    let anyCached = false;
    const result: (ServiceStatus | 'nodata')[] = new Array(30).fill('nodata');
    for (let i = 0; i < IMMUTABLE_DAY_COUNT; i++) {
      const cached = readCachedDay(tzOffset, serviceId, dates[i]);
      if (cached) {
        result[i] = cached.status;
        anyCached = true;
      }
    }
    return anyCached ? result : undefined;
  }

  const result = [...existing];
  while (result.length < 30) result.push('nodata');
  for (let i = 0; i < IMMUTABLE_DAY_COUNT; i++) {
    const cached = readCachedDay(tzOffset, serviceId, dates[i]);
    if (cached) result[i] = cached.status;
  }
  return result;
}

function fillNumericHistoryFromCache(
  serviceId: string,
  existing: (number | null)[] | undefined,
  tzOffset: number,
  field: 'opPct' | 'funcPct',
): (number | null)[] | undefined {
  const dates = getLast30IsoDates(tzOffset);
  const result: (number | null)[] = existing ? [...existing] : new Array(30).fill(null);
  while (result.length < 30) result.push(null);

  let anyCached = false;
  for (let i = 0; i < IMMUTABLE_DAY_COUNT; i++) {
    const cached = readCachedDay(tzOffset, serviceId, dates[i]);
    if (cached) {
      const val = field === 'opPct' ? cached.opPct : cached.funcPct;
      if (val !== null) {
        result[i] = val;
        anyCached = true;
      }
    }
  }
  return anyCached || existing ? result : existing;
}

export function hydrateHistoryFromCache(data: StatusResponse, tzOffset: number): StatusResponse {
  const serviceIds = new Set(data.services.map((s) => s.id));
  for (const brand of Object.keys(SERVICES_BY_BRAND) as BrandId[]) {
    for (const def of SERVICES_BY_BRAND[brand]) {
      serviceIds.add(def.id);
    }
  }

  const history = { ...data.history };
  const dailyUptime = data.dailyUptime ? { ...data.dailyUptime } : {};
  const dailyFuncUptime = data.dailyFuncUptime ? { ...data.dailyFuncUptime } : {};

  for (const serviceId of serviceIds) {
    const filledHistory = fillServiceHistoryFromCache(serviceId, history[serviceId], tzOffset);
    if (filledHistory) history[serviceId] = filledHistory;
    const op = fillNumericHistoryFromCache(serviceId, dailyUptime[serviceId], tzOffset, 'opPct');
    const func = fillNumericHistoryFromCache(serviceId, dailyFuncUptime[serviceId], tzOffset, 'funcPct');
    if (op) dailyUptime[serviceId] = op;
    if (func) dailyFuncUptime[serviceId] = func;
  }

  return {
    ...data,
    history,
    dailyUptime: Object.keys(dailyUptime).length > 0 ? dailyUptime : data.dailyUptime,
    dailyFuncUptime: Object.keys(dailyFuncUptime).length > 0 ? dailyFuncUptime : data.dailyFuncUptime,
  };
}

export function brandHasCachedHistory(brand: BrandId, tzOffset: number): boolean {
  const dates = getLast30IsoDates(tzOffset);
  const immutableDates = dates.slice(0, IMMUTABLE_DAY_COUNT);
  return SERVICES_BY_BRAND[brand].every((def) =>
    immutableDates.every((iso) => readCachedDay(tzOffset, def.id, iso) !== null),
  );
}

/** Build initial client state from cache so old-day bars can render before the first fetch. */
export function buildInitialStateFromCache(tzOffset: number): StatusResponse | null {
  if (!getStorage()) return null;

  const history: Record<string, (ServiceStatus | 'nodata')[]> = {};
  const dailyUptime: Record<string, (number | null)[]> = {};
  const dailyFuncUptime: Record<string, (number | null)[]> = {};
  let anyCached = false;

  for (const brand of Object.keys(SERVICES_BY_BRAND) as BrandId[]) {
    if (!brandHasCachedHistory(brand, tzOffset)) continue;
    anyCached = true;
    for (const def of SERVICES_BY_BRAND[brand]) {
      const filled = fillServiceHistoryFromCache(def.id, undefined, tzOffset);
      if (filled) history[def.id] = filled;
      const op = fillNumericHistoryFromCache(def.id, undefined, tzOffset, 'opPct');
      const func = fillNumericHistoryFromCache(def.id, undefined, tzOffset, 'funcPct');
      if (op) dailyUptime[def.id] = op;
      if (func) dailyFuncUptime[def.id] = func;
    }
  }

  if (!anyCached) return null;

  return {
    status: 'operational',
    checkedAt: new Date(0).toISOString(),
    services: [],
    history,
    dailyUptime: Object.keys(dailyUptime).length > 0 ? dailyUptime : undefined,
    dailyFuncUptime: Object.keys(dailyFuncUptime).length > 0 ? dailyFuncUptime : undefined,
  };
}