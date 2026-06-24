export function getTimezoneOffsetMinutes(now = new Date()): number {
  return -now.getTimezoneOffset();
}

export function clampTimezoneOffsetMinutes(minutes: number): number {
  return Math.max(-720, Math.min(840, minutes));
}

export function parseTimezoneOffsetParam(param: string | null): number {
  return clampTimezoneOffsetMinutes(parseInt(param ?? '0', 10) || 0);
}

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

export function formatTimezoneLabel(tzOffsetMinutes: number): string {
  const sign = tzOffsetMinutes >= 0 ? '+' : '-';
  const h = String(Math.floor(Math.abs(tzOffsetMinutes) / 60)).padStart(2, '0');
  const m = String(Math.abs(tzOffsetMinutes) % 60).padStart(2, '0');
  return `UTC${sign}${h}:${m}`;
}