/**
 * Parsing for the compact KV `m:{serviceId}` epoch→code map shared by both
 * status API routes.
 */
export type MinuteMap = Record<string, string>;

/** Parse a raw minute-map payload; malformed values become null (no data). */
export function parseMinuteMap(raw: string | null): MinuteMap | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed as MinuteMap;
  } catch {
    return null;
  }
}
