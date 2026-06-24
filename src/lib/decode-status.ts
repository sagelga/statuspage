import type { ServiceStatus } from '@/types';

export const STATUS_PRIORITY: Record<string, number> = {
  x: 2, down: 2,
  d: 1, degraded: 1,
  o: 0, operational: 0,
  nodata: -1,
};

export function decodeStatus(code: string): ServiceStatus | 'nodata' {
  if (code === 'o' || code === 'operational') return 'operational';
  if (code === 'd' || code === 'degraded') return 'degraded';
  if (code === 'x' || code === 'down') return 'down';
  return 'nodata';
}