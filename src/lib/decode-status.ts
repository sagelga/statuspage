/**
 * Maps compact KV status codes and full names to typed ServiceStatus values.
 * Used by /api/status and /api/minutes when reading pulse worker history.
 */
import type { ServiceStatus } from '@/types';

/** Severity ranking for tz day-boundary overlap (higher = worse). */
export const STATUS_PRIORITY: Record<string, number> = {
  x: 2, down: 2,
  d: 1, degraded: 1,
  o: 0, operational: 0,
  nodata: -1,
};

/**
 * Decode a KV or daily-summary status code to a typed status.
 * @param code - Compact (`o`/`d`/`x`) or full (`operational`/`degraded`/`down`) code
 * @returns Matching ServiceStatus, or `nodata` for unknown/missing codes
 */
export function decodeStatus(code: string): ServiceStatus | 'nodata' {
  if (code === 'o' || code === 'operational') return 'operational';
  if (code === 'd' || code === 'degraded') return 'degraded';
  if (code === 'x' || code === 'down') return 'down';
  return 'nodata';
}