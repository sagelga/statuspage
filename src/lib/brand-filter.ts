/**
 * Brand-scoped filtering for KV service lists and API query params.
 */
import { SERVICES_BY_BRAND, BrandId } from '@/config';
import type { ServiceDefinition } from '@/types';

/**
 * Keep only services that belong to the given brand.
 * @param services - Full or partial service list from KV
 * @param brand - Active brand id
 * @returns Filtered array matching SERVICES_BY_BRAND[brand] ids
 */
export function filterServicesByBrand<T extends { id: string }>(
  services: T[],
  brand: BrandId,
): T[] {
  const brandIds = new Set(SERVICES_BY_BRAND[brand].map((s) => s.id));
  return services.filter((s) => brandIds.has(s.id));
}

/**
 * Type guard for the `?brand=` API query parameter.
 * @param brand - Raw query value
 * @returns True when brand is a known BrandId
 */
export function isValidBrandParam(brand: string | null): brand is BrandId {
  return brand === 'byteside' || brand === 'sagelga';
}

/**
 * Filter ServiceDefinition objects by brand (alias for filterServicesByBrand).
 * @param services - Definitions from KV config:services
 * @param brand - Brand to keep
 * @returns Subset of definitions whose ids appear in SERVICES_BY_BRAND[brand]
 */
export function filterServiceDefinitions(
  services: ServiceDefinition[],
  brand: BrandId,
): ServiceDefinition[] {
  return filterServicesByBrand(services, brand);
}