/**
 * Turns an epoch-keyed minute map into 1440 local-minute cells for one day.
 * Used by GET /api/minutes/[serviceId]/[date].
 */
import { decodeStatus } from '@/lib/decode-status';
import type { MinuteMap } from '@/lib/minute-map';
import type { ServiceStatus } from '@/types';

export const MINUTES_PER_DAY = 1440;

function emptyMinuteCells(): (ServiceStatus | 'nodata')[] {
  return new Array(MINUTES_PER_DAY).fill('nodata');
}

/**
 * Map epoch-second KV entries onto a local calendar day.
 * @param minuteMap - Epoch seconds → compact status code
 * @param date - Local calendar day (`YYYY-MM-DD`)
 * @param tzOffsetMinutes - Minutes east of UTC
 */
export function buildMinuteCells(
  minuteMap: MinuteMap | null,
  date: string,
  tzOffsetMinutes: number,
): (ServiceStatus | 'nodata')[] {
  if (!minuteMap) return emptyMinuteCells();

  const localDayStart =
    Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000) - tzOffsetMinutes * 60;
  const localDayEnd = localDayStart + 86400;
  const minutes = emptyMinuteCells();

  for (const [epochStr, code] of Object.entries(minuteMap)) {
    const epoch = parseInt(epochStr, 10);
    if (epoch < localDayStart || epoch >= localDayEnd) continue;
    const index = Math.floor((epoch - localDayStart) / 60);
    if (index >= 0 && index < MINUTES_PER_DAY) {
      minutes[index] = decodeStatus(code);
    }
  }

  return minutes;
}
