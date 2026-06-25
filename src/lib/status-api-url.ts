/**
 * Builds /api/status query URLs for the three-phase client load sequence.
 */
import type { BrandId } from '@/config';

/** Parameters for constructing a status API request URL. */
export interface StatusApiUrlParams {
  /** Client timezone offset in minutes (east of UTC). */
  tzOffset: number;
  /** Optional brand filter (`byteside` | `sagelga`). */
  brand?: BrandId;
  /** When true, request badges only (fast path, empty history). */
  currentOnly?: boolean;
}

/**
 * Build the /api/status URL with tzOffset, optional brand, and currentOnly flags.
 * @param params - Query components
 * @returns Relative URL string for fetch()
 */
export function buildStatusApiUrl({ tzOffset, brand, currentOnly }: StatusApiUrlParams): string {
  const params = new URLSearchParams();
  params.set('tzOffset', String(tzOffset));
  if (brand) params.set('brand', brand);
  if (currentOnly) params.set('currentOnly', 'true');
  return `/api/status?${params.toString()}`;
}