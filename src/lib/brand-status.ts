/**
 * Client-side helpers for detecting when a brand's status data is fully loaded.
 */
import { SERVICES_BY_BRAND, type BrandId } from '@/config';
import type { ServiceStatus, StatusResponse } from '@/types';

/**
 * Count how many services for a brand are present in the merged client state.
 * @param data - Current StatusResponse or null before first fetch
 * @param brand - Brand to count
 * @returns Number of matching service results (0 when data is null)
 */
export function countLoadedForBrand(data: StatusResponse | null, brand: BrandId): number {
  if (!data?.services) return 0;
  const brandIds = new Set(SERVICES_BY_BRAND[brand].map((s) => s.id));
  return data.services.filter((s) => brandIds.has(s.id)).length;
}

/**
 * Check whether a single service has a complete 30-day history array.
 * @param history - History map from StatusResponse
 * @param serviceId - Service to check
 * @returns True when history[serviceId] has exactly 30 entries
 */
export function serviceHasHistory(
  history: Record<string, (ServiceStatus | 'nodata')[]> | undefined,
  serviceId: string,
): boolean {
  return (history?.[serviceId]?.length ?? 0) === 30;
}

/**
 * True when every service in a brand has 30-day history loaded.
 * Used to hide the history-loading skeleton bars.
 * @param data - Merged client state
 * @param brand - Active brand
 * @returns True when all SERVICES_BY_BRAND[brand] ids have 30-day history arrays
 */
export function brandHasHistory(data: StatusResponse | null, brand: BrandId): boolean {
  if (!data?.history) return false;
  return SERVICES_BY_BRAND[brand].every((s) => serviceHasHistory(data.history, s.id));
}