/**
 * Builds the JSON payloads for GET /api/status from a KV-like store.
 * The store is injected so the response logic can be unit tested without
 * Cloudflare bindings; the route supplies the real namespace.
 */
import { getLast30IsoDates } from '@/lib/date-range';
import { currentStatusFromDaily, parseDailySummary, readDailyHistory } from '@/lib/daily-summary';
import { deriveFromMinuteMap } from '@/lib/derive-minute-uptime';
import { parseMinuteMap } from '@/lib/minute-map';
import { aggregateStatus } from '@/lib/status-policy';
import type {
  CurrentStatusResponse,
  ServiceDefinition,
  ServiceResult,
  ServiceStatus,
  StatusResponse,
} from '@/types';

/** Minimal read-only view of the STATUS_HISTORY KV namespace. */
export interface StatusStore {
  get(key: string): Promise<string | null>;
}

export type ServicesConfigResult =
  | { ok: true; services: ServiceDefinition[] }
  | { ok: false; status: 500 | 503; error: string; message: string };

interface ServicesConfigPayload {
  services: ServiceDefinition[];
  updatedAt?: string;
}

/**
 * Read and validate the pulse worker's `config:services` entry.
 * Distinguishes a missing binding/value (503) from malformed JSON (500),
 * matching the API's existing error contract.
 */
export async function loadServicesConfig(store: StatusStore): Promise<ServicesConfigResult> {
  const raw = await store.get('config:services');
  if (!raw) {
    return {
      ok: false,
      status: 503,
      error: 'Configuration unavailable',
      message:
        'KV config:services not found. Ensure statuspage-pulse worker is deployed and running.',
    };
  }

  try {
    const config = JSON.parse(raw) as ServicesConfigPayload;
    if (!Array.isArray(config.services)) throw new Error('Invalid config payload');
    return { ok: true, services: config.services };
  } catch {
    return {
      ok: false,
      status: 500,
      error: 'Configuration parse error',
      message: 'Failed to parse config:services from KV.',
    };
  }
}

function parseResponseTime(raw: string | null): number | null {
  return raw !== null ? parseInt(raw, 10) : null;
}

async function loadCurrentService(
  store: StatusStore,
  service: ServiceDefinition,
  nowEpoch: number,
  todayIso: string,
): Promise<ServiceResult> {
  const [minuteRaw, pingRaw] = await Promise.all([
    store.get(`m:${service.id}`),
    store.get(`ping:${service.id}`),
  ]);

  const minuteMap = parseMinuteMap(minuteRaw);
  let status: ServiceStatus;

  if (minuteMap) {
    status = deriveFromMinuteMap(minuteMap, 0, nowEpoch).currentStatus;
  } else {
    const dailyRaw = await store.get(`daily:${service.id}`);
    status = currentStatusFromDaily(parseDailySummary(dailyRaw), todayIso) ?? 'operational';
  }

  return {
    ...service,
    status,
    responseTime: parseResponseTime(pingRaw),
    statusCode: null,
  };
}

interface FullServiceResult {
  service: ServiceResult;
  history: (ServiceStatus | 'nodata')[];
  operationalPct: (number | null)[];
  functionalPct: (number | null)[];
}

async function loadFullService(
  store: StatusStore,
  service: ServiceDefinition,
  tzOffsetMinutes: number,
  now: Date,
): Promise<FullServiceResult> {
  const nowEpoch = Math.floor(now.getTime() / 1000);
  const nowMs = now.getTime();
  const todayIso = now.toISOString().slice(0, 10);

  const [minuteRaw, dailyRaw, pingRaw] = await Promise.all([
    store.get(`m:${service.id}`),
    store.get(`daily:${service.id}`),
    store.get(`ping:${service.id}`),
  ]);

  const minuteMap = parseMinuteMap(minuteRaw);
  const dailySummary = parseDailySummary(dailyRaw);
  const { currentStatus, opPct, funcPct } = deriveFromMinuteMap(
    minuteMap,
    tzOffsetMinutes,
    nowEpoch,
    nowMs,
  );

  const status = minuteMap
    ? currentStatus
    : (currentStatusFromDaily(dailySummary, todayIso) ?? 'operational');

  return {
    service: {
      ...service,
      status,
      responseTime: parseResponseTime(pingRaw),
      statusCode: null,
    },
    history: readDailyHistory(
      dailySummary,
      tzOffsetMinutes,
      getLast30IsoDates(tzOffsetMinutes, nowMs),
    ),
    operationalPct: opPct,
    functionalPct: funcPct,
  };
}

/** Fast path: one status per service, no history. */
export async function buildCurrentStatusResponse(
  store: StatusStore,
  services: ServiceDefinition[],
  now: Date,
): Promise<CurrentStatusResponse> {
  const nowEpoch = Math.floor(now.getTime() / 1000);
  const todayIso = now.toISOString().slice(0, 10);

  const results = await Promise.all(
    services.map((service) => loadCurrentService(store, service, nowEpoch, todayIso)),
  );

  return {
    status: aggregateStatus(results.map((result) => result.status)),
    checkedAt: now.toISOString(),
    services: results,
    history: {},
  };
}

/** Full path: services plus 30-day history and uptime arrays. */
export async function buildFullStatusResponse(
  store: StatusStore,
  services: ServiceDefinition[],
  tzOffsetMinutes: number,
  now: Date,
): Promise<StatusResponse> {
  const loaded = await Promise.all(
    services.map((service) =>
      loadFullService(store, service, tzOffsetMinutes, now),
    ),
  );

  const history: Record<string, (ServiceStatus | 'nodata')[]> = {};
  const dailyUptime: Record<string, (number | null)[]> = {};
  const dailyFuncUptime: Record<string, (number | null)[]> = {};

  const results = loaded.map(({ service, history: serviceHistory, operationalPct, functionalPct }) => {
    history[service.id] = serviceHistory;
    dailyUptime[service.id] = operationalPct;
    dailyFuncUptime[service.id] = functionalPct;
    return service;
  });

  return {
    status: aggregateStatus(results.map((result) => result.status)),
    checkedAt: now.toISOString(),
    services: results,
    history,
    dailyUptime,
    dailyFuncUptime,
  };
}
