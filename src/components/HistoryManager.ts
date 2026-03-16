import type { ServiceResult, ServiceStatus } from '../types';

const HISTORY_DAYS = 30;
const MINUTE_TTL = HISTORY_DAYS * 24 * 60 * 60;

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function minuteOfDay(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function worstStatus(a: ServiceStatus | undefined, b: ServiceStatus): ServiceStatus {
  if (a === 'down' || b === 'down') return 'down';
  if (a === 'degraded' || b === 'degraded') return 'degraded';
  return 'operational';
}

export async function readAllDailyHistories(
  kv: KVNamespace,
  serviceIds: string[],
  now: Date,
): Promise<Record<string, (ServiceStatus | 'nodata')[]>> {
  const entries = await Promise.all(
    serviceIds.map(async (id) => {
      const daily = (await kv.get(`daily:${id}`, 'json')) as Record<string, ServiceStatus> | null;
      const arr: (ServiceStatus | 'nodata')[] = [];
      for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        arr.push(daily?.[dateKey(d)] ?? 'nodata');
      }
      return [id, arr] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function writeAllHistories(
  kv: KVNamespace,
  results: ServiceResult[],
  now: Date,
): Promise<void> {
  await Promise.all(results.map((r) => writeHistory(kv, r.id, r.status, now)));
}

async function writeHistory(
  kv: KVNamespace,
  serviceId: string,
  status: ServiceStatus,
  now: Date,
): Promise<void> {
  const today = dateKey(now);
  const minute = minuteOfDay(now);

  // Write minute-level sparse record {minute: status}
  const mKey = `minutes:${serviceId}:${today}`;
  const minutes = ((await kv.get(mKey, 'json')) as Record<string, ServiceStatus> | null) ?? {};
  minutes[minute] = status;
  await kv.put(mKey, JSON.stringify(minutes), { expirationTtl: MINUTE_TTL });

  // Update daily aggregated status (worst of the day)
  const dKey = `daily:${serviceId}`;
  const daily = ((await kv.get(dKey, 'json')) as Record<string, ServiceStatus> | null) ?? {};
  daily[today] = worstStatus(daily[today], status);

  // Prune entries older than HISTORY_DAYS
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - HISTORY_DAYS);
  const cutoffStr = dateKey(cutoff);
  for (const k of Object.keys(daily)) {
    if (k < cutoffStr) delete daily[k];
  }
  await kv.put(dKey, JSON.stringify(daily));
}

export async function readMinuteHistory(
  kv: KVNamespace,
  serviceId: string,
  date: string,
): Promise<(ServiceStatus | null)[]> {
  const data = (await kv.get(`minutes:${serviceId}:${date}`, 'json')) as Record<string, ServiceStatus> | null;
  const arr: (ServiceStatus | null)[] = new Array(1440).fill(null);
  if (data) {
    for (const [k, v] of Object.entries(data)) {
      arr[Number(k)] = v;
    }
  }
  return arr;
}
