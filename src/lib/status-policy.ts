/**
 * Single source of truth for status aggregation and uptime thresholds.
 * Used by API response builders and by the client service list.
 */
import type { ServiceStatus } from '@/types';

/** A day at or above this uptime percentage is always shown as operational. */
export const UPTIME_OPERATIONAL_THRESHOLD = 99.5;

/** A day below this uptime percentage (and functional uptime) is shown as down. */
export const UPTIME_DEGRADED_THRESHOLD = 95;

/**
 * Combine per-service statuses into the page-level status.
 * Severity order: down > degraded > operational.
 */
export function aggregateStatus(statuses: readonly ServiceStatus[]): ServiceStatus {
  if (statuses.includes('down')) return 'down';
  if (statuses.includes('degraded')) return 'degraded';
  return 'operational';
}

/**
 * Resolve the colour/state of a single day bar from its uptime rates.
 *
 * - No uptime data: keep the daily history status (`fallback`).
 * - >= 99.5% operational minutes: operational.
 * - < 95% operational, and functional uptime also below 95%: down.
 * - < 95% operational but service still responded (functional >= 95%): degraded.
 * - 95–99.5% (or no functional data): keep the daily history status.
 */
export function statusFromUptime(
  operationalPct: number | null,
  functionalPct: number | null,
  fallback: ServiceStatus | 'nodata',
): ServiceStatus | 'nodata' {
  if (operationalPct === null) return fallback;
  if (operationalPct >= UPTIME_OPERATIONAL_THRESHOLD) return 'operational';
  if (operationalPct >= UPTIME_DEGRADED_THRESHOLD) return fallback;
  if (functionalPct === null || functionalPct < UPTIME_DEGRADED_THRESHOLD) return 'down';
  return 'degraded';
}

/**
 * Percentage of operational minutes in a minute mosaic.
 * Returns null when every cell is `nodata`.
 */
export function calculateOperationalPct(
  minutes: readonly (ServiceStatus | 'nodata')[],
): string | null {
  let known = 0;
  let operational = 0;
  for (const minute of minutes) {
    if (minute === 'nodata') continue;
    known++;
    if (minute === 'operational') operational++;
  }
  if (known === 0) return null;
  return ((operational / known) * 100).toFixed(2);
}
