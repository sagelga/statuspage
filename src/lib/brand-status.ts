import { SERVICES_BY_BRAND, type BrandId } from '@/config';
import type { StatusResponse } from '@/types';

export function countLoadedForBrand(data: StatusResponse | null, brand: BrandId): number {
  if (!data?.services) return 0;
  const brandIds = new Set(SERVICES_BY_BRAND[brand].map((s) => s.id));
  return data.services.filter((s) => brandIds.has(s.id)).length;
}

export function brandHasHistory(data: StatusResponse | null, brand: BrandId): boolean {
  if (!data?.history) return false;
  return SERVICES_BY_BRAND[brand].every((s) => (data.history[s.id]?.length ?? 0) === 30);
}