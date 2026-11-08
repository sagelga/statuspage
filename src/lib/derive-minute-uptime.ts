/**
 * Single-pass derivation of current status and 30-day uptime from m:{id} epoch maps.
 * Used by /api/status — extracted for unit testing the shipped compute path.
 */
import { decodeStatus } from '@/lib/decode-status';
import { getLast30IsoDates } from '@/lib/date-range';
import type { ServiceStatus } from '@/types';

interface DayBucket {
  start: number;
  end: number;
  operational: number;
  functional: number;
  known: number;
}

function buildDayBuckets(dates: string[], tzOffsetMinutes: number): DayBucket[] {
  const tzOffsetSec = tzOffsetMinutes * 60;
  return dates.map((localDate) => {
    const start = Math.floor(new Date(`${localDate}T00:00:00Z`).getTime() / 1000) - tzOffsetSec;
    return { start, end: start + 86400, operational: 0, functional: 0, known: 0 };
  });
}

function findDayIndex(epoch: number, buckets: DayBucket[]): number {
  let lo = 0;
  let hi = buckets.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (epoch < buckets[mid].start) hi = mid - 1;
    else if (epoch >= buckets[mid].end) lo = mid + 1;
    else return mid;
  }
  return -1;
}

function countMinuteCode(bucket: DayBucket, code: string): void {
  bucket.known++;
  if (code === 'o' || code === 'operational') {
    bucket.operational++;
    bucket.functional++;
  } else if (code === 'd' || code === 'degraded') {
    bucket.functional++;
  }
}

/**
 * Single pass over m:{id} data for current status + 30-day uptime buckets.
 * @param nowMs - Reference time for the 30-day window (defaults to Date.now())
 */
export function deriveFromMinuteMap(
  all: Record<string, string> | null,
  tzOffsetMinutes: number,
  nowEpoch: number,
  nowMs = Date.now(),
): { currentStatus: ServiceStatus; opPct: (number | null)[]; funcPct: (number | null)[] } {
  const empty = {
    currentStatus: 'operational' as ServiceStatus,
    opPct: new Array<number | null>(30).fill(null),
    funcPct: new Array<number | null>(30).fill(null),
  };
  if (!all) return empty;

  const dates = getLast30IsoDates(tzOffsetMinutes, nowMs);
  const buckets = buildDayBuckets(dates, tzOffsetMinutes);
  let latestEpoch = -1;
  let latestCode = '';

  for (const [epochStr, code] of Object.entries(all)) {
    const epoch = parseInt(epochStr, 10);
    if (Number.isNaN(epoch)) continue;

    if (epoch <= nowEpoch && epoch > latestEpoch) {
      latestEpoch = epoch;
      latestCode = code;
    }

    const idx = findDayIndex(epoch, buckets);
    if (idx >= 0) countMinuteCode(buckets[idx], code);
  }

  const opPct = buckets.map((b) => (b.known === 0 ? null : (b.operational / b.known) * 100));
  const funcPct = buckets.map((b) => (b.known === 0 ? null : (b.functional / b.known) * 100));

  let currentStatus: ServiceStatus = 'operational';
  if (latestCode) {
    const s = decodeStatus(latestCode);
    if (s !== 'nodata') currentStatus = s;
  }

  return { currentStatus, opPct, funcPct };
}
