/**
 * Brand-scoped filtering for KV service lists and API query params.
 */
import { SERVICES_BY_BRAND, BrandId } from '@/config';

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