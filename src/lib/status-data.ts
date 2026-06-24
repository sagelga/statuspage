import type { CurrentStatusResponse, StatusResponse } from '@/types';

function hasRecordKeys<T>(record: Record<string, T> | undefined): record is Record<string, T> {
  return record !== undefined && Object.keys(record).length > 0;
}

function toStatusResponse(incoming: StatusResponse | CurrentStatusResponse): StatusResponse {
  return {
    status: incoming.status,
    checkedAt: incoming.checkedAt,
    services: incoming.services,
    history: incoming.history ?? {},
    dailyUptime: incoming.dailyUptime,
    dailyFuncUptime: incoming.dailyFuncUptime,
  };
}

/** Merge a partial or full payload into existing data (fast current before full history). */
export function mergeStatusData(
  prev: StatusResponse | null,
  incoming: StatusResponse | CurrentStatusResponse,
): StatusResponse {
  if (!prev) return toStatusResponse(incoming);

  const serviceMap = new Map(prev.services.map((s) => [s.id, s]));
  for (const s of incoming.services) {
    serviceMap.set(s.id, s);
  }

  return {
    status: incoming.status,
    checkedAt: incoming.checkedAt,
    services: Array.from(serviceMap.values()),
    history: hasRecordKeys(incoming.history)
      ? { ...prev.history, ...incoming.history }
      : prev.history,
    dailyUptime: hasRecordKeys(incoming.dailyUptime)
      ? { ...prev.dailyUptime, ...incoming.dailyUptime }
      : prev.dailyUptime,
    dailyFuncUptime: hasRecordKeys(incoming.dailyFuncUptime)
      ? { ...prev.dailyFuncUptime, ...incoming.dailyFuncUptime }
      : prev.dailyFuncUptime,
  };
}