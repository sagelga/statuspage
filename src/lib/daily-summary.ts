/**
 * Parsing and timezone-aware reading of KV `daily:{serviceId}` payloads.
 * The pulse worker may store either an array of `{ date, status }` entries
 * or a `{ "YYYY-MM-DD": code }` object, so both shapes are normalised here.
 */
import { decodeStatus, STATUS_PRIORITY } from '@/lib/decode-status';
import type { ServiceStatus } from '@/types';

export type DailySummary = Record<string, string>;

/**
 * Normalise a raw KV daily payload into a date → code map.
 * Returns null for missing, empty, malformed, or non-object payloads.
 */
export function parseDailySummary(raw: string | null): DailySummary | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const byDate: DailySummary = {};
      for (const entry of parsed as { date?: unknown; status?: unknown }[]) {
        if (typeof entry?.date === 'string' && typeof entry?.status === 'string') {
          byDate[entry.date] = entry.status;
        }
      }
      return byDate;
    }
    if (parsed !== null && typeof parsed === 'object') {
      const byDate: DailySummary = {};
      for (const [date, status] of Object.entries(parsed)) {
        if (typeof status === 'string') byDate[date] = status;
      }
      return byDate;
    }
  } catch {
    // Malformed KV values are treated as no data.
  }
  return null;
}

/**
 * Build a 30-day history array aligned with `dates`.
 * For non-UTC clients each local day overlaps two UTC days, so the worse of
 * the two codes wins (matching the pulse worker's UTC day boundaries).
 */
export function readDailyHistory(
  summary: DailySummary | null,
  tzOffsetMinutes: number,
  dates: readonly string[],
): (ServiceStatus | 'nodata')[] {
  if (!summary) return new Array(dates.length).fill('nodata');

  if (tzOffsetMinutes === 0) {
    return dates.map((date) => decodeStatus(summary[date] ?? 'nodata'));
  }

  return dates.map((localDate) => {
    const localDateMs = new Date(`${localDate}T00:00:00Z`).getTime();
    const outsideDate = new Date(
      localDateMs + (tzOffsetMinutes > 0 ? -86400000 : 86400000),
    )
      .toISOString()
      .slice(0, 10);

    const outsideCode = summary[outsideDate] ?? 'nodata';
    const localCode = summary[localDate] ?? 'nodata';
    // The two UTC days that overlap this local day, in chronological order.
    const first = tzOffsetMinutes > 0 ? outsideCode : localCode;
    const second = tzOffsetMinutes > 0 ? localCode : outsideCode;

    return decodeStatus(
      (STATUS_PRIORITY[first] ?? -1) >= (STATUS_PRIORITY[second] ?? -1) ? first : second,
    );
  });
}

/**
 * Today's status from a daily summary, used when minute data is unavailable.
 * Returns null for missing or `nodata` values.
 */
export function currentStatusFromDaily(
  summary: DailySummary | null,
  todayIso: string,
): ServiceStatus | null {
  const code = summary?.[todayIso];
  if (!code) return null;
  const status = decodeStatus(code);
  return status === 'nodata' ? null : status;
}
