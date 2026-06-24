import type { BrandId } from '@/config';

export interface StatusApiUrlParams {
  tzOffset: number;
  brand?: BrandId;
  currentOnly?: boolean;
}

/** Build /api/status query URL for fast current or full payloads. */
export function buildStatusApiUrl({ tzOffset, brand, currentOnly }: StatusApiUrlParams): string {
  const params = new URLSearchParams();
  params.set('tzOffset', String(tzOffset));
  if (brand) params.set('brand', brand);
  if (currentOnly) params.set('currentOnly', 'true');
  return `/api/status?${params.toString()}`;
}