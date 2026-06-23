import { StatusResponse } from '@/types';

/** Merge a partial status payload into existing data (priority fetch before full). */
export function mergeStatusData(
  prev: StatusResponse | null,
  incoming: StatusResponse,
): StatusResponse {
  if (!prev) return incoming;

  const serviceMap = new Map(prev.services.map((s) => [s.id, s]));
  for (const s of incoming.services) {
    serviceMap.set(s.id, s);
  }

  return {
    status: incoming.status,
    checkedAt: incoming.checkedAt,
    services: Array.from(serviceMap.values()),
    history: { ...prev.history, ...incoming.history },
    dailyUptime: { ...prev.dailyUptime, ...incoming.dailyUptime },
    dailyFuncUptime: { ...prev.dailyFuncUptime, ...incoming.dailyFuncUptime },
  };
}