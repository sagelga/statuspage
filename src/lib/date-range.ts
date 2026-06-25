/**
 * Timezone offset and 30-day local calendar helpers.
 * Shared by the edge API routes and ServiceList bar/mosaic date labels.
 */

/**
 * Read the browser's local timezone offset in minutes (positive = east of UTC).
 * @param now - Reference date (defaults to current time)
 * @returns Offset minutes, e.g. UTC+7 → 420
 */
export function getTimezoneOffsetMinutes(now = new Date()): number {
  return -now.getTimezoneOffset();
}

/**
 * Clamp a timezone offset to ±12 hours (API safety bound).
 * @param minutes - Raw offset in minutes
 * @returns Clamped value between -720 and 840
 */
export function clampTimezoneOffsetMinutes(minutes: number): number {
  return Math.max(-720, Math.min(840, minutes));
}

/**
 * Parse and clamp the `tzOffset` query parameter from API requests.
 * @param param - Raw query string or null
 * @returns Clamped offset minutes (0 when missing/invalid)
 */
export function parseTimezoneOffsetParam(param: string | null): number {
  return clampTimezoneOffsetMinutes(parseInt(param ?? '0', 10) || 0);
}

/**
 * Build the last 30 local calendar days as ISO date strings for a given offset.
 * Index 0 = 29 days ago, index 29 = today in the client's local calendar.
 * @param tzOffsetMinutes - Minutes east of UTC
 * @param nowMs - Reference timestamp (defaults to Date.now())
 * @returns Array of 30 `YYYY-MM-DD` strings
 */
export function getLast30IsoDates(tzOffsetMinutes: number, nowMs = Date.now()): string[] {
  const dates: string[] = [];
  const nowLocal = nowMs + tzOffsetMinutes * 60000;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(nowLocal);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/**
 * Human-readable date labels paired 1:1 with getLast30IsoDates for the same offset.
 * @param tzOffsetMinutes - Minutes east of UTC (must match ISO array)
 * @param locale - BCP 47 locale (default Thai)
 * @param nowMs - Reference timestamp
 * @returns Array of 30 formatted labels aligned with ISO dates
 */
export function getLast30DateLabels(
  tzOffsetMinutes: number,
  locale = 'th-TH',
  nowMs = Date.now(),
): string[] {
  return getLast30IsoDates(tzOffsetMinutes, nowMs).map((iso) => {
    const [year, month, day] = iso.split('-').map(Number);
    const utcMs = Date.UTC(year, month - 1, day, 12, 0, 0);
    return new Date(utcMs).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  });
}

/**
 * Format a timezone offset as a readable UTC label (e.g. `UTC+07:00`).
 * @param tzOffsetMinutes - Minutes east of UTC
 * @returns Display string for mosaic panel header
 */
export function formatTimezoneLabel(tzOffsetMinutes: number): string {
  const sign = tzOffsetMinutes >= 0 ? '+' : '-';
  const h = String(Math.floor(Math.abs(tzOffsetMinutes) / 60)).padStart(2, '0');
  const m = String(Math.abs(tzOffsetMinutes) % 60).padStart(2, '0');
  return `UTC${sign}${h}:${m}`;
}