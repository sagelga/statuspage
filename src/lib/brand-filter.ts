import { SERVICES_BY_BRAND, BrandId } from '@/config';
import type { ServiceDefinition } from '@/types';

export function filterServicesByBrand<T extends { id: string }>(
  services: T[],
  brand: BrandId,
): T[] {
  const brandIds = new Set(SERVICES_BY_BRAND[brand].map((s) => s.id));
  return services.filter((s) => brandIds.has(s.id));
}

export function isValidBrandParam(brand: string | null): brand is BrandId {
  return brand === 'byteside' || brand === 'sagelga';
}

export function filterServiceDefinitions(
  services: ServiceDefinition[],
  brand: BrandId,
): ServiceDefinition[] {
  return filterServicesByBrand(services, brand);
}