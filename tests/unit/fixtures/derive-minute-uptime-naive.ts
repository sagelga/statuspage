/**
 * Naive 30×scan reference implementation kept only for the perf regression
 * test. Moved out of src/ so it is not shipped in the Worker bundle.
 */
import { decodeStatus } from '../../../src/lib/decode-status';
import { getLast30IsoDates } from '../../../src/lib/date-range';
import type { ServiceStatus } from '../../../src/types';

export function deriveFromMinuteMapNaive(
  all: Record<string, string> | null,
  tzOffsetMinutes: number,
  nowEpoch: number,
): { currentStatus: ServiceStatus; opPct: (number | null)[]; funcPct: (number | null)[] } {
  const empty = {
    currentStatus: 'operational' as ServiceStatus,
    opPct: new Array<number | null>(30).fill(null),
    funcPct: new Array<number | null>(30).fill(null),
  };
  if (!all) return empty;

  const dates = getLast30IsoDates(tzOffsetMinutes);
  const tzOffsetSec = tzOffsetMinutes * 60;
  const opPct: (number | null)[] = [];
  const funcPct: (number | null)[] = [];

  for (const localDate of dates) {
    const localDayStart =
      Math.floor(new Date(`${localDate}T00:00:00Z`).getTime() / 1000) - tzOffsetSec;
    const localDayEnd = localDayStart + 86400;
    let operational = 0;
    let functional = 0;
    let known = 0;
    for (const [epochStr, code] of Object.entries(all)) {
      const epoch = parseInt(epochStr, 10);
      if (epoch >= localDayStart && epoch < localDayEnd) {
        known++;
        if (code === 'o' || code === 'operational') {
          operational++;
          functional++;
        } else if (code === 'd' || code === 'degraded') {
          functional++;
        }
      }
    }
    opPct.push(known === 0 ? null : (operational / known) * 100);
    funcPct.push(known === 0 ? null : (functional / known) * 100);
  }

  let latestEpoch = -1;
  let latestCode = '';
  for (const [epochStr, code] of Object.entries(all)) {
    const epoch = parseInt(epochStr, 10);
    if (epoch <= nowEpoch && epoch > latestEpoch) {
      latestEpoch = epoch;
      latestCode = code;
    }
  }
  let currentStatus: ServiceStatus = 'operational';
  if (latestCode) {
    const s = decodeStatus(latestCode);
    if (s !== 'nodata') currentStatus = s;
  }

  return { currentStatus, opPct, funcPct };
}
